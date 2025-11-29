-- Remove old "isPublic" column if it still exists
-- This ensures only is_public exists (the correct column name)

DO $$
BEGIN
  -- Check if BOTH columns exist (this would cause issues)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'socketrelay_requests' AND column_name = 'isPublic'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'socketrelay_requests' AND column_name = 'is_public'
  ) THEN
    -- Both exist - we need to migrate data and drop the old one
    RAISE NOTICE 'Both columns exist. Migrating data from isPublic to is_public...';
    
    -- Copy data from old column to new column (if they differ)
    UPDATE socketrelay_requests 
    SET is_public = "isPublic"::boolean
    WHERE is_public IS DISTINCT FROM "isPublic"::boolean;
    
    -- Drop the old column
    ALTER TABLE socketrelay_requests DROP COLUMN "isPublic";
    
    RAISE NOTICE 'Old column "isPublic" dropped successfully';
    
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'socketrelay_requests' AND column_name = 'isPublic'
  ) THEN
    -- Only old column exists - migrate data and rename
    RAISE NOTICE 'Only old column exists. Migrating data and renaming...';
    
    -- First, add the new column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'socketrelay_requests' AND column_name = 'is_public'
    ) THEN
      ALTER TABLE socketrelay_requests ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Copy data
    UPDATE socketrelay_requests 
    SET is_public = "isPublic"::boolean;
    
    -- Drop old column
    ALTER TABLE socketrelay_requests DROP COLUMN "isPublic";
    
    RAISE NOTICE 'Column migrated and old column dropped successfully';
    
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'socketrelay_requests' AND column_name = 'is_public'
  ) THEN
    RAISE NOTICE 'Only is_public exists (correct state) - no action needed';
    
  ELSE
    RAISE WARNING 'Neither column exists. Adding is_public column...';
    ALTER TABLE socketrelay_requests 
    ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Column is_public added successfully';
  END IF;
END $$;

-- Verify final state
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'socketrelay_requests' AND column_name = 'isPublic'
    ) THEN 'ERROR: Old column still exists!'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'socketrelay_requests' AND column_name = 'is_public'
    ) THEN 'SUCCESS: Only is_public exists (correct)'
    ELSE 'ERROR: No column exists!'
  END as final_status;


