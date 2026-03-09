-- Madrassah Al-Huda Curriculum Module Setup
-- Run this in your Supabase SQL Editor

-- 1. Profiles Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'STUDENT', -- 'PRINCIPAL', 'TEACHER', 'STUDENT'
    display_name TEXT,
    assigned_classes TEXT[] DEFAULT '{}',
    assigned_levels TEXT[] DEFAULT '{}', -- e.g., 'J-1/M-1', 'J-2/M-2'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Curriculum Years Table
CREATE TABLE IF NOT EXISTS curriculum_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL, -- e.g., '2025/2026'
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Curriculum Items Table
CREATE TABLE IF NOT EXISTS curriculum_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_id UUID REFERENCES curriculum_years(id) ON DELETE CASCADE,
    subject TEXT NOT NULL, -- 'Quran', 'Tajweed', 'Hifz', 'Fiqh', 'Sierah', 'Ziele', etc.
    level TEXT NOT NULL, -- 'J-1/M-1', 'J-2/M-2', 'J-3/M-3'
    term TEXT NOT NULL, -- 'Halbjahr', 'Abschluss'
    title TEXT NOT NULL,
    content TEXT,
    order_index INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft', -- 'draft', 'published'
    published_at TIMESTAMP WITH TIME ZONE,
    published_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Curriculum Progress Table
CREATE TABLE IF NOT EXISTS curriculum_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    curriculum_item_id UUID REFERENCES curriculum_items(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, curriculum_item_id)
);

