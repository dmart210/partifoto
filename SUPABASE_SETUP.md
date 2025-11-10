# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Organization**: Select or create one
   - **Name**: `partiful-photos`
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free
4. Click "Create new project"
5. Wait ~2 minutes for project to be ready

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, click **Settings** (gear icon)
2. Click **API** in the sidebar
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (the long JWT token under "Project API keys")

## Step 3: Add Keys to .env.local

1. Open `.env.local` in your project
2. Replace the placeholder values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
   ```

## Step 4: Create Database Tables

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned"

## Step 5: Create Storage Bucket

1. In Supabase, click **Storage** in the left sidebar
2. Click **New bucket**
3. Fill in:
   - **Name**: `uploads`
   - **Public bucket**: ✅ **Check this box** (important!)
4. Click **Create bucket**

## Step 6: Verify Setup

Run the development server:
```bash
npm run dev
```

If you see errors about missing environment variables, double-check your `.env.local` file.

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in your project root
- Restart your dev server after adding environment variables
- Check that there are no typos in the variable names

### "relation does not exist"
- Run the SQL schema in the SQL Editor
- Make sure all tables were created successfully
- Check the **Table Editor** to see if tables exist

### Storage bucket issues
- Ensure the bucket is marked as **Public**
- Go to Storage > uploads > Settings > Make public

## Next Steps

Once setup is complete, we'll update the API routes to use Supabase instead of SQLite!
