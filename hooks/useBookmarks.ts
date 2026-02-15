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
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (data) setBookmarks(data);
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
          if (payload.eventType === "INSERT") {
            setBookmarks((prev) => {
              const exists = prev.find(
                (b) => b.id === payload.new.id
              );
              if (exists) return prev;
              return [payload.new as Bookmark, ...prev];
            });
          }

          if (payload.eventType === "DELETE") {
            setBookmarks((prev) =>
              prev.filter(
                (b) => b.id !== payload.old.id
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
        setIsSubscribed(status === "SUBSCRIBED");
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, supabase]);

  // ✅ Optimistic update
  const addBookmark = async (
    title: string,
    url: string
  ): Promise<void> => {
    const { data, error } = await supabase
      .from("bookmarks")
      .insert([
        {
          title,
          url,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setBookmarks((prev) => {
        const exists = prev.find((b) => b.id === data.id);
        if (exists) return prev;
        return [data as Bookmark, ...prev];
      });
    }
  };

  const deleteBookmark = async (
    id: string
  ): Promise<void> => {
    await supabase.from("bookmarks").delete().eq("id", id);

    // Optimistic delete
    setBookmarks((prev) =>
      prev.filter((b) => b.id !== id)
    );
  };

  return { bookmarks, addBookmark, deleteBookmark, isSubscribed };
}
