-- Users Table: Stores all user information
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    referred_by VARCHAR(255) REFERENCES users(id)
);

-- Reference Codes Table: Stores codes for registration
CREATE TABLE IF NOT EXISTS reference_codes (
    code VARCHAR(255) PRIMARY KEY,
    owner_id VARCHAR(255) REFERENCES users(id),
    role VARCHAR(50) NOT NULL
);

-- Homeworks Table: Core table for all assignment data
CREATE TABLE IF NOT EXISTS homeworks (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) REFERENCES users(id),
    agent_id VARCHAR(255) REFERENCES users(id),
    worker_id VARCHAR(255) REFERENCES users(id),
    super_worker_id VARCHAR(255) REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    project_number VARCHAR(255)[],
    word_count INTEGER NOT NULL,
    deadline TIMESTAMP NOT NULL,
    notes TEXT,
    price NUMERIC(10, 2),
    earnings JSONB
);

-- Homework Files Table: Stores file info related to homeworks
CREATE TABLE IF NOT EXISTS homework_files (
    id SERIAL PRIMARY KEY,
    homework_id VARCHAR(255) REFERENCES homeworks(id),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table: Stores user notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    homework_id VARCHAR(255)
);

-- Pricing Configuration Table
CREATE TABLE IF NOT EXISTS pricing_config (
    id VARCHAR(50) PRIMARY KEY,
    config JSONB NOT NULL
);

-- Super Agent Dashboard Stats Table
CREATE TABLE IF NOT EXISTS super_agent_stats (
    id INT PRIMARY KEY,
    total_revenue NUMERIC(15, 2) DEFAULT 0,
    total_profit NUMERIC(15, 2) DEFAULT 0,
    total_students INT DEFAULT 0,
    average_profit_per_homework NUMERIC(10, 2) DEFAULT 0,
    last_updated TIMESTAMP
);


-- SEED DATA --

-- Insert default user on conflict (if email exists, do nothing)
INSERT INTO users (id, name, email, password_hash, role) VALUES ('user_god', 'God', 'god@prohappy.app', 'hashed_123456', 'super_agent') ON CONFLICT (email) DO NOTHING;

-- Insert default reference code on conflict
INSERT INTO reference_codes (code, owner_id, role) VALUES ('GODZ', 'user_god', 'super_agent') ON CONFLICT (code) DO NOTHING;

-- Insert default pricing config on conflict
INSERT INTO pricing_config (id, config) VALUES ('main', '{
    "wordTiers": {
        "500": 20, "1000": 40, "1500": 60, "2000": 80, "2500": 100,
        "3000": 120, "3500": 140, "4000": 160, "4500": 180, "5000": 200,
        "5500": 220, "6000": 240, "6500": 260, "7000": 280, "7500": 300,
        "8000": 320, "8500": 340, "9000": 360, "9500": 380, "10000": 400,
        "10500": 420, "11000": 440, "11500": 460, "12000": 480, "12500": 500,
        "13000": 520, "13500": 540, "14000": 560, "14500": 580, "15000": 600,
        "15500": 620, "16000": 640, "16500": 660, "17000": 680, "17500": 700,
        "18000": 720, "18500": 740, "19000": 760, "19500": 780, "20000": 800
    },
    "fees": {
        "agent": 5,
        "super_worker": 10
    },
    "deadlineTiers": {
        "1": 30,
        "3": 15,
        "7": 5
    }
}') ON CONFLICT (id) DO NOTHING;
