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
        console.log("Initial fetch:", data.length);
        setBookmarks(data);
      }
    };

    // Initial load
    fetchBookmarks();

    // Realtime subscription
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
          console.log("Realtime event:", payload.eventType);
          console.log("Payload user_id:", payload.new?.user_id);
          console.log("Payload old user_id:", payload.old?.user_id);
          console.log("Current userId:", userId);

          if (payload.eventType === "INSERT") {
            setBookmarks((prev) => {
              const exists = prev.some(
                (b) => b.id === (payload.new as Bookmark).id
              );
              if (exists) return prev;
              return [payload.new as Bookmark, ...prev];
            });
          }

          if (payload.eventType === "DELETE") {
            setBookmarks((prev) =>
              prev.filter(
                (b) => b.id !== (payload.old as Bookmark).id
              )
            );
          }

          if (payload.eventType === "UPDATE") {
            setBookmarks((prev) =>
              prev.map((b) =>
                b.id === (payload.new as Bookmark).id
                  ? (payload.new as Bookmark)
                  : b
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);

        if (status === "SUBSCRIBED") {
          setIsSubscribed(true);
        }

        if (status === "CLOSED" || status === "TIMED_OUT") {
          setIsSubscribed(false);
        }
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
