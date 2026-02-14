"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "@/types/database";

export function useBookmarks(userId: string | undefined) {
  const supabaseRef = useRef(createClient());
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    if (!userId) return;

    const supabase = supabaseRef.current;
    let channel: any;

    const setupRealtime = async () => {
      // 🔥 Ensure session exists
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.log("No session yet...");
        return;
      }

      // 🔥 Set realtime auth token explicitly
      supabase.realtime.setAuth(session.access_token);

      const fetchBookmarks = async () => {
        const { data } = await supabase
          .from("bookmarks")
          .select("*")
          .order("created_at", { ascending: false });

        if (data) setBookmarks(data);
      };

      await fetchBookmarks();

      channel = supabase
        .channel("bookmarks-channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
          },
          (payload) => {
            console.log("Realtime event:", payload);
            fetchBookmarks();
          }
        )
        .subscribe((status) => {
          console.log("Realtime status:", status);
        });
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  const addBookmark = async (title: string, url: string) => {
    if (!userId) return;

    await supabaseRef.current.from("bookmarks").insert([
      { title, url, user_id: userId },
    ]);
  };

  const deleteBookmark = async (id: string) => {
    await supabaseRef.current.from("bookmarks").delete().eq("id", id);
  };

  return { bookmarks, addBookmark, deleteBookmark };
}
