-- =====================================================
-- Enable Realtime for Patient List Updates
-- =====================================================
--
-- This script enables Supabase Realtime on the patients table
-- so doctors see new patients automatically without refreshing.
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- =====================================================

-- Enable realtime for the patients table
ALTER PUBLICATION supabase_realtime ADD TABLE patients;

-- Verify realtime is enabled (optional check)
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Expected output should include:
-- schemaname | tablename
-- -----------+----------
-- public     | patients

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
--
-- 1. This enables realtime for ALL columns in the patients table
-- 2. All connected clients will receive INSERT/UPDATE/DELETE events
-- 3. No additional infrastructure required (WebSockets handled by Supabase)
-- 4. Realtime uses PostgreSQL's LISTEN/NOTIFY internally
--
-- 5. To DISABLE realtime later (if needed):
--    ALTER PUBLICATION supabase_realtime DROP TABLE patients;
--
-- =====================================================
-- SECURITY CONSIDERATIONS
-- =====================================================
--
-- Realtime respects Row Level Security (RLS) policies
-- Only data the user can SELECT will be broadcast
-- Ensure your RLS policies are correctly configured
--
-- =====================================================
