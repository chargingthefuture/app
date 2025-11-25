-- Migration: Add is_claimed column to mechanicmatch_profiles
-- Run this in your Neon console if db:push fails

-- Add is_claimed column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mechanicmatch_profiles' 
    AND column_name = 'is_claimed'
  ) THEN
    ALTER TABLE mechanicmatch_profiles 
    ADD COLUMN is_claimed BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Make user_id nullable if it's currently NOT NULL
-- (This allows unclaimed profiles to be created by admins)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mechanicmatch_profiles' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE mechanicmatch_profiles 
    ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

