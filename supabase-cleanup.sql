-- ⚠️ CLEANUP SCRIPT - Use this if you created tables with the wrong schema
-- This will DELETE ALL DATA and recreate the tables correctly
-- 
-- Run this in your Supabase SQL Editor if you see errors like:
-- - "column is of type uuid but expression is of type text"
-- - "permission denied for table" (RLS issues)
-- - Foreign key constraint violations
--
-- After running this, run supabase-schema.sql to recreate everything

-- Drop all tables (will delete all data!)
DROP TABLE IF EXISTS job_descriptions CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Confirmation message
SELECT 'All tables dropped. Now run supabase-schema.sql to recreate them.' AS status;
