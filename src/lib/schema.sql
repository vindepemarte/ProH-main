-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    referred_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reference Codes Table
CREATE TABLE IF NOT EXISTS reference_codes (
    code TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    role TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Homeworks Table
CREATE TABLE IF NOT EXISTS homeworks (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    agent_id TEXT,
    worker_id TEXT,
    super_worker_id TEXT,
    status TEXT NOT NULL,
    module_name TEXT NOT NULL,
    project_number TEXT[] NOT NULL,
    word_count INTEGER NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    price NUMERIC(10, 2),
    earnings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Homework Files Table
CREATE TABLE IF NOT EXISTS homework_files (
    id SERIAL PRIMARY KEY,
    homework_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (homework_id) REFERENCES homeworks(id) ON DELETE CASCADE
);

-- Pricing Configuration Table
CREATE TABLE IF NOT EXISTS pricing_config (
    id TEXT PRIMARY KEY,
    config JSONB NOT NULL
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- Can be 'all', a role like 'student', or a specific user_id
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    homework_id TEXT, -- Optional: link notification to a specific homework
    FOREIGN KEY (homework_id) REFERENCES homeworks(id) ON DELETE SET NULL
);

-- Insert initial data only if it doesn't exist
-- This makes the script non-destructive
DO $$
BEGIN
    -- Initial Super Agent (God user)
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'god@prohappy.app') THEN
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES ('god_user_001', 'God User', 'god@prohappy.app', 'hashed_123456', 'super_agent');
    END IF;

    -- God user's initial reference code to create other super_agents
    IF NOT EXISTS (SELECT 1 FROM reference_codes WHERE code = 'GODZ') THEN
        INSERT INTO reference_codes (code, owner_id, role, type)
        VALUES ('GODZ', 'god_user_001', 'super_agent', 'SUPER_AGENT');
    END IF;

    -- Default pricing config
    IF NOT EXISTS (SELECT 1 FROM pricing_config WHERE id = 'main') THEN
        INSERT INTO pricing_config (id, config) VALUES ('main', '{
            "wordTiers": {
                "500": 10.00, "1000": 20.00, "1500": 30.00, "2000": 40.00, "2500": 50.00, 
                "3000": 60.00, "3500": 70.00, "4000": 80.00, "4500": 90.00, "5000": 100.00,
                "5500": 110.00, "6000": 120.00, "6500": 130.00, "7000": 140.00, "7500": 150.00,
                "8000": 160.00, "8500": 170.00, "9000": 180.00, "9500": 190.00, "10000": 200.00,
                "10500": 210.00, "11000": 220.00, "11500": 230.00, "12000": 240.00, "12500": 250.00,
                "13000": 260.00, "13500": 270.00, "14000": 280.00, "14500": 290.00, "15000": 300.00,
                "15500": 310.00, "16000": 320.00, "16500": 330.00, "17000": 340.00, "17500": 350.00,
                "18000": 360.00, "18500": 370.00, "19000": 380.00, "19500": 390.00, "20000": 400.00
            },
            "fees": {
                "agent": 5.00,
                "super_worker": 6.25
            },
            "deadlineTiers": {
                "1": 30.00,
                "3": 15.00,
                "7": 5.00
            }
        }');
    END IF;

END $$;
