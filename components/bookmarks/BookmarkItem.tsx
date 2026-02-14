"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "@/types/database";

type Props = {
  bookmark: Bookmark;
  onDelete: (bookmark: Bookmark) => Promise<void>;
};

export default function BookmarkItem({
  bookmark,
  onDelete,
}: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = async () => {
    setIsRemoving(true);
    setIsLoading(true);

    setTimeout(async () => {
      await onDelete(bookmark);
      setIsLoading(false);
    }, 250);
  };

  // 🔥 Ripple effect + delete trigger
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;

    const circle = document.createElement("span");
    circle.className = "ripple-effect";

    const rect = button.getBoundingClientRect();
    const size = 20;

    circle.style.width = circle.style.height = `${size}px`;
    circle.style.left = `${e.clientX - rect.left - size / 2}px`;
    circle.style.top = `${e.clientY - rect.top - size / 2}px`;

    button.appendChild(circle);

    setTimeout(() => circle.remove(), 600);

    handleDelete();
  };

  return (
    <div
      className={`relative overflow-hidden flex justify-between items-center p-4 rounded-lg border border-white/10 shadow-md transition-all duration-300
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        ${isRemoving ? "opacity-0 translate-x-6 scale-95" : ""}
        hover:shadow-purple-500/20 hover:shadow-lg hover:border-purple-500/30
        bg-white/5`}
    >
      <a
        href={bookmark.url}
        target="_blank"
        className="text-blue-400 hover:underline"
      >
        {bookmark.title}
      </a>

      <button
        onClick={handleClick}
        disabled={isLoading}
        className="relative px-4 py-2 bg-red-600 rounded-lg text-white text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:bg-red-700 active:scale-95 disabled:opacity-60 overflow-hidden"
      >
        {isLoading ? (
          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
        ) : (
          "Delete"
        )}
      </button>
    </div>
  );
}
