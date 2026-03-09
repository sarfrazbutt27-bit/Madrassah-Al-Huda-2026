
-- Quran Practice Table
CREATE TABLE IF NOT EXISTS quran_practice (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    surah_number INTEGER NOT NULL,
    ayah_number INTEGER NOT NULL,
    practiced BOOLEAN DEFAULT FALSE,
    repeat_needed BOOLEAN DEFAULT FALSE,
    practice_count INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, surah_number, ayah_number)
);

-- Enable RLS
ALTER TABLE quran_practice ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all for authenticated users" ON quran_practice
    FOR ALL USING (true) WITH CHECK (true);
