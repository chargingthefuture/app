-- Comprehensive schema fix migration
-- Fixes the socketrelay_requests.isPublic column issue and verifies core tables

-- ========================================
-- Fix socketrelay_requests.isPublic column
-- ========================================
DO $$
BEGIN
  -- Check if the old column exists and rename it
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'socketrelay_requests' 
    AND column_name = 'isPublic'
  ) THEN
    -- Rename the column from "isPublic" to is_public
    ALTER TABLE socketrelay_requests 
    RENAME COLUMN "isPublic" TO is_public;
    
    RAISE NOTICE 'Column "isPublic" renamed to is_public successfully';
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'socketrelay_requests' 
    AND column_name = 'is_public'
  ) THEN
    RAISE NOTICE 'Column is_public already exists, no action needed';
  ELSE
    -- Column doesn't exist at all, add it
    ALTER TABLE socketrelay_requests 
    ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
    
    RAISE NOTICE 'Column is_public added successfully';
  END IF;
END $$;

-- ========================================
-- Verify users table structure
-- ========================================
DO $$
BEGIN
  -- Check if users table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'users'
  ) THEN
    RAISE EXCEPTION 'Users table does not exist! Please run the full schema.sql first.';
  END IF;
  
  -- Verify required columns exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'Users table missing required column: id';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'email'
  ) THEN
    RAISE EXCEPTION 'Users table missing required column: email';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'is_admin'
  ) THEN
    RAISE EXCEPTION 'Users table missing required column: is_admin';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'is_approved'
  ) THEN
    RAISE EXCEPTION 'Users table missing required column: is_approved';
  END IF;
  
  RAISE NOTICE 'Users table structure verified successfully';
END $$;

-- ========================================
-- Verify socketrelay_requests table structure
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'socketrelay_requests'
  ) THEN
    RAISE WARNING 'socketrelay_requests table does not exist';
    RETURN;
  END IF;
  
  -- Verify is_public column exists (after rename)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'socketrelay_requests' 
    AND column_name = 'is_public'
  ) THEN
    RAISE EXCEPTION 'socketrelay_requests table missing required column: is_public';
  END IF;
  
  -- Verify old column doesn't exist
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'socketrelay_requests' 
    AND column_name = 'isPublic'
  ) THEN
    RAISE WARNING 'Old column "isPublic" still exists alongside is_public - this may cause issues';
  END IF;
  
  RAISE NOTICE 'socketrelay_requests table structure verified successfully';
END $$;

-- ========================================
-- Summary
-- ========================================
DO $$
BEGIN
  RAISE NOTICE 'Schema migration completed. Please verify the results above.';
END $$;

