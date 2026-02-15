"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "@/types/database";

export function useBookmarks(userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initial fetch (only once per user)
   */
  const fetchBookmarks = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setBookmarks(data);
    setIsLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    if (!userId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    fetchBookmarks();

    channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
          // filter: `user_id=eq.${userId}`,
          filter: undefined,

        },
        (payload) => {
          const newBookmark = payload.new as Bookmark;

          setBookmarks((prev) => {
            // Prevent duplicates
            if (prev.find((b) => b.id === newBookmark.id)) {
              return prev;
            }
            return [newBookmark, ...prev];
          });
        }
      )
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
      setBookmarks((prev) => [
        payload.new as Bookmark,
        ...prev,
      ]);
    }

    if (payload.eventType === "DELETE") {
      setBookmarks((prev) =>
        prev.filter(
          (b) => b.id !== (payload.old as Bookmark).id
        )
      );
    }
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
   * Add bookmark (Optimistic UI)
   */
  const addBookmark = async (
    title: string,
    url: string
  ): Promise<void> => {
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        title,
        url,
        user_id: userId,
      })
      .select()
      .single();

    if (error) return;

    if (data) {
      // Optimistic update (instant UI)
      setBookmarks((prev) => {
        if (prev.find((b) => b.id === data.id)) return prev;
        return [data as Bookmark, ...prev];
      });
    }
  };

  /**
   * Delete bookmark (Optimistic UI)
   */
  const deleteBookmark = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (error) return;

    // Instant UI update
    setBookmarks((prev) =>
      prev.filter((b) => b.id !== id)
    );
  };

  return {
    bookmarks,
    addBookmark,
    deleteBookmark,
    isLoading,
  };
}