-- 5. Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Helper Functions for Roles
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid()) = 'PRINCIPAL';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_teacher() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid()) = 'TEACHER';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_student() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid()) = 'STUDENT';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Audit Log Trigger Function
CREATE OR REPLACE FUNCTION audit_curriculum_changes() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (actor_user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (actor_user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, OLD.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (actor_user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Triggers
CREATE TRIGGER trigger_audit_curriculum_items
AFTER INSERT OR UPDATE OR DELETE ON curriculum_items
FOR EACH ROW EXECUTE FUNCTION audit_curriculum_changes();

CREATE TRIGGER trigger_audit_curriculum_years
AFTER INSERT OR UPDATE OR DELETE ON curriculum_years
FOR EACH ROW EXECUTE FUNCTION audit_curriculum_changes();

-- 9. Row Level Security (RLS) Policies

-- Profiles: everyone can read their own, admin can read all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles read own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles admin read all" ON profiles FOR SELECT USING (is_admin());

-- Curriculum Years
ALTER TABLE curriculum_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Curriculum years read published" ON curriculum_years FOR SELECT USING (is_active = true OR is_admin() OR is_teacher());
CREATE POLICY "Curriculum years admin/teacher CRUD" ON curriculum_years FOR ALL USING (is_admin() OR is_teacher());

-- Curriculum Items
ALTER TABLE curriculum_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Curriculum items read published" ON curriculum_items FOR SELECT USING (status = 'published' OR is_admin() OR is_teacher());
CREATE POLICY "Curriculum items admin/teacher CRUD" ON curriculum_items FOR ALL USING (is_admin() OR is_teacher());

-- Curriculum Progress
ALTER TABLE curriculum_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Curriculum progress read own" ON curriculum_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Curriculum progress student upsert own" ON curriculum_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Curriculum progress teacher/admin read" ON curriculum_progress FOR SELECT USING (is_admin() OR is_teacher());

-- Audit Log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit log admin read" ON audit_log FOR SELECT USING (is_admin());

-- 10. Seed Data for 2025/2026
DO $$
DECLARE
  year_id UUID;
BEGIN
  -- Create School Year
  INSERT INTO curriculum_years (label, start_date, end_date, is_active)
  VALUES ('2025/2026', '2025-09-01', '2026-07-31', true)
  RETURNING id INTO year_id;

  -- J-1/M-1 – 1. Halbjahr
  INSERT INTO curriculum_items (year_id, subject, level, term, title, content, order_index, status) VALUES
  (year_id, 'Quran', 'J-1/M-1', 'Halbjahr', 'Yassarnal Qur''an Teil 1', 'Arabische Buchstaben erkennen, Fatha, Kasra, Damma, einfache Silben', 1, 'published'),
  (year_id, 'Hifz', 'J-1/M-1', 'Halbjahr', 'Alltags-Duas', 'Aufwachen, vor/nach Essen, vor Schlafen, Haus betreten/verlassen, Toilette rein/raus, im Fahrzeug', 2, 'published'),
  (year_id, 'Hifz', 'J-1/M-1', 'Halbjahr', 'Drei Schutzsuren', 'Al-Ikhlas, Al-Falaq, An-Nas (mit arabischem Text)', 3, 'published'),
  (year_id, 'Ziele', 'J-1/M-1', 'Halbjahr', 'Lernziele', 'Lesen lernen, Duas auswendig, erste Verbindung zum Qur''an', 4, 'published');

  -- J-1/M-1 – Abschluss
  INSERT INTO curriculum_items (year_id, subject, level, term, title, content, order_index, status) VALUES
  (year_id, 'Quran', 'J-1/M-1', 'Abschluss', 'Yassarnal Qur''an komplett', 'Buchstaben sicher; einfache Wörter lesen', 1, 'published'),
  (year_id, 'Hifz', 'J-1/M-1', 'Abschluss', 'Wichtige Gebete', 'Ayatul-Kursi; Amanar-Rasul (letzte 2 Verse Baqarah); At-Tahiyyat; Janazah-Dua; vollständiger Adhan', 2, 'published'),
  (year_id, 'Sierah', 'J-1/M-1', 'Abschluss', 'Sirah 1', 'Geburt, Kindheit/Jugend, erste Offenbarung, Beginn der Da''wah, Eigenschaften', 3, 'published'),
  (year_id, 'Ziele', 'J-1/M-1', 'Abschluss', 'Abschlussziel', 'Qur''an selbstständig lesen; wichtige Duas; Adhan korrekt; Grundwissen Sirah', 4, 'published');

  -- J-2/M-2 – Halbjahr
  INSERT INTO curriculum_items (year_id, subject, level, term, title, content, order_index, status) VALUES
  (year_id, 'Quran', 'J-2/M-2', 'Halbjahr', 'Yassarnal Qur''an Teil 2', 'Madd; Alif Mamdudah; Ya Mamdudah; Waw Mamdudah; Hamzah Sakinah; Shaddah', 1, 'published'),
  (year_id, 'Hifz', 'J-2/M-2', 'Halbjahr', 'Suren-Hifz', 'von Sura Al-Fil bis Sura An-Nas', 2, 'published'),
  (year_id, 'Fiqh', 'J-2/M-2', 'Halbjahr', 'Religiöse Lehre', 'Erste Religiöse Lehre für Kinder (Lektion 1–8)', 3, 'published');

  -- J-2/M-2 – Abschluss
  INSERT INTO curriculum_items (year_id, subject, level, term, title, content, order_index, status) VALUES
  (year_id, 'Quran', 'J-2/M-2', 'Abschluss', 'Yassarnal Qur''an Teil 2', 'Ganzes Buch', 1, 'published'),
  (year_id, 'Hifz', 'J-2/M-2', 'Abschluss', 'Suren-Hifz', 'von Sura Al-Bayyinah bis Sura An-Nas', 2, 'published'),
  (year_id, 'Fiqh', 'J-2/M-2', 'Abschluss', 'Religiöse Lehre', 'Erste Religiöse Lehre für Kinder ganzes Buch', 3, 'published'),
  (year_id, 'Sierah', 'J-2/M-2', 'Abschluss', 'Sirah 1', 'Ganzes Buch', 4, 'published');

  -- J-3/M-3 – Halbjahr
  INSERT INTO curriculum_items (year_id, subject, level, term, title, content, order_index, status) VALUES
  (year_id, 'Quran', 'J-3/M-3', 'Halbjahr', 'Flüssiges Lesen', 'von Sura An-Naba bis Sura Al-Fajr', 1, 'published'),
  (year_id, 'Tajweed', 'J-3/M-3', 'Halbjahr', 'Regeln', 'Nun Sakinah & Tanween (Izhar, Idgham, Iqlab, Ikhfa); Meem Sakinah (Izhar Shafawi, Idgham Shafawi, Ikhfa Shafawi)', 2, 'published'),
  (year_id, 'Hifz', 'J-3/M-3', 'Halbjahr', 'Suren-Hifz', 'von Sura Al-Fajr bis Sura An-Nas', 3, 'published'),
  (year_id, 'Fiqh', 'J-3/M-3', 'Halbjahr', 'Taleem-ul-Haq', 'Taleem-ul-Haq Teil 1 (erste Hälfte)', 4, 'published'),
  (year_id, 'Ziele', 'J-3/M-3', 'Halbjahr', 'Ziel Halbjahr', 'Qur''an flüssig lesen & Tajweed anwenden; Hifz; Fiqh Grundlagen', 5, 'published');

  -- J-3/M-3 – Abschluss
  INSERT INTO curriculum_items (year_id, subject, level, term, title, content, order_index, status) VALUES
  (year_id, 'Quran', 'J-3/M-3', 'Abschluss', 'Erster Juz', 'Qur''an Lesen: Erster Juz', 1, 'published'),
  (year_id, 'Tajweed', 'J-3/M-3', 'Abschluss', 'Tajweed Regeln', 'Madd; Raa; Waqf', 2, 'published'),
  (year_id, 'Hifz', 'J-3/M-3', 'Abschluss', 'Ya-Sin', 'Ya-Sin (erste 2 Seiten)', 3, 'published'),
  (year_id, 'Fiqh', 'J-3/M-3', 'Abschluss', 'Taleem-ul-Haq', 'Taleem-ul-Haq Teil 1 (zweite Hälfte)', 4, 'published'),
  (year_id, 'Sierah', 'J-3/M-3', 'Abschluss', 'Sirah 2', 'Ganzes Buch', 5, 'published');

END $$;
