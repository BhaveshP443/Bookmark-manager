"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "@/types/database";

export function useBookmarks(userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

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
        (payload) => {
          console.log("Realtime event:", payload.eventType);

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
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, supabase]);

  // 🔹 Insert (NO manual state update)
  const addBookmark = async (
    title: string,
    url: string
  ): Promise<void> => {
    const { error } = await supabase
      .from("bookmarks")
      .insert([
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

  // 🔹 Delete (NO manual state update)
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
  };
}
