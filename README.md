Author: Bhavesh Patidar
# 📌 Bookmark Manager (Google OAuth + Realtime)

A production-ready bookmark manager built with Next.js App Router and Supabase (Auth, Database, Realtime).

Users authenticate via Google OAuth and manage private bookmarks with real-time updates across multiple tabs — without page refresh.

---

## 🚀 Live Demo

Vercel URL:  
https://smartbookmark-manager.vercel.app/

GitHub Repository:  
https://github.com/BhaveshP443/Bookmark-manager

---

## 🛠 Tech Stack

- Next.js (App Router, Server Components)
- Supabase
  - Authentication (Google OAuth)
  - PostgreSQL Database
  - Realtime subscriptions
- Tailwind CSS
- Vercel (Deployment)

---

## ✅ Implemented Requirements

✔ Sign up and login using Google OAuth only  
✔ Add bookmark (URL + Title)  
✔ Bookmarks are private per user (RLS enforced)  
✔ Real-time updates across multiple tabs  
✔ Delete own bookmarks  
✔ Deployed on Vercel with live URL  

---

## 🏗 Architecture Overview

- Authentication handled by Supabase OAuth  
- OAuth callback implemented via Next.js Route Handler  
- Session persisted using server-side cookies (`createServerClient`)  
- `/dashboard` protected using Server Component auth check  
- Business logic separated via custom React hook (`useBookmarks`)  
- Realtime subscriptions filtered per user  

---

## 🗄 Database Schema

```sql
create table bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  url text not null,
  created_at timestamptz default now()
);
````

---

## 🔒 Row Level Security (RLS)

RLS is enabled to ensure bookmark isolation per user.

```sql
create policy "Users can view their own bookmarks"
on bookmarks
for select
using (auth.uid() = user_id);

create policy "Users can insert their own bookmarks"
on bookmarks
for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
on bookmarks
for delete
using (auth.uid() = user_id);
```

This guarantees:

* Users can only view their own bookmarks
* Users can only insert their own bookmarks
* Users can only delete their own bookmarks

---

## ⚡ Realtime Implementation

Realtime updates are implemented using Supabase `postgres_changes`:

```ts
filter: `user_id=eq.${userId}`
```

To ensure proper DELETE, INSERT AND UNDO DELETE payload delivery in production, replica identity was set to FULL:

```sql
ALTER TABLE bookmarks REPLICA IDENTITY FULL;
```

Without this configuration, realtime events may fail in production.

---

## 🧠 Challenges Faced & Solutions

### 1️⃣ OAuth Redirect Loop in Production

Problem:
After successful Google login, the app redirected back to the login page instead of `/dashboard`.

Cause:
Session cookies were not being persisted correctly when using Next.js App Router with Server Components. The Supabase session exchange completed, but cookies were not stored properly for subsequent requests.

Solution:

* Properly configured `createServerClient` using `await cookies()`
* Implemented correct `setAll` cookie handling inside Route Handlers
* Ensured session exchange (`exchangeCodeForSession`) completes before redirect
* Protected `/dashboard` using server-side session validation

---

### 2️⃣ Realtime Insert Events Inconsistent Across Devices

Problem:
Delete events worked across devices, but insert events were delayed, inconsistent, or only appeared after another database action.

Cause:
Directly mutating local state using `payload.new` from realtime events caused race conditions and inconsistent synchronization across multiple browser instances.

Solution:

* Switched to a production-stable strategy: on any realtime event → refetch fresh data from database
* Avoided relying solely on realtime payload mutation
* Ensured `bookmarks` table was included in `supabase_realtime` publication
* Enabled:

```sql
ALTER TABLE bookmarks REPLICA IDENTITY FULL;
```

This ensured reliable INSERT and DELETE propagation in production.

---

### 3️⃣ Supabase Redirecting to localhost After Deployment

Problem:
Production login redirected users to `http://localhost:3000` instead of the deployed Vercel domain.

Cause:
Supabase Site URL and OAuth redirect URLs were still configured for localhost.

Solution:

* Updated Supabase Site URL to the Vercel production domain
* Added both local and production callback URLs in Supabase Auth settings
* Updated Google OAuth Authorized JavaScript Origins and Redirect URIs

---

### 4️⃣ WebSocket TIMED_OUT in Development

Problem:
Realtime subscriptions randomly closed with `TIMED_OUT` during development.

Cause:
React Strict Mode and Fast Refresh triggered multiple `useEffect` executions, causing duplicate realtime subscriptions and premature channel closure.

Solution:

* Stabilized Supabase client using `useMemo`
* Ensured proper channel cleanup in `useEffect` return
* Verified single active subscription per user

---

### 5️⃣ PKCE Code Verifier & Invalid Refresh Token Errors

Problem:
Occasional authentication errors such as:

* `Invalid Refresh Token: Refresh Token Not Found`
* `PKCE code verifier not found in storage`

Cause:
Improper cookie persistence during OAuth flow and token refresh attempts in Server Components before session exchange was finalized.

Solution:

* Ensured `createServerClient` handled cookies correctly with `await cookies()`
* Restricted session exchange logic to Route Handlers
* Avoided calling `getSession()` before session exchange completed
* Cleared stale cookies during local testing

---


## 📦 Local Development Setup

1. Clone the repository

```bash
git clone <repo-url>
cd <project-folder>
```

2. Install dependencies

```bash
npm install
```

3. Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Run development server

```bash
npm run dev
```

---

## 🎯 Key Engineering Decisions

* Used App Router with SSR authentication
* Enforced strict data isolation via RLS
* Filtered realtime subscriptions per user
* Ensured production-safe cookie handling
* Addressed Postgres replica identity for stable realtime behavior

---

## 📌 Conclusion

This project demonstrates:

* Secure OAuth authentication
* Server-side session handling
* Realtime event architecture
* Proper RLS implementation
* Production debugging and deployment management




