# Deployment Guide

This app is built with Next.js (App Router) and uses Supabase (Postgres + Storage). The quickest path to production is Vercel + Supabase.

## Prerequisites

- Supabase project created and configured (see SUPABASE_SETUP.md)
  - Tables: albums, photos, comments
  - RLS enabled with public SELECT/INSERT policies (link-based model)
  - Storage bucket `uploads` created and set to Public
  - Storage policies for `storage.objects` (SELECT/INSERT scoped to bucket `uploads`)
- Local build passes:
  ```powershell
  npm ci
  npm run build
  ```

## 1) Prepare environment variables

Two public variables are required by both dev and prod:

- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key

In Vercel, you will add these in Project Settings > Environment Variables.

## 2) Deploy to Vercel (recommended)

1. Push your code to GitHub.
2. Go to https://vercel.com/new and import the repository.
3. Framework preset: Next.js (detected automatically).
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Build & Output settings: keep defaults.
6. Click Deploy.

After build:
- Vercel will give you a preview URL (e.g., https://your-app.vercel.app)
- Visit `/` to confirm the UI loads.
- Visit `/api/health/supabase`:
  - Expect a JSON response with `ok: true`, counts, and bucket info.

## 3) Verify storage and images

- Upload a photo to a test album.
- Confirm the image loads from Supabase Storage public URL.
- Next/Image is configured via `next.config.ts` to allow the Supabase Storage host.

## 4) Production domain (optional)

- In Vercel > Settings > Domains, add your custom domain.
- Point DNS to Vercel as instructed.

## 5) Environment promotion & previews

- Vercel creates a new Preview deployment on every pull request.
- Add the same env vars to Preview and Production environments in Vercel.
- When ready, Promote a preview to Production from the Vercel UI.

## 6) Netlify (alternative)

You can deploy to Netlify using its Next.js runtime, but Vercel is simpler for App Router projects. If using Netlify:
- Set the same env vars in Site Settings.
- Ensure Next.js runtime is enabled by default (Netlify auto-detects).

## 7) Supabase checklist (one time)

- Run `supabase-schema.sql` once in the SQL Editor.
- Create bucket `uploads` and make it Public.
- Confirm Storage policies exist:
  ```sql
  -- VIEW
  CREATE POLICY IF NOT EXISTS "Public can view uploads"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'uploads');

  -- INSERT
  CREATE POLICY IF NOT EXISTS "Public can upload to uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'uploads');
  ```

## 8) Operational notes

- This app intentionally allows public inserts (open link model). Monitor usage in Supabase Logs.
- The API includes basic in-memory rate limiting and input validation; for production scale, move rate limiting to a durable store (e.g., Upstash Redis) and consider album-level write tokens.
- Use `/api/health/supabase` after each deploy to sanity check connectivity.

## 9) Troubleshooting

- 403 on upload: Ensure the `uploads` bucket is Public AND the INSERT/SELECT storage policies are applied.
- 500 on API routes: Check env vars are configured in Vercel and the schema has been applied.
- Images not rendering: Verify `NEXT_PUBLIC_SUPABASE_URL` matches your project and `next.config.ts` remotePatterns host matches your storage domain.

## 10) Rollbacks

- Vercel keeps previous deployments; use the Vercel UI to restore a prior build if needed.

