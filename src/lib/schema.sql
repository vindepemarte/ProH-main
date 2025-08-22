-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    referred_by VARCHAR(255) REFERENCES users(id)
);

-- Reference Codes Table
CREATE TABLE IF NOT EXISTS reference_codes (
    code VARCHAR(255) PRIMARY KEY,
    owner_id VARCHAR(255) REFERENCES users(id),
    role VARCHAR(50) NOT NULL
);

-- Homeworks Table
CREATE TABLE IF NOT EXISTS homeworks (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) REFERENCES users(id),
    agent_id VARCHAR(255) REFERENCES users(id),
    worker_id VARCHAR(255) REFERENCES users(id),
    super_worker_id VARCHAR(255) REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    project_number TEXT[] NOT NULL,
    word_count INT NOT NULL,
    deadline TIMESTAMP NOT NULL,
    notes TEXT,
    price NUMERIC(10, 2),
    earnings JSONB -- { total, agent, super_worker, profit }
);

-- Homework Files Table
CREATE TABLE IF NOT EXISTS homework_files (
    id SERIAL PRIMARY KEY,
    homework_id VARCHAR(255) REFERENCES homeworks(id),
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL
);

-- Notifications Table
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

-- Super Agent Stats Table
CREATE TABLE IF NOT EXISTS super_agent_stats (
    id INT PRIMARY KEY,
    total_revenue NUMERIC(15, 2) DEFAULT 0,
    total_profit NUMERIC(15, 2) DEFAULT 0,
    total_students INT DEFAULT 0,
    average_profit_per_homework NUMERIC(10, 2) DEFAULT 0,
    last_updated TIMESTAMP
);


-- Seed initial data only if it doesn't exist
INSERT INTO users (id, name, email, password_hash, role)
VALUES ('god', 'God', 'god@prohappy.app', 'hashed_123456', 'super_agent')
ON CONFLICT (email) DO NOTHING;

INSERT INTO reference_codes (code, owner_id, role)
VALUES ('GODZ', 'god', 'super_agent')
ON CONFLICT (code) DO NOTHING;

INSERT INTO pricing_config (id, config)
VALUES ('main', '{
    "wordTiers": {
        "500": 10, "1000": 20, "1500": 30, "2000": 40, "2500": 50, "3000": 60,
        "3500": 70, "4000": 80, "4500": 90, "5000": 100, "5500": 110, "6000": 120,
        "6500": 130, "7000": 140, "7500": 150, "8000": 160, "8500": 170, "9000": 180,
        "9500": 190, "10000": 200, "10500": 210, "11000": 220, "11500": 230, "12000": 240,
        "12500": 250, "13000": 260, "13500": 270, "14000": 280, "14500": 290, "15000": 300,
        "15500": 310, "16000": 320, "16500": 330, "17000": 340, "17500": 350, "18000": 360,
        "18500": 370, "19000": 380, "19500": 390, "20000": 400
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
}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO super_agent_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING;


    