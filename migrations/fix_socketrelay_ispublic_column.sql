-- Migration: Fix socketrelay_requests.isPublic column name
-- Changes "isPublic" (quoted, case-sensitive) to is_public (snake_case, unquoted)
-- This matches the pattern used by other tables and fixes the schema mismatch

-- Check if the old column exists and rename it
DO $$
BEGIN
  -- Check if column "isPublic" exists (quoted, case-sensitive)
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
  ELSE
    -- Check if is_public already exists (maybe already migrated)
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'socketrelay_requests' 
      AND column_name = 'is_public'
    ) THEN
      RAISE NOTICE 'Column is_public already exists, migration not needed';
    ELSE
      -- Column doesn't exist at all, add it
      ALTER TABLE socketrelay_requests 
      ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
      
      RAISE NOTICE 'Column is_public added successfully';
    END IF;
  END IF;
END $$;

