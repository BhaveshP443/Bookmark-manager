"use client";

import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">

      {/* Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[40px_40px]"></div>

      {/* Aurora Glow */}
      <div className="absolute inset-0 bg-linear-to-br from-purple-700/20 via-transparent to-blue-700/20"></div>

      {/* Floating Blobs */}
      <div className="absolute w-125 h-125 bg-purple-600/30 rounded-full blur-3xl animate-blob -top-37.5 -left-37.5"></div>
      <div className="absolute w-125 h-125 bg-blue-600/30 rounded-full blur-3xl animate-blob animation-delay-2000 -bottom-37.5 -right-37.5"></div>

      {/* Login Card */}
      <div className="relative z-10 backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-10 shadow-2xl w-100 text-center transition-all duration-300 hover:shadow-purple-500/20">

        <h1 className="text-3xl font-bold mb-3 bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Bookmark Manager
        </h1>

        <p className="text-gray-400 mb-8 text-sm">
          Save and manage your favorite links securely.
        </p>

        <button
          onClick={handleLogin}
          className="w-full py-3 bg-white text-black font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:bg-gray-200 active:scale-95 shadow-lg"
        >
          Login with Google
        </button>

      </div>
    </div>
  );
}
