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

      if (data) setBookmarks(data);
      if (error) console.error(error);
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
          console.log("Realtime event:", payload);

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

        if (status === "SUBSCRIBED") {
          setIsSubscribed(true);
        }

        if (status === "TIMED_OUT" || status === "CLOSED") {
          setIsSubscribed(false);
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, supabase]);

  // ❌ Do NOT manually update state
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

    if (error) console.error(error);
  };

  const deleteBookmark = async (
    id: string
  ): Promise<void> => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (error) console.error(error);
  };

  return { bookmarks, addBookmark, deleteBookmark, isSubscribed };
}
