-- Drop existing tables to start clean
DROP TABLE IF EXISTS homework_files CASCADE;
DROP TABLE IF EXISTS homeworks CASCADE;
DROP TABLE IF EXISTS reference_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS pricing_config CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS homework_status CASCADE;
DROP TYPE IF EXISTS project_number_enum CASCADE;
DROP TYPE IF EXISTS reference_code_type CASCADE;

-- Type Definitions
CREATE TYPE user_role AS ENUM ('super_agent', 'agent', 'super_worker', 'worker', 'student');
CREATE TYPE homework_status AS ENUM ('payment_approval', 'in_progress', 'requested_changes', 'final_payment_approval', 'word_count_change', 'deadline_change', 'declined', 'refund', 'completed');
CREATE TYPE project_number_enum AS ENUM ('A1', 'A2', 'A3', 'A4', 'Full Project');
CREATE TYPE reference_code_type AS ENUM ('STUDENT', 'AGENT', 'WORKER', 'SUPER_WORKER');

-- Tables
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    referred_by VARCHAR(255) REFERENCES users(id)
);

CREATE TABLE reference_codes (
    code VARCHAR(10) PRIMARY KEY,
    owner_id VARCHAR(255) REFERENCES users(id),
    type reference_code_type NOT NULL,
    role user_role NOT NULL
);

CREATE TABLE homeworks (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) REFERENCES users(id),
    agent_id VARCHAR(255) REFERENCES users(id),
    worker_id VARCHAR(255) REFERENCES users(id),
    super_worker_id VARCHAR(255) REFERENCES users(id),
    status homework_status NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    project_number project_number_enum[],
    word_count INTEGER NOT NULL,
    deadline TIMESTAMP NOT NULL,
    notes TEXT,
    price NUMERIC(10, 2),
    earnings JSONB -- Store total, agent, super_worker, profit
);

CREATE TABLE homework_files (
    id SERIAL PRIMARY KEY,
    homework_id VARCHAR(255) REFERENCES homeworks(id),
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255)
);

CREATE TABLE pricing_config (
    id VARCHAR(255) PRIMARY KEY,
    config JSONB NOT NULL
);

-- Seed Data
INSERT INTO users (id, name, email, password_hash, role, referred_by) VALUES
('god_user', 'GOD', 'god@prohappy.uk', 'hashed_god', 'super_agent', NULL),
('user_sa', 'Super Agent', 'superagent@agent.com', 'hashed_123456', 'super_agent', 'god_user'),
('user_a', 'Agent', 'agent@agent.com', 'hashed_123456', 'agent', 'user_sa'),
('user_sw', 'Super Worker', 'superworker@worker.com', 'hashed_123456', 'super_worker', 'user_sa'),
('user_s_direct', 'Student (Direct)', 'client@client.com', 'hashed_123456', 'student', 'user_sa'),
('user_s_agent', 'Student (Agent)', 'clientagent@client.com', 'hashed_123456', 'student', 'user_a'),
('user_w', 'Worker', 'worker@worker.com', 'hashed_123456', 'worker', 'user_sw');

INSERT INTO reference_codes (code, owner_id, type, role) VALUES
('GODZ', 'god_user', 'SUPER_AGENT', 'super_agent'),
('SUPC', 'user_sa', 'STUDENT', 'student'),
('SUPA', 'user_sa', 'AGENT', 'agent'),
('SUPW', 'user_sa', 'SUPER_WORKER', 'super_worker'),
('AGNT', 'user_a', 'STUDENT', 'student'),
('WORK', 'user_sw', 'WORKER', 'worker');

-- Default pricing configuration
INSERT INTO pricing_config (id, config) VALUES
('main', '{
    "wordTiers": {
        "500": 10, "1000": 20, "1500": 30, "2000": 40, "2500": 50,
        "3000": 60, "3500": 70, "4000": 80, "4500": 90, "5000": 100,
        "5500": 110, "6000": 120, "6500": 130, "7000": 140, "7500": 150,
        "8000": 160, "8500": 170, "9000": 180, "9500": 190, "10000": 200,
        "10500": 210, "11000": 220, "11500": 230, "12000": 240, "12500": 250,
        "13000": 260, "13500": 270, "14000": 280, "14500": 290, "15000": 300,
        "15500": 310, "16000": 320, "16500": 330, "17000": 340, "17500": 350,
        "18000": 360, "18500": 370, "19000": 380, "19500": 390, "20000": 400
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
