
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    referred_by VARCHAR(255) REFERENCES users(id),
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMP
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
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(255) REFERENCES users(id),
    file_type VARCHAR(50) DEFAULT 'student_original',
    is_latest BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    homework_id VARCHAR(255),
    source VARCHAR(20) DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS notification_templates (
    template_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    variables JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Seed default notification templates
DO $$
BEGIN
   -- Insert only if the specific template doesn't exist
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'new_homework') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('new_homework', 'New Homework Submission', 'Sent when a student submits new homework', 'New homework #{homeworkId} from {studentName} requires payment approval.', '["homeworkId", "studentName"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'user_registration') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('user_registration', 'User Registration', 'Sent when a new user registers with a reference code', 'New user registration: {userName} ({userRole}) has joined the platform.', '["userName", "userRole"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'role_change') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('role_change', 'Role Change', 'Sent when user role is changed', 'An administrator has changed your role to {newRole}.', '["newRole"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'status_update') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('status_update', 'Homework Status Update', 'Sent when homework status changes', 'Homework #{homeworkId} status updated to "{status}".', '["homeworkId", "status"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'homework_in_progress') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('homework_in_progress', 'Homework In Progress', 'Sent when homework is marked as in progress', 'Homework #{homeworkId} is now in progress.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'worker_assignment') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('worker_assignment', 'Worker Assignment', 'Sent when a worker is assigned to homework', 'You have been assigned homework #{homeworkId}.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'final_payment_approval') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('final_payment_approval', 'Final Payment Approval', 'Sent when homework requires final payment approval', 'Homework #{homeworkId} requires final payment approval.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'final_review') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('final_review', 'Final Review', 'Sent when homework is being reviewed for final approval', 'Your homework #{homeworkId} is being reviewed for final approval.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'homework_completed') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('homework_completed', 'Homework Completed (Student)', 'Sent to student when homework is completed', 'Your homework #{homeworkId} has been completed and final files are ready for download.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'homework_completed_agent') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('homework_completed_agent', 'Homework Completed (Agent)', 'Sent to agent when homework is completed', 'Homework #{homeworkId} has been completed successfully.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'homework_completed_super_agent') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('homework_completed_super_agent', 'Homework Completed (Super Agent)', 'Sent to super agent when homework is completed', 'Homework #{homeworkId} has been completed and finalized.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'change_request') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('change_request', 'Student Change Request', 'Sent when student requests changes to homework', 'Student has requested changes for homework #{homeworkId}.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'super_worker_change_request') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('super_worker_change_request', 'Super Worker Change Request', 'Sent when super worker requests changes to homework', 'Super Worker requested change to {changeDescription} for homework #{homeworkId}.{priceInfo}', '["homeworkId", "changeDescription", "priceInfo"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'file_upload') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('file_upload', 'File Upload Notification', 'Sent when files are uploaded in the workflow', 'Files have been uploaded for homework #{homeworkId}.', '["homeworkId", "fileType"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'worker_draft_upload') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('worker_draft_upload', 'Worker Draft Upload', 'Sent when worker uploads draft files', 'Worker has uploaded draft files for homework #{homeworkId}. Ready for super worker review.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'super_worker_review_upload') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('super_worker_review_upload', 'Super Worker Review Upload', 'Sent when super worker uploads reviewed files', 'Super Worker has reviewed and uploaded files for homework #{homeworkId}. Ready for final approval.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'final_files_ready') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('final_files_ready', 'Final Files Ready', 'Sent when final files are ready for download', 'Your homework #{homeworkId} has been completed and final files are ready for download.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'payment_approval') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('payment_approval', 'Payment Approval', 'Sent when homework requires payment approval', 'Homework #{homeworkId} requires final payment approval.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'completed') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('completed', 'Homework Completed', 'Sent when homework is completed', 'Your homework #{homeworkId} has been completed and final files are ready for download.', '["homeworkId"]');
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE template_id = 'homework_submitted') THEN
      INSERT INTO notification_templates (template_id, name, description, template, variables) VALUES 
      ('homework_submitted', 'Homework Submitted', 'Sent when homework is submitted successfully', 'Your homework has been submitted successfully! Reference Code: {referenceCode}. Payment Amount: ${paymentAmount}. Please transfer the payment to: {bankDetails}. Your homework will begin processing once payment is confirmed.', '["referenceCode", "paymentAmount", "bankDetails"]');
   END IF;
   
END $$;
