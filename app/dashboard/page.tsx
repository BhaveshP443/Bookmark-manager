import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookmarkPage from "@/components/bookmarks/BookmarkPage";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return <BookmarkPage user={user} />;
}
