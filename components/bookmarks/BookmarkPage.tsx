"use client";

import { useRouter } from "next/navigation";
import { useBookmarks } from "@/hooks/useBookmarks";
import BookmarkForm from "./BookmarkForm";
import BookmarkList from "./BookmarkList";
import { useState } from "react";
import Toast from "@/components/ui/Toast";
import { Bookmark } from "@/types/database";

type Props = {
  user: {
    id: string;
    user_metadata?: {
      name?: string;
    };
  };
};

export default function BookmarkPage({ user }: Props) {
  const router = useRouter();

  const { bookmarks, addBookmark, deleteBookmark } =
    useBookmarks(user.id);

  const [toast, setToast] = useState<{
    message: string;
    bookmark?: Bookmark;
  } | null>(null);

  const handleLogout = async () => {
    await fetch("/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  // ✅ ADD BOOKMARK WITH PROPER TYPE
  const handleAdd = async (
    title: string,
    url: string
  ): Promise<void> => {
    await addBookmark(title, url);

    setToast({
      message: "Bookmark added successfully",
    });

    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // ✅ DELETE WITH CORRECT TYPE
  const handleDelete = async (
    bookmark: Bookmark
  ): Promise<void> => {
    await deleteBookmark(bookmark.id);

    setToast({
      message: "Bookmark deleted",
      bookmark,
    });

    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // ✅ UNDO DELETE
  const handleUndo = async (): Promise<void> => {
    if (!toast?.bookmark) return;

    await addBookmark(
      toast.bookmark.title,
      toast.bookmark.url
    );

    setToast(null);
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">

      {/* Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* Aurora Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-700/20 via-transparent to-blue-700/20"></div>

      {/* Content Layer */}
      <div className="relative z-10 p-8">

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">
            Welcome, {user.user_metadata?.name ?? "User"}
          </h2>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 rounded-lg text-white font-semibold transition-all duration-300 hover:bg-red-700 hover:scale-105 active:scale-95"
          >
            Logout
          </button>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto space-y-6">
          <BookmarkForm addBookmark={handleAdd} />

          <BookmarkList
            bookmarks={bookmarks}
            onDelete={handleDelete}
          />
        </div>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            onUndo={toast.bookmark ? handleUndo : undefined}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
