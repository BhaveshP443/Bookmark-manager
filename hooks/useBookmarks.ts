"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "@/types/database";

export function useBookmarks(userId: string) {
  const supabase = useMemo(() => createClient(), []);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let channel: any;

    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Initial fetch error:", error);
        return;
      }

      if (data) {
        setBookmarks(data);
      }
    };

    fetchBookmarks();

    channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newRow = payload.new as Bookmark | undefined;
          const oldRow = payload.old as Bookmark | undefined;

          console.log("Realtime event:", payload.eventType);
          console.log("Payload user_id:", newRow?.user_id);
          console.log("Current userId:", userId);

          if (payload.eventType === "INSERT" && newRow) {
            setBookmarks((prev) => {
              if (prev.some((b) => b.id === newRow.id)) return prev;
              return [newRow, ...prev];
            });
          }

          if (payload.eventType === "DELETE" && oldRow) {
            setBookmarks((prev) =>
              prev.filter((b) => b.id !== oldRow.id)
            );
          }

          if (payload.eventType === "UPDATE" && newRow) {
            setBookmarks((prev) =>
              prev.map((b) =>
                b.id === newRow.id ? newRow : b
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);

        if (status === "SUBSCRIBED") setIsSubscribed(true);
        if (status === "CLOSED" || status === "TIMED_OUT")
          setIsSubscribed(false);
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, supabase]);

  const addBookmark = async (
    title: string,
    url: string
  ): Promise<void> => {
    const { error } = await supabase.from("bookmarks").insert([
      {
        title,
        url,
        user_id: userId,
      },
    ]);

    if (error) {
      console.error("Insert error:", error);
    }
  };

  const deleteBookmark = async (
    id: string
  ): Promise<void> => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
    }
  };

  return {
    bookmarks,
    addBookmark,
    deleteBookmark,
    isSubscribed,
  };
}
