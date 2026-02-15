"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "@/types/database";

export function useBookmarks(userId: string) {
  const supabase = useMemo(() => createClient(), []);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // ✅ Stable fetch function
  const fetchBookmarks = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookmarks(data);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (!userId) return;

    let channel: any;

    const init = async () => {
      setLoading(true);

      // Initial fetch
      await fetchBookmarks();

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
          async () => {
            // 🔥 Production-stable approach
            // Instead of mutating state using payload,
            // refetch fresh data from database
            await fetchBookmarks();
          }
        )
        .subscribe((status) => {
          console.log("Realtime status:", status);

          if (status === "SUBSCRIBED") {
            setIsSubscribed(true);
          }

          if (
            status === "CLOSED" ||
            status === "TIMED_OUT" ||
            status === "CHANNEL_ERROR"
          ) {
            setIsSubscribed(false);
          }
        });

      setLoading(false);
    };

    init();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, supabase, fetchBookmarks]);

  // ✅ Add bookmark
  const addBookmark = async (
    title: string,
    url: string
  ): Promise<void> => {
    await supabase.from("bookmarks").insert([
      {
        title,
        url,
        user_id: userId,
      },
    ]);
  };

  // ✅ Delete bookmark
  const deleteBookmark = async (
    id: string
  ): Promise<void> => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  return {
    bookmarks,
    addBookmark,
    deleteBookmark,
    loading,
    isSubscribed,
  };
}
