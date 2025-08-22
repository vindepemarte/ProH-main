-- Drop existing tables to start fresh
DROP TABLE IF EXISTS homework_files, homeworks, reference_codes, users, pricing_config;

-- Users Table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    referred_by VARCHAR(255) REFERENCES users(id)
);

-- Reference Codes Table
CREATE TABLE reference_codes (
    code VARCHAR(10) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL
);

-- Homeworks Table
CREATE TABLE homeworks (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL REFERENCES users(id),
    agent_id VARCHAR(255) REFERENCES users(id),
    worker_id VARCHAR(255) REFERENCES users(id),
    super_worker_id VARCHAR(255) REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    module_name TEXT NOT NULL,
    project_number VARCHAR(50)[] NOT NULL,
    word_count INT NOT NULL,
    deadline TIMESTAMP NOT NULL,
    notes TEXT,
    price NUMERIC(10, 2),
    earnings JSONB
);

-- Homework Files Table
CREATE TABLE homework_files (
    id SERIAL PRIMARY KEY,
    homework_id VARCHAR(255) NOT NULL REFERENCES homeworks(id),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT
);

-- Pricing Configuration Table
CREATE TABLE pricing_config (
    id VARCHAR(50) PRIMARY KEY,
    config JSONB NOT NULL
);

-- Seed initial GODZ user for bootstrapping
INSERT INTO users (id, name, email, password_hash, role) VALUES ('god_user', 'GODZ', 'godz@system.com', 'hashed_godz', 'super_agent');
INSERT INTO reference_codes (code, owner_id, role) VALUES ('GODZ', 'god_user', 'super_agent');

-- Seed default pricing configuration
INSERT INTO pricing_config (id, config) VALUES ('main', '{
    "wordTiers": {
        "500": 10, "1000": 20, "1500": 30, "2000": 40, "2500": 50, "3000": 60, "3500": 70, "4000": 80, "4500": 90, "5000": 100, 
        "5500": 110, "6000": 120, "6500": 130, "7000": 140, "7500": 150, "8000": 160, "8500": 170, "9000": 180, "9500": 190, "10000": 200, 
        "10500": 210, "11000": 220, "11500": 230, "12000": 240, "12500": 250, "13000": 260, "13500": 270, "14000": 280, "14500": 290, "15000": 300, 
        "15500": 310, "16000": 320, "16500": 330, "17000": 340, "17500": 350, "18000": 360, "18500": 370, "19000": 380, "19500": 390, "20000": 400
    },
    "fees": {
        "agent": 5,
        "super_worker": 6.25
    },
    "deadlineTiers": {
        "1": 30,
        "3": 15,
        "7": 5
    }
}');
