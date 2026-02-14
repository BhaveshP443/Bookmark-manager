import { Bookmark } from "@/types/database";
import BookmarkItem from "./BookmarkItem";

type Props = {
  bookmarks: Bookmark[];
  onDelete: (bookmark: Bookmark) => void;
};

export default function BookmarkList({
  bookmarks,
  onDelete,
}: Props) {
  if (!bookmarks.length) {
    return <p className="text-gray-500">No bookmarks yet.</p>;
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((bookmark) => (
        <BookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
