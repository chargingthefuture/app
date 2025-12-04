-- Migration: Add sectors column to directory_profiles table
-- This column stores an array of sector IDs from the skills_sectors table
-- Date: 2024-01-XX

-- Add sectors column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'directory_profiles' 
        AND column_name = 'sectors'
    ) THEN
        ALTER TABLE directory_profiles 
        ADD COLUMN sectors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
        
        RAISE NOTICE 'Added sectors column to directory_profiles table';
    ELSE
        RAISE NOTICE 'sectors column already exists in directory_profiles table';
    END IF;
END $$;

