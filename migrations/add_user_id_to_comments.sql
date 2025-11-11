-- Migration: Add user_id column to comments table
-- Run this in your Supabase SQL Editor to update the existing comments table

-- Add user_id column (will be NULL for all existing comments)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Note: Existing comments will have user_id = NULL (anonymous comments)
-- New comments from authenticated users will have their user_id populated
