"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "@/types/database";

export function useBookmarks(userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch all bookmarks (single source of truth)
   */
  const fetchBookmarks = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setBookmarks(data);
    }

    setIsLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    if (!userId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

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
        async () => {
          // Always refetch to guarantee consistency
          await fetchBookmarks();
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, supabase, fetchBookmarks]);

  /**
   * Add bookmark
   */
  const addBookmark = async (
    title: string,
    url: string
  ): Promise<void> => {
    await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: userId,
    });

    // Ensure UI consistency even if realtime lags
    await fetchBookmarks();
  };

  /**
   * Delete bookmark
   */
  const deleteBookmark = async (id: string): Promise<void> => {
    await supabase.from("bookmarks").delete().eq("id", id);

    // Ensure UI consistency
    await fetchBookmarks();
  };

  return {
    bookmarks,
    addBookmark,
    deleteBookmark,
    isLoading,
  };
}
