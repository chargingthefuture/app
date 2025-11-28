-- Diagnostic script to identify schema issues
-- Run this in Neon console to see what's actually in your database

-- ========================================
-- Check socketrelay_requests columns
-- ========================================
SELECT 
  'socketrelay_requests' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'socketrelay_requests'
ORDER BY ordinal_position;

-- Check if BOTH columns exist (this would cause issues)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'socketrelay_requests' AND column_name = 'isPublic'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'socketrelay_requests' AND column_name = 'is_public'
    ) THEN 'PROBLEM: Both isPublic and is_public exist!'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'socketrelay_requests' AND column_name = 'isPublic'
    ) THEN 'Only isPublic exists (old - needs migration)'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'socketrelay_requests' AND column_name = 'is_public'
    ) THEN 'Only is_public exists (correct)'
    ELSE 'Neither column exists (table might not exist)'
  END as socketrelay_column_status;

-- ========================================
-- Check users table (for sync endpoint)
-- ========================================
SELECT 
  'users' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Verify users table has all required columns
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
      THEN 'ERROR: users table does not exist!'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id')
      THEN 'ERROR: users table missing id column!'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email')
      THEN 'ERROR: users table missing email column!'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin')
      THEN 'ERROR: users table missing is_admin column!'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_approved')
      THEN 'ERROR: users table missing is_approved column!'
    ELSE 'OK: users table structure looks correct'
  END as users_table_status;

-- ========================================
-- Check for any other camelCase columns
-- ========================================
SELECT 
  table_name,
  column_name,
  'Potential issue: camelCase column name' as issue
FROM information_schema.columns
WHERE column_name ~ '[a-z][A-Z]'  -- Matches camelCase
  AND table_schema = 'public'
ORDER BY table_name, column_name;
