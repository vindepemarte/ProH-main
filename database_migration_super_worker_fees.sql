-- Migration script to add Super Worker fee management functionality
-- This script adds the super_worker_fees table for per-worker fee configuration

-- Create the super_worker_fees table
CREATE TABLE IF NOT EXISTS super_worker_fees (
    super_worker_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    fee_per_500 NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Populate with default fees for existing super workers
DO $$
BEGIN
    -- Insert default fees for all existing super workers who don't already have a fee record
    INSERT INTO super_worker_fees (super_worker_id, fee_per_500)
    SELECT id, 10.00 
    FROM users 
    WHERE role = 'super_worker' 
    AND id NOT IN (SELECT super_worker_id FROM super_worker_fees);
    
    -- Log the number of records created
    RAISE NOTICE 'Migration completed: super_worker_fees table created and populated with default fees';
END $$;

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_super_worker_fees_worker_id ON super_worker_fees(super_worker_id);

-- Create a trigger to automatically add fee records for new super workers
CREATE OR REPLACE FUNCTION create_default_super_worker_fee()
RETURNS TRIGGER AS $$
BEGIN
    -- If a new super worker is created, add a default fee record
    IF NEW.role = 'super_worker' THEN
        INSERT INTO super_worker_fees (super_worker_id, fee_per_500)
        VALUES (NEW.id, 10.00)
        ON CONFLICT (super_worker_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_create_super_worker_fee ON users;
CREATE TRIGGER trigger_create_super_worker_fee
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_super_worker_fee();

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_super_worker_fee_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_super_worker_fee_timestamp ON super_worker_fees;
CREATE TRIGGER trigger_update_super_worker_fee_timestamp
    BEFORE UPDATE ON super_worker_fees
    FOR EACH ROW
    EXECUTE FUNCTION update_super_worker_fee_timestamp();