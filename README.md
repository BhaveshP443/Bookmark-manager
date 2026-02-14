````md
# 📌 Bookmark Manager (Google OAuth + Realtime)

A production-ready bookmark manager built with **Next.js App Router** and **Supabase (Auth, Database, Realtime)**.

Users authenticate via Google OAuth and manage private bookmarks with real-time updates across multiple tabs — without page refresh.

---

## 🚀 Live Demo

**Vercel URL:**  
https://your-vercel-domain.vercel.app

**GitHub Repository:**  
https://github.com/your-username/your-repo

---

## 🛠 Tech Stack

- **Next.js (App Router, Server Components)**
- **Supabase**
  - Authentication (Google OAuth)
  - PostgreSQL Database
  - Realtime subscriptions
- **Tailwind CSS**
- **Vercel (Deployment)**

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

To ensure proper DELETE and INSERT payload delivery in production, replica identity was set to FULL:

```sql
ALTER TABLE bookmarks REPLICA IDENTITY FULL;
```

Without this configuration, realtime events may fail in production.

---

## 🧠 Challenges Faced & Solutions

### 1️⃣ OAuth Redirect Loop in Production

**Problem:** After successful login, the app redirected back to login page.
**Cause:** Session cookies were not being persisted correctly in Next.js App Router.
**Solution:** Properly configured `createServerClient` using `await cookies()` and safe `setAll` cookie handling in Route Handlers.

---

### 2️⃣ Realtime Not Working in Production

**Problem:** Insert/Delete worked locally but not on deployed version.
**Cause:** PostgreSQL replica identity was not set to FULL.
**Solution:**

```sql
ALTER TABLE bookmarks REPLICA IDENTITY FULL;
```

---

### 3️⃣ Supabase Redirecting to localhost After Deployment

**Problem:** Production login redirected to `localhost:3000`.
**Cause:** Supabase Site URL was incorrectly set to localhost.
**Solution:**

* Updated Supabase Site URL to Vercel domain
* Added both local and production callback URLs
* Updated Google OAuth authorized origins

---

### 4️⃣ WebSocket TIMED_OUT in Development

**Cause:** React Strict Mode and Fast Refresh triggered multiple effect executions.
**Solution:** Stabilized Supabase client using `useMemo` and ensured proper channel cleanup inside `useEffect` return.

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

The final implementation satisfies all assignment requirements while following scalable architectural practices.


