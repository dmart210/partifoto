-- Partiful Photos Database Schema
-- Run this in your Supabase SQL Editor

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  uploaded_by TEXT,
  title TEXT,
  created_at BIGINT NOT NULL
);

-- Create comments tablec
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_comments_photo_id ON comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since your app is link-based)
-- Anyone can read albums
CREATE POLICY "Allow public read access to albums"
  ON albums FOR SELECT
  USING (true);

-- Anyone can create albums
CREATE POLICY "Allow public insert access to albums"
  ON albums FOR INSERT
  WITH CHECK (true);

-- Anyone can read photos
CREATE POLICY "Allow public read access to photos"
  ON photos FOR SELECT
  USING (true);

-- Anyone can upload photos
CREATE POLICY "Allow public insert access to photos"
  ON photos FOR INSERT
  WITH CHECK (true);

-- Anyone can read comments
CREATE POLICY "Allow public read access to comments"
  ON comments FOR SELECT
  USING (true);

-- Anyone can create comments
CREATE POLICY "Allow public insert access to comments"
  ON comments FOR INSERT
  WITH CHECK (true);

-- Storage policies for public uploads bucket
-- Note: Create a bucket named 'uploads' in Supabase Storage first and set it to Public.
-- These policies allow anonymous SELECT and INSERT on that bucket.
CREATE POLICY IF NOT EXISTS "Public can view uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

CREATE POLICY IF NOT EXISTS "Public can upload to uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads');

  