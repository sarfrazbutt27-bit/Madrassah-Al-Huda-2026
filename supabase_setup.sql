-- Madrassah Al-Huda 2026.1 - Full Supabase Schema Setup
-- Run this in your Supabase SQL Editor

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    family_id TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gender TEXT,
    birth_date DATE,
    class_name TEXT,
    guardian TEXT,
    address TEXT,
    whatsapp TEXT,
    lesson_times TEXT,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    fees_paid_monthly JSONB DEFAULT '{}',
    report_released_halbjahr BOOLEAN DEFAULT FALSE,
    report_released_abschluss BOOLEAN DEFAULT FALSE,
    siblings_count INTEGER DEFAULT 0,
    payment_method TEXT,
    account_holder TEXT,
    iban TEXT,
    birth_country TEXT,
    phone_error BOOLEAN DEFAULT FALSE
);

-- 2. Users Table (Staff/Teachers)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL,
    password TEXT,
    whatsapp TEXT,
    assigned_classes TEXT[],
    teacher_title TEXT,
    first_name TEXT,
    last_name TEXT,
    birth_date DATE,
    gender TEXT,
    salary_paid_monthly JSONB DEFAULT '{}',
    zoom_url TEXT
);

-- 3. Grades Table
CREATE TABLE IF NOT EXISTS grades (
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    term TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    date DATE,
    PRIMARY KEY (student_id, subject, term)
);

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    PRIMARY KEY (student_id, date)
);

-- 5. Teacher Attendance Table
CREATE TABLE IF NOT EXISTS teacher_attendance (
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    PRIMARY KEY (user_id, date)
);

-- 6. Waitlist Table
CREATE TABLE IF NOT EXISTS waitlist (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    guardian_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT,
    address TEXT,
    preferred_language TEXT,
    applied_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending',
    payment_confirmed BOOLEAN DEFAULT FALSE,
    payment_method TEXT,
    participants JSONB DEFAULT '[]'
);

-- 7. Class Configs Table
CREATE TABLE IF NOT EXISTS class_configs (
    class_name TEXT PRIMARY KEY,
    whatsapp_link TEXT,
    selected_subjects TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Participation Records Table
CREATE TABLE IF NOT EXISTS participation_records (
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    verhalten TEXT,
    vortrag TEXT,
    puenktlichkeit TEXT,
    zusatzpunkte INTEGER DEFAULT 0,
    remarks TEXT,
    PRIMARY KEY (student_id, term)
);

-- 9. Homework Table
CREATE TABLE IF NOT EXISTS homework (
    id TEXT PRIMARY KEY,
    class_id TEXT,
    subject TEXT,
    title TEXT,
    instructions TEXT,
    due_date DATE,
    repeat_type TEXT,
    submission_type TEXT,
    visibility TEXT,
    reminder_enabled BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attachment_url TEXT,
    attachment_type TEXT
);

-- 10. Homework Submissions Table
CREATE TABLE IF NOT EXISTS homework_submissions (
    id TEXT PRIMARY KEY,
    homework_id TEXT REFERENCES homework(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    student_comment TEXT,
    teacher_comment TEXT,
    score INTEGER,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    file_url TEXT,
    audio_url TEXT
);

-- 11. Curricula Table
CREATE TABLE IF NOT EXISTS curricula (
    id TEXT PRIMARY KEY,
    class_name TEXT,
    term TEXT,
    title TEXT,
    file_url TEXT,
    file_type TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional but recommended
-- For this demo, we'll keep it simple, but in production you should define policies.
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE participation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;

-- 12. Resources Table (Theory Library)
CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    class_name TEXT,
    subject TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    book_url TEXT,
    is_main_book BOOLEAN DEFAULT FALSE,
    is_unlocked BOOLEAN DEFAULT FALSE,
    language TEXT DEFAULT 'mixed',
    quiz_data JSONB DEFAULT '[]',
    lessons JSONB DEFAULT '[]',
    quiz_attempts JSONB DEFAULT '{}'
);

-- 13. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 14. WhatsApp Logs Table
CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id TEXT PRIMARY KEY,
    student_id TEXT,
    homework_id TEXT,
    status TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Quiz Results Table
CREATE TABLE IF NOT EXISTS quiz_results (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    resource_id TEXT REFERENCES resources(id) ON DELETE CASCADE,
    term TEXT,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix for existing resources table to ensure all columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quiz_results' AND column_name='term') THEN
        ALTER TABLE quiz_results ADD COLUMN term TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='book_url') THEN
        ALTER TABLE resources ADD COLUMN book_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='is_main_book') THEN
        ALTER TABLE resources ADD COLUMN is_main_book BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='quiz_data') THEN
        ALTER TABLE resources ADD COLUMN quiz_data JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='lessons') THEN
        ALTER TABLE resources ADD COLUMN lessons JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='quiz_attempts') THEN
        ALTER TABLE resources ADD COLUMN quiz_attempts JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='is_unlocked') THEN
        ALTER TABLE resources ADD COLUMN is_unlocked BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='language') THEN
        ALTER TABLE resources ADD COLUMN language TEXT DEFAULT 'mixed';
    END IF;
