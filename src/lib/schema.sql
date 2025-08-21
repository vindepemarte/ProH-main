-- Drop existing tables to ensure a clean slate
DROP TABLE IF EXISTS homework_files CASCADE;
DROP TABLE IF EXISTS homeworks CASCADE;
DROP TABLE IF EXISTS reference_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- User roles type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_agent', 'agent', 'super_worker', 'worker', 'student');
    END IF;
END$$;

-- Homework status type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homework_status') THEN
        CREATE TYPE homework_status AS ENUM (
            'payment_approval',
            'in_progress',
            'requested_changes',
            'final_payment_approval',
            'word_count_change',
            'deadline_change',
            'declined',
            'refund',
            'completed'
        );
    END IF;
END$$;

-- Reference code type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reference_code_type') THEN
        CREATE TYPE reference_code_type AS ENUM ('STUDENT', 'AGENT', 'WORKER');
    END IF;
END$$;


-- Users Table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    reference_code_own VARCHAR(255) UNIQUE,
    referred_by VARCHAR(255) REFERENCES users(id)
);

-- Reference Codes Table
CREATE TABLE reference_codes (
    code VARCHAR(255) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL REFERENCES users(id),
    type reference_code_type NOT NULL,
    role_granted user_role NOT NULL
);

-- Homeworks Table
CREATE TABLE homeworks (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL REFERENCES users(id),
    agent_id VARCHAR(255) REFERENCES users(id),
    worker_id VARCHAR(255) REFERENCES users(id),
    status homework_status NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    project_number TEXT[] NOT NULL,
    word_count INTEGER NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    notes TEXT,
    price NUMERIC(10, 2),
    earnings JSONB
);

-- Homework Files Table
CREATE TABLE homework_files (
    id SERIAL PRIMARY KEY,
    homework_id VARCHAR(255) NOT NULL REFERENCES homeworks(id),
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(2048) NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial data
INSERT INTO users (id, name, email, password_hash, role, reference_code_own, referred_by) VALUES
('god_user', 'GOD', 'god@prohappy.app', 'N/A', 'super_agent', 'GODZ', NULL),
('user_superagent', 'Super Agent', 'superagent@agent.com', 'hashed_123456', 'super_agent', NULL, 'god_user');

-- Insert other users and update their own reference codes after they are created
INSERT INTO users (id, name, email, password_hash, role, referred_by) VALUES
('user_agent', 'Agent', 'agent@agent.com', 'hashed_123456', 'agent', 'user_superagent'),
('user_superworker', 'Super Worker', 'superworker@worker.com', 'hashed_123456', 'super_worker', 'user_superagent'),
('user_worker', 'Worker', 'worker@worker.com', 'hashed_123456', 'worker', 'user_superworker'),
('user_client_from_sa', 'SA Client', 'client@client.com', 'hashed_123456', 'student', 'user_superagent'),
('user_client_from_agent', 'Agent Client', 'clientagent@client.com', 'hashed_123456', 'student', 'user_agent');

UPDATE users SET reference_code_own = 'AGNT' WHERE id = 'user_agent';
UPDATE users SET reference_code_own = 'WORK' WHERE id = 'user_superworker';

-- Seed reference codes
INSERT INTO reference_codes (code, owner_id, type, role_granted) VALUES
('GODZ', 'god_user', 'AGENT', 'super_agent'),
('SUPC', 'user_superagent', 'STUDENT', 'student'),
('SUPA', 'user_superagent', 'AGENT', 'agent'),
('SUPW', 'user_superagent', 'WORKER', 'super_worker'),
('AGNT', 'user_agent', 'STUDENT', 'student'),
('WORK', 'user_superworker', 'WORKER', 'worker');

-- Seed homeworks
INSERT INTO homeworks (id, student_id, agent_id, worker_id, status, module_name, project_number, word_count, deadline, notes, price, earnings) VALUES
('hw_1234', 'user_client_from_sa', NULL, NULL, 'payment_approval', 'Advanced Quantum Physics', ARRAY['A1'], 1500, '2025-08-15T23:59:59Z', 'Please focus on the Schrödinger equation part.', 150, '{"total": 150, "profit": 131.25, "super_worker": 18.75}'),
('hw_1235', 'user_client_from_agent', 'user_agent', 'user_worker', 'in_progress', 'History of Ancient Rome', ARRAY['A2', 'A3'], 2500, '2025-08-20T23:59:59Z', 'Need a detailed analysis of the Punic Wars.', 250, '{"total": 250, "agent": 50, "profit": 168.75, "super_worker": 31.25}'),
('hw_1236', 'user_client_from_sa', NULL, 'user_worker', 'completed', 'Introduction to Marketing', ARRAY['Full Project'], 5000, '2025-07-30T23:59:59Z', 'Completed project on SWOT analysis.', 500, '{"total": 500, "profit": 437.50, "super_worker": 62.50}'),
('hw_1237', 'user_client_from_agent', 'user_agent', 'user_worker', 'completed', 'Data Structures and Algorithms', ARRAY['A4'], 3000, '2025-07-20T23:59:59Z', 'Implementation of a B-Tree.', 320, '{"total": 320, "agent": 64, "profit": 218.5, "super_worker": 37.5}');

-- Seed homework files
INSERT INTO homework_files (homework_id, file_name, file_url) VALUES
('hw_1236', 'final_submission.pdf', '#'),
('hw_1237', 'data_structures_final.zip', '#');
