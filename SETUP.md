# Asteria Club Esprit — Supabase Setup & Deployment Guide

This guide describes how to connect the Asteria Club Esprit management platform to a fresh Supabase project or deploy to production.

---

## 1. Supabase Project Configuration

1. Create a new project in your [Supabase Dashboard](https://supabase.com/dashboard).
2. Retrieve your **Project URL**, **Anon / Publishable API Key**, and **Service Role Key** from `Project Settings -> API`.
3. Add these credentials into `.env.local` (and `.env` for server-side tools):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
   SUPABASE_SECRET_KEY=sb_secret_...

   DATABASE_URL="file:./dev.db"
   JWT_SECRET="asteria-super-secret-jwt-key-2026"
   ```

---

## 2. Apply Database Migrations & RLS Policies

Run the SQL migration script located in [`supabase/migrations/20260228_initial_schema.sql`](./supabase/migrations/20260228_initial_schema.sql) in the **Supabase SQL Editor**:
- Creates `profiles`, `departments`, `board_seats`, `events`, `rsvps`, `attendance_records`, `tasks`, `task_comments`, `announcements`, `applications`, and `audit_logs`.
- Establishes `handle_new_user()` trigger to automatically create profiles when users sign up via Supabase Auth.
- Enables **Row Level Security (RLS)** with policies for Board, HoD, Member, and Public roles.
- Configures **Supabase Realtime** publications on `tasks`, `attendance_records`, and `announcements`.

---

## 3. Storage Buckets (Optional)

In your Supabase Dashboard under `Storage`:
1. Create a public bucket called `avatars` for member profile pictures.
2. Create an authenticated bucket called `attachments` for department project files.

---

## 4. Run Development Server

```bash
# Install dependencies
npm install

# Start local server with Lenis smooth scrolling and Supabase Realtime
npm run dev
```

Navigate to **[http://localhost:3000](http://localhost:3000)**.
