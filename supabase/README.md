# WearWise — Supabase Setup Guide

This folder contains the PostgreSQL database migration and storage policies for **WearWise Phase 2**.

## 1. Prerequisites

1. Create a free account at [Supabase.com](https://supabase.com).
2. Create a new Supabase project (e.g. `wearwise-app`).

## 2. Apply Database Migration

1. In your Supabase project dashboard, navigate to the **SQL Editor** tab on the left sidebar.
2. Click **New Query**.
3. Copy and paste the entire contents of [`migrations/20261015000000_create_clothing_items_and_storage.sql`](./migrations/20261015000000_create_clothing_items_and_storage.sql).
4. Click **Run** (or press Ctrl + Enter).

### What this migration sets up:
- **`clothing_items` table:** Stores structured clothing metadata with UUID primary keys, user ID foreign keys, validation constraints, and performance indexes.
- **Row Level Security (RLS):** Authenticated users can only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` their own items (`auth.uid() = user_id`).
- **`wardrobe-images` storage bucket:** Private cloud storage bucket with a 10MB file limit for high-resolution garment photos.
- **Storage RLS policies:** Users can only read, upload, and delete images under their own user folder path: `{user_id}/{clothing_item_id}.jpg`.

## 3. Environment Variables Configuration

Copy `.env.example` in the project root to `.env`:

```bash
cp .env.example .env
```

Fill in your project credentials from your Supabase dashboard (**Project Settings** -> **API**):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
```

> **Note:** If no credentials are provided, WearWise automatically runs in **Local Demo Mode** with full offline persistence using AsyncStorage.
