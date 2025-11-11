-- Partifoto Database Schema (idempotent)
-- Safe to re-run: tables use IF NOT EXISTS, policies guarded by DO blocks.

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

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  user_id TEXT, -- UUID of authenticated user, NULL for anonymous comments
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to albums' AND tablename='albums') THEN
    CREATE POLICY "Allow public read access to albums"
      ON albums FOR SELECT USING (true);
  END IF;
END $$;

-- Anyone can create albums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert access to albums' AND tablename='albums') THEN
    CREATE POLICY "Allow public insert access to albums"
      ON albums FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Anyone can read photos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to photos' AND tablename='photos') THEN
    CREATE POLICY "Allow public read access to photos"
      ON photos FOR SELECT USING (true);
  END IF;
END $$;

-- Anyone can upload photos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert access to photos' AND tablename='photos') THEN
    CREATE POLICY "Allow public insert access to photos"
      ON photos FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Anyone can read comments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to comments' AND tablename='comments') THEN
    CREATE POLICY "Allow public read access to comments"
      ON comments FOR SELECT USING (true);
  END IF;
END $$;

-- Anyone can create comments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert access to comments' AND tablename='comments') THEN
    CREATE POLICY "Allow public insert access to comments"
      ON comments FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Storage policies for public uploads bucket
-- Note: Create a bucket named 'uploads' in Supabase Storage first and set it to Public.
-- These policies allow anonymous SELECT and INSERT on that bucket.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Public can view uploads' AND tablename='objects') THEN
    CREATE POLICY "Public can view uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Public can upload to uploads' AND tablename='objects') THEN
    CREATE POLICY "Public can upload to uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');
  END IF;
END $$;

-- Users & participation (authentication-backed)
-- Profiles table (1:1 with auth.users) to store a unique username
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  instagram_url text,
  twitter_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure new profile columns exist if upgrading from earlier schema (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='display_name') THEN
    ALTER TABLE profiles ADD COLUMN display_name text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='instagram_url') THEN
    ALTER TABLE profiles ADD COLUMN instagram_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='twitter_url') THEN
    ALTER TABLE profiles ADD COLUMN twitter_url text;
  END IF;
END $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Only the authenticated user can view/update their own profile
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can view own profile' AND tablename='profiles') THEN
    CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can insert own profile' AND tablename='profiles') THEN
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can update own profile' AND tablename='profiles') THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Storage policies for avatars bucket (public read, auth-only write)
-- Note: Create a bucket named 'avatars' in Supabase Storage; set to Public.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Public can view avatars' AND tablename='objects') THEN
    CREATE POLICY "Public can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can upload avatars' AND tablename='objects') THEN
    CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Track albums a user has participated in (visited, uploaded, commented)
CREATE TABLE IF NOT EXISTS album_participation (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  last_interacted_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, album_id)
);

ALTER TABLE album_participation ENABLE ROW LEVEL SECURITY;

-- Only the authenticated user can read or write their own participation rows
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can read own participation' AND tablename='album_participation') THEN
    CREATE POLICY "Users can read own participation" ON album_participation FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can upsert own participation' AND tablename='album_participation') THEN
    CREATE POLICY "Users can upsert own participation" ON album_participation FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can update own participation' AND tablename='album_participation') THEN
    CREATE POLICY "Users can update own participation" ON album_participation FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_album_participation_user ON album_participation(user_id);
CREATE INDEX IF NOT EXISTS idx_album_participation_album ON album_participation(album_id);

