-- TopRes AI - Supabase Database Schema
-- Run this entire script in your Supabase SQL Editor to set up all tables and default data
-- IMPORTANT: This schema uses TEXT-based IDs and custom authentication (not Supabase Auth)

-- =====================================================
-- DROP EXISTING TABLES (if you need to start fresh)
-- =====================================================
-- Uncomment these lines if you want to completely reset the database
-- DROP TABLE IF EXISTS job_descriptions CASCADE;
-- DROP TABLE IF EXISTS resumes CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('CANDIDATE', 'RECRUITER', 'MASTER_RECRUITER')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for custom authentication (we're not using Supabase Auth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Insert default admin user
-- Username: admin
-- Password: admin123
INSERT INTO users (id, username, password, role)
VALUES ('admin-0', 'admin', 'admin123', 'RECRUITER')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- RESUMES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  content TEXT NOT NULL,
  file_data TEXT,
  file_name TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Eligible', 'Ineligible')),
  analysis JSONB,
  shortlisted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for custom authentication
ALTER TABLE resumes DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resumes_candidate_id ON resumes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resumes_upload_date ON resumes(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);

-- =====================================================
-- JOB DESCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for custom authentication
ALTER TABLE job_descriptions DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jd_user_active ON job_descriptions(user_id, is_active);

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Verification: Check that admin user was created
-- SELECT * FROM users WHERE username = 'admin';
-- 
-- Expected result:
-- id: admin-0
-- username: admin
-- role: RECRUITER
--
-- You can now run your app with 'npm run dev'
-- 
-- Default login credentials:
--   Username: admin
--   Password: admin123
--   Role: Select "Recruiter" or "Master Recruiter"
--
-- Note: This schema uses custom authentication (not Supabase Auth)
-- RLS is disabled to allow direct database access via the anon key
