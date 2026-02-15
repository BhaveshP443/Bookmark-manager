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

    let channel: ReturnType<typeof supabase.channel>;

    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
        return;
      }

      if (data) {
        setBookmarks(data);
      }
    };

    // Initial fetch
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
          // 🔥 Always refetch for consistency
          fetchBookmarks();
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

  // 🔥 Optimistic insert (instant UI)
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
      console.error("Insert error:", error);
      return;
    }

    if (data) {
      setBookmarks((prev) => {
        // Prevent duplicates
        if (prev.find((b) => b.id === data.id)) return prev;
        return [data as Bookmark, ...prev];
      });
    }
  };

  // Delete handled fully by realtime refetch
  const deleteBookmark = async (id: string): Promise<void> => {
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
