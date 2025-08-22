
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    referred_by TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS reference_codes (
    code TEXT PRIMARY KEY,
    owner_id TEXT REFERENCES users(id),
    role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS homeworks (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES users(id),
    agent_id TEXT REFERENCES users(id),
    worker_id TEXT REFERENCES users(id),
    super_worker_id TEXT REFERENCES users(id),
    status TEXT NOT NULL,
    module_name TEXT NOT NULL,
    project_number TEXT[] NOT NULL,
    word_count INTEGER NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    price NUMERIC(10, 2),
    earnings JSONB
);

CREATE TABLE IF NOT EXISTS homework_files (
    id SERIAL PRIMARY KEY,
    homework_id TEXT REFERENCES homeworks(id),
    file_name TEXT NOT NULL,
    file_url TEXT
);

CREATE TABLE IF NOT EXISTS pricing_config (
    id TEXT PRIMARY KEY,
    config JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    homework_id TEXT,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Upsert the main pricing config
INSERT INTO pricing_config (id, config)
VALUES ('main', '{
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
}')
ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config;


-- Create the root user and their codes
WITH root_user AS (
    INSERT INTO users (id, name, email, password_hash, role)
    VALUES ('god', 'God', 'god@prohappy.app', 'hashed_123456', 'super_agent')
    ON CONFLICT (id) DO NOTHING
    RETURNING id
)
INSERT INTO reference_codes (code, owner_id, role)
SELECT 'GODZ', (SELECT id FROM root_user), 'super_agent'
WHERE NOT EXISTS (SELECT 1 FROM reference_codes WHERE code = 'GODZ');