END $$;

-- Fix for existing class_configs table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='class_configs' AND column_name='selected_subjects') THEN
        ALTER TABLE class_configs ADD COLUMN selected_subjects TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Fix for existing students table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='phone_error') THEN
        ALTER TABLE students ADD COLUMN phone_error BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE participation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Create simple policies for public access (for development)
-- This ensures that if the script is re-run, it won't fail on "policy already exists"
DO $$ 
BEGIN
    -- Students
    DROP POLICY IF EXISTS "Public Access" ON students;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON students;
    CREATE POLICY "Public Access" ON students FOR ALL USING (true) WITH CHECK (true);
    
    -- Users
    DROP POLICY IF EXISTS "Public Access" ON users;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON users;
    CREATE POLICY "Public Access" ON users FOR ALL USING (true) WITH CHECK (true);
    
    -- Grades
    DROP POLICY IF EXISTS "Public Access" ON grades;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON grades;
    CREATE POLICY "Public Access" ON grades FOR ALL USING (true) WITH CHECK (true);
    
    -- Attendance
    DROP POLICY IF EXISTS "Public Access" ON attendance;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON attendance;
    CREATE POLICY "Public Access" ON attendance FOR ALL USING (true) WITH CHECK (true);
    
    -- Teacher Attendance
    DROP POLICY IF EXISTS "Public Access" ON teacher_attendance;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON teacher_attendance;
    CREATE POLICY "Public Access" ON teacher_attendance FOR ALL USING (true) WITH CHECK (true);
    
    -- Waitlist
    DROP POLICY IF EXISTS "Public Access" ON waitlist;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON waitlist;
    CREATE POLICY "Public Access" ON waitlist FOR ALL USING (true) WITH CHECK (true);
    
    -- Class Configs
    DROP POLICY IF EXISTS "Public Access" ON class_configs;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON class_configs;
    CREATE POLICY "Public Access" ON class_configs FOR ALL USING (true) WITH CHECK (true);
    
    -- Participation Records
    DROP POLICY IF EXISTS "Public Access" ON participation_records;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON participation_records;
    CREATE POLICY "Public Access" ON participation_records FOR ALL USING (true) WITH CHECK (true);
    
    -- Homework
    DROP POLICY IF EXISTS "Public Access" ON homework;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON homework;
    CREATE POLICY "Public Access" ON homework FOR ALL USING (true) WITH CHECK (true);
    
    -- Homework Submissions
    DROP POLICY IF EXISTS "Public Access" ON homework_submissions;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON homework_submissions;
    CREATE POLICY "Public Access" ON homework_submissions FOR ALL USING (true) WITH CHECK (true);
    
    -- Curricula
    DROP POLICY IF EXISTS "Public Access" ON curricula;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON curricula;
    CREATE POLICY "Public Access" ON curricula FOR ALL USING (true) WITH CHECK (true);
    
    -- Resources
    DROP POLICY IF EXISTS "Public Access" ON resources;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON resources;
    CREATE POLICY "Public Access" ON resources FOR ALL USING (true) WITH CHECK (true);

    -- Messages
    DROP POLICY IF EXISTS "Public Access" ON messages;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON messages;
    CREATE POLICY "Public Access" ON messages FOR ALL USING (true) WITH CHECK (true);

    -- WhatsApp Logs
    DROP POLICY IF EXISTS "Public Access" ON whatsapp_logs;
    DROP POLICY IF EXISTS "Allow all for anonymous" ON whatsapp_logs;
    CREATE POLICY "Public Access" ON whatsapp_logs FOR ALL USING (true) WITH CHECK (true);

    -- Quiz Results
    DROP POLICY IF EXISTS "Public Access" ON quiz_results;
    CREATE POLICY "Public Access" ON quiz_results FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 16. NEW Homework System Tables (AI Quiz + Attempts)
