-- Migration: Add terms_accepted_at column to users table
-- This column tracks when users last accepted the terms of service

-- Check if column exists before adding (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'terms_accepted_at'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN terms_accepted_at TIMESTAMP;
        
        RAISE NOTICE 'Column terms_accepted_at added to users table';
    ELSE
        RAISE NOTICE 'Column terms_accepted_at already exists in users table';
    END IF;
END $$;


