"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "@/types/database";

export function useBookmarks(userId: string) {
  const supabase = useMemo(() => createClient(), []);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Centralized fetch function (stable reference)
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

    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    if (!userId) return;

    let channel: any;

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
        () => {
          // 🔥 Always refetch to ensure consistency across devices
          fetchBookmarks();
        }
      )
      .subscribe((status) => {
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
  }, [userId, supabase, fetchBookmarks]);

  // 🔹 Add bookmark (no optimistic update)
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
      console.error("Insert failed:", error);
    }
  };

  // 🔹 Delete bookmark
  const deleteBookmark = async (
    id: string
  ): Promise<void> => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete failed:", error);
    }
  };

  return {
    bookmarks,
    addBookmark,
    deleteBookmark,
    isSubscribed,
    loading,
  };
}
