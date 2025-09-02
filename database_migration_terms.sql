-- Database Migration Script for Terms & Conditions System
-- Run this script to add terms acceptance fields to the users table

-- Add terms_accepted field (boolean, defaults to FALSE for existing users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;

-- Add terms_accepted_at field (timestamp, null for existing users who haven't accepted)
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP;

-- Optional: Set existing users to have accepted terms (if you want to grandfather them in)
-- Uncomment the line below if you want all existing users to be considered as having accepted terms
-- UPDATE users SET terms_accepted = TRUE, terms_accepted_at = CURRENT_TIMESTAMP WHERE terms_accepted IS FALSE;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('terms_accepted', 'terms_accepted_at');