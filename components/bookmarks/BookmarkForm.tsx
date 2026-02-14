"use client";

import { useState } from "react";

type Props = {
  addBookmark: (title: string, url: string) => Promise<void>;
};

export default function BookmarkForm({ addBookmark }: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !url.trim()) {
      setError("All fields are required.");
      return;
    }

    setError("");
    setIsLoading(true);

    await addBookmark(title, url);

    setTitle("");
    setUrl("");
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
      />

      <input
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
      />

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-purple-600 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:bg-purple-700 hover:scale-105 active:scale-95 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            Adding...
          </>
        ) : (
          "Add Bookmark"
        )}
      </button>
    </form>
  );
}
