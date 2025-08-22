-- Create tables only if they don't exist to avoid deleting data on re-run.
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    referred_by VARCHAR(255) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reference_codes (
    code VARCHAR(50) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS homeworks (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL REFERENCES users(id),
    agent_id VARCHAR(255) REFERENCES users(id),
    worker_id VARCHAR(255) REFERENCES users(id),
    super_worker_id VARCHAR(255) REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    project_number VARCHAR(50)[] NOT NULL,
    word_count INT NOT NULL,
    deadline TIMESTAMP NOT NULL,
    notes TEXT,
    price NUMERIC(10, 2),
    earnings JSONB
);

CREATE TABLE IF NOT EXISTS homework_files (
    id SERIAL PRIMARY KEY,
    homework_id VARCHAR(255) NOT NULL REFERENCES homeworks(id),
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS pricing_config (
    id VARCHAR(50) PRIMARY KEY,
    config JSONB NOT NULL
);

-- Insert initial data only if the tables are empty to avoid duplicates.

-- Clear existing data to ensure a clean slate for initial seeding
TRUNCATE TABLE homework_files, homeworks, reference_codes, users, pricing_config RESTART IDENTITY CASCADE;


DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'god@prohappy.app') THEN
      INSERT INTO users (id, name, email, password_hash, role, referred_by) 
      VALUES ('user_god', 'God', 'god@prohappy.app', 'hashed_123456', 'super_agent', NULL);
      
      INSERT INTO reference_codes (code, owner_id, role) 
      VALUES ('GODZ', 'user_god', 'super_agent');
   END IF;
END $$;


DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pricing_config WHERE id = 'main') THEN
      INSERT INTO pricing_config (id, config) VALUES ('main', '{
          "wordTiers": {
              "500": 10, "1000": 20, "1500": 30, "2000": 40, "2500": 50, "3000": 60, "3500": 70, "4000": 80, "4500": 90, "5000": 100,
              "5500": 110, "6000": 120, "6500": 130, "7000": 140, "7500": 150, "8000": 160, "8500": 170, "9000": 180, "9500": 190, "10000": 200,
              "10500": 210, "11000": 220, "11500": 230, "12000": 240, "12500": 250, "13000": 260, "13500": 270, "14000": 280, "14500": 290, "15000": 300,
              "15500": 310, "16000": 320, "16500": 330, "17000": 340, "17500": 350, "18000": 360, "18500": 370, "19000": 380, "19500": 390, "20000": 400
          },
          "fees": {
              "agent": 5.00,
              "super_worker": 6.25
          },
          "deadlineTiers": {
              "1": 30,
              "3": 15,
              "7": 5
          }
      }');
   END IF;
END $$;
