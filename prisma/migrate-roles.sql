-- Migration script: Update User roles from 'owner' to 'BUSINESS_OWNER'
-- Run this in your Supabase SQL Editor or via psql

-- Check current state (optional)
SELECT id, email, role FROM "User";

-- Update roles
UPDATE "User" SET role = 'BUSINESS_OWNER' WHERE role = 'owner';

-- Verify update (optional)
SELECT id, email, role FROM "User";

