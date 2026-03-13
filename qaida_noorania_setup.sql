
-- Yassarnal Quran Module Setup

-- Lessons Table
CREATE TABLE IF NOT EXISTS qaida_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Table (Individual letters/words/sentences)
CREATE TABLE IF NOT EXISTS qaida_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES qaida_lessons(id) ON DELETE CASCADE,
    arabic_text TEXT NOT NULL,
    transliteration TEXT,
    audio_url TEXT,
    tajweed_rule TEXT, -- e.g., 'madd', 'ghunnah', 'qalqalah'
    explanation TEXT,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Progress Table
CREATE TABLE IF NOT EXISTS qaida_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL, -- Matches student ID in main app
    lesson_id UUID REFERENCES qaida_lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS qaida_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    lesson_id UUID REFERENCES qaida_lessons(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'assigned' -- 'assigned', 'in-progress', 'completed'
);

-- Seed Initial Lessons
INSERT INTO qaida_lessons (lesson_number, title, description) VALUES
(1, 'Yassarnal Quran Teil 1', 'Arabische Buchstaben erkennen, Fatha, Kasra, Damma, einfache Silben.'),
(2, 'Yassarnal Quran Teil 2', 'Madd, Shadda, Sukoon und fortgeschrittene Regeln.'),
(3, 'Tanween', 'Doppelvokale (Fathatain, Kasratain, Dammatain).'),
(4, 'Madd Buchstaben', 'Alif Madd, Waw Madd und Ya Madd - Die langen Vokale.'),
(5, 'Sukoon', 'Das Zeichen der Ruhe oder Abwesenheit eines Vokals.'),
(6, 'Shadda', 'Das Zeichen der Betonung oder Verdoppelung eines Buchstabens.'),
(7, 'Madd Regeln', 'Fortgeschrittene Regeln der Dehnung.'),
(8, 'Noon Sakinah & Tanween', 'Regeln von Izhar, Idgham, Iqlab und Ikhfa.'),
(9, 'Meem Sakinah', 'Regeln von Ikhfa Shafawi, Idgham Shafawi und Izhar Shafawi.'),
(10, 'Übungswörter', 'Kombinierte Übung aller Regeln in Wörtern und Sätzen.');

-- RLS Policies
ALTER TABLE qaida_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE qaida_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE qaida_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE qaida_assignments ENABLE ROW LEVEL SECURITY;

-- Public read for lessons and content
CREATE POLICY "Allow public read for lessons" ON qaida_lessons FOR SELECT USING (true);
CREATE POLICY "Allow public read for content" ON qaida_content FOR SELECT USING (true);

-- Progress: users can read/write their own progress
CREATE POLICY "Users can manage their own progress" ON qaida_progress
    FOR ALL USING (auth.uid()::text = student_id);

-- Assignments: teachers can manage, students can read
CREATE POLICY "Teachers can manage assignments" ON qaida_assignments
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('TEACHER', 'PRINCIPAL')
    ));

CREATE POLICY "Students can read their assignments" ON qaida_assignments
    FOR SELECT USING (auth.uid()::text = student_id);
