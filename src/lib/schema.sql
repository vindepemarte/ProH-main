
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    referred_by VARCHAR(255) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reference_codes (
    code VARCHAR(255) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS homeworks (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL REFERENCES users(id),
    agent_id VARCHAR(255) REFERENCES users(id),
    super_worker_id VARCHAR(255) REFERENCES users(id),
    worker_id VARCHAR(255) REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    project_number TEXT[] NOT NULL,
    word_count INTEGER NOT NULL,
    deadline TIMESTAMP NOT NULL,
    notes TEXT,
    price NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    earnings JSONB
);

CREATE TABLE IF NOT EXISTS homework_files (
    id SERIAL PRIMARY KEY,
    homework_id VARCHAR(255) NOT NULL REFERENCES homeworks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    homework_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS pricing_config (
    id VARCHAR(50) PRIMARY KEY,
    config JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS homework_change_requests (
    id SERIAL PRIMARY KEY,
    homework_id VARCHAR(255) NOT NULL REFERENCES homeworks(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS change_request_files (
    id SERIAL PRIMARY KEY,
    change_request_id INTEGER NOT NULL REFERENCES homework_change_requests(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Seed initial data only if it doesn't exist
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'god@prohappy.app') THEN
      INSERT INTO users (id, name, email, password_hash, role, referred_by) 
      VALUES ('user_god', 'Super Agent', 'god@prohappy.app', 'hashed_123456', 'super_agent', NULL);
   END IF;
END $$;

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM reference_codes WHERE code = 'GODZ') THEN
      INSERT INTO reference_codes (code, owner_id, role) 
      VALUES ('GODZ', 'user_god', 'super_agent');
   END IF;
END $$;

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pricing_config WHERE id = 'main') THEN
      INSERT INTO pricing_config (id, config) VALUES ('main', '{
          "wordTiers": {
              "500": 20, "1000": 40, "1500": 60, "2000": 80, "2500": 100, "3000": 120, "3500": 140, "4000": 160, "4500": 180, "5000": 200, "5500": 220, "6000": 240, "6500": 260, "7000": 280, "7500": 300, "8000": 320, "8500": 340, "9000": 360, "9500": 380, "10000": 400, "10500": 420, "11000": 440, "11500": 460, "12000": 480, "12500": 500, "13000": 520, "13500": 540, "14000": 560, "14500": 580, "15000": 600, "15500": 620, "16000": 640, "16500": 660, "17000": 680, "17500": 700, "18000": 720, "18500": 740, "19000": 760, "19500": 780, "20000": 800
          },
          "fees": {
              "agent": 5,
              "super_worker": 10
          },
          "deadlineTiers": {
              "1": 20,
              "3": 10,
              "7": 5
          }
      }');
   END IF;
END $$;