CREATE TABLE IF NOT EXISTS homework_assignments (
    id TEXT PRIMARY KEY,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_id TEXT REFERENCES users(id),
    title TEXT NOT NULL,
    book_url TEXT,
    pages_from INTEGER,
    pages_to INTEGER,
    max_attempts INTEGER DEFAULT 5,
    assignment_type TEXT DEFAULT 'Quiz',
    daily_target_minutes INTEGER DEFAULT 0,
    language TEXT DEFAULT 'mixed',
    instructions TEXT,
    due_date DATE,
    status TEXT DEFAULT 'Draft',
    quiz_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_log TEXT
);

CREATE TABLE IF NOT EXISTS homework_quiz_questions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT REFERENCES homework_assignments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    correct_option TEXT NOT NULL, -- 'A', 'B', 'C'
    explanation TEXT,
    source_hint TEXT
);

CREATE TABLE IF NOT EXISTS homework_attempts (
    id TEXT PRIMARY KEY,
    assignment_id TEXT REFERENCES homework_assignments(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    score_percent INTEGER DEFAULT 0,
    is_perfect BOOLEAN DEFAULT FALSE,
    time_spent_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS homework_attempt_answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT REFERENCES homework_attempts(id) ON DELETE CASCADE,
    question_id TEXT REFERENCES homework_quiz_questions(id) ON DELETE CASCADE,
    selected_option TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homework_teacher_ratings (
    id TEXT PRIMARY KEY,
    assignment_id TEXT REFERENCES homework_assignments(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    rating TEXT NOT NULL, -- 'Sehr gut', 'Gut', 'Noch mal wiederholen'
    feedback_text TEXT,
    rated_by TEXT REFERENCES users(id),
    rated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homework_reports (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    assignment_title TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score_percent INTEGER NOT NULL,
    assignment_type TEXT DEFAULT 'Quiz',
    time_spent_seconds INTEGER DEFAULT 0,
    rating TEXT NOT NULL,
    feedback_text TEXT
);

-- Enable RLS for NEW tables
ALTER TABLE homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_teacher_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_reports ENABLE ROW LEVEL SECURITY;

-- Create public policies for NEW tables
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Access" ON homework_assignments;
    CREATE POLICY "Public Access" ON homework_assignments FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public Access" ON homework_quiz_questions;
    CREATE POLICY "Public Access" ON homework_quiz_questions FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public Access" ON homework_attempts;
    CREATE POLICY "Public Access" ON homework_attempts FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public Access" ON homework_attempt_answers;
    CREATE POLICY "Public Access" ON homework_attempt_answers FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public Access" ON homework_teacher_ratings;
    CREATE POLICY "Public Access" ON homework_teacher_ratings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Access" ON homework_reports;
    CREATE POLICY "Public Access" ON homework_reports FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 17. Tajweed Practice Table
CREATE TABLE IF NOT EXISTS tajweed_practice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    surah TEXT NOT NULL,
    ayah INTEGER NOT NULL,
    accuracy INTEGER NOT NULL,
    mistakes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tajweed_practice ENABLE ROW LEVEL SECURITY;

-- Create public policy for tajweed_practice
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Access" ON tajweed_practice;
    CREATE POLICY "Public Access" ON tajweed_practice FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 18. Library Resources Table
CREATE TABLE IF NOT EXISTS library_resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    class_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

ALTER TABLE library_resources ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Access" ON library_resources;
    CREATE POLICY "Public Access" ON library_resources FOR ALL USING (true) WITH CHECK (true);
END $$;
