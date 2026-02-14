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
  const { data } = await supabase
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

  if (data) {
    setBookmarks((prev) => [data as Bookmark, ...prev]);
  }
};


  const deleteBookmark = async (
    id: string
  ): Promise<void> => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  return { bookmarks, addBookmark, deleteBookmark, isSubscribed };
}
