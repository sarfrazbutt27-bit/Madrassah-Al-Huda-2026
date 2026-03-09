-- Migration: Homework History Archiving & Curriculum Save Fix
-- Run this in your Supabase SQL Editor

-- 1. Add archiving columns to Homework tables
ALTER TABLE homework ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS archived_by TEXT;

ALTER TABLE homework_submissions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE homework_submissions ADD COLUMN IF NOT EXISTS archived_by TEXT;

ALTER TABLE homework_assignments ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE homework_assignments ADD COLUMN IF NOT EXISTS archived_by TEXT;

ALTER TABLE homework_attempts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE homework_attempts ADD COLUMN IF NOT EXISTS archived_by TEXT;

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_homework_archived_at ON homework(archived_at);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_archived_at ON homework_submissions(archived_at);
CREATE INDEX IF NOT EXISTS idx_homework_assignments_archived_at ON homework_assignments(archived_at);
CREATE INDEX IF NOT EXISTS idx_homework_attempts_archived_at ON homework_attempts(archived_at);

-- 3. Update Curriculum Items for robust saving
-- Add teacher_id if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='curriculum_items' AND column_name='teacher_id') THEN
        ALTER TABLE curriculum_items ADD COLUMN teacher_id TEXT;
    END IF;
END $$;

-- Add unique constraint for upsert if not exists
-- We use year_id, subject, level, term, and title as a unique identifier for an item
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'curriculum_items_unique_key') THEN
        ALTER TABLE curriculum_items ADD CONSTRAINT curriculum_items_unique_key UNIQUE (year_id, subject, level, term, title);
    END IF;
END $$;

-- 4. RPC Function for clearing homework history
CREATE OR REPLACE FUNCTION clear_homework_history(
    p_filters JSONB,
    p_archived_by TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_class_id TEXT;
    v_subject TEXT;
    v_student_id TEXT;
    v_date_from DATE;
    v_date_to DATE;
    v_assignments_count INTEGER := 0;
    v_submissions_count INTEGER := 0;
    v_classic_hw_count INTEGER := 0;
    v_classic_sub_count INTEGER := 0;
BEGIN
    -- Extract filters
    v_class_id := p_filters->>'class_id';
    v_subject := p_filters->>'subject';
    v_student_id := p_filters->>'student_id';
    v_date_from := (p_filters->>'date_from')::DATE;
    v_date_to := (p_filters->>'date_to')::DATE;

    -- 1. Archive Classic Homework (homework table)
    UPDATE homework
    SET archived_at = NOW(),
        archived_by = p_archived_by
    WHERE archived_at IS NULL
      AND (v_class_id IS NULL OR class_id = v_class_id)
      AND (v_subject IS NULL OR subject = v_subject)
      AND (v_date_from IS NULL OR due_date >= v_date_from)
      AND (v_date_to IS NULL OR due_date <= v_date_to);
    
    GET DIAGNOSTICS v_classic_hw_count = ROW_COUNT;

    -- 2. Archive Classic Submissions
    UPDATE homework_submissions
    SET archived_at = NOW(),
        archived_by = p_archived_by
    WHERE archived_at IS NULL
      AND (v_student_id IS NULL OR student_id = v_student_id)
      AND homework_id IN (
          SELECT id FROM homework 
          WHERE archived_at IS NOT NULL -- Just archived or previously archived
      );
    
    GET DIAGNOSTICS v_classic_sub_count = ROW_COUNT;

    -- 3. Archive AI Quiz Assignments (homework_assignments)
    UPDATE homework_assignments
    SET archived_at = NOW(),
        archived_by = p_archived_by
    WHERE archived_at IS NULL
      AND (v_class_id IS NULL OR class_name = v_class_id)
      AND (v_subject IS NULL OR subject = v_subject)
      AND (v_date_from IS NULL OR due_date >= v_date_from)
      AND (v_date_to IS NULL OR due_date <= v_date_to);
    
    GET DIAGNOSTICS v_assignments_count = ROW_COUNT;

    -- 4. Archive AI Quiz Attempts
    UPDATE homework_attempts
    SET archived_at = NOW(),
        archived_by = p_archived_by
    WHERE archived_at IS NULL
      AND (v_student_id IS NULL OR student_id = v_student_id)
      AND assignment_id IN (
          SELECT id FROM homework_assignments 
          WHERE archived_at IS NOT NULL
      );
    
    GET DIAGNOSTICS v_submissions_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'classic_homework_archived', v_classic_hw_count,
        'classic_submissions_archived', v_classic_sub_count,
        'ai_assignments_archived', v_assignments_count,
        'ai_attempts_archived', v_submissions_count
    );
END;
$$;

-- 5. Update RLS Policies to exclude archived items
-- Note: We assume "Public Access" policy exists from previous setups.
-- We will refine them to include archived_at IS NULL check.

DO $$ 
BEGIN
    -- Homework
    DROP POLICY IF EXISTS "Public Access" ON homework;
    CREATE POLICY "Public Access" ON homework FOR ALL USING (archived_at IS NULL) WITH CHECK (archived_at IS NULL);
    
    -- Homework Submissions
    DROP POLICY IF EXISTS "Public Access" ON homework_submissions;
    CREATE POLICY "Public Access" ON homework_submissions FOR ALL USING (archived_at IS NULL) WITH CHECK (archived_at IS NULL);
    
    -- Homework Assignments
    DROP POLICY IF EXISTS "Public Access" ON homework_assignments;
    CREATE POLICY "Public Access" ON homework_assignments FOR ALL USING (archived_at IS NULL) WITH CHECK (archived_at IS NULL);
    
    -- Homework Attempts
    DROP POLICY IF EXISTS "Public Access" ON homework_attempts;
    CREATE POLICY "Public Access" ON homework_attempts FOR ALL USING (archived_at IS NULL) WITH CHECK (archived_at IS NULL);

    -- Curriculum Items: Ensure Admin/Teacher can do everything
    DROP POLICY IF EXISTS "Curriculum items admin/teacher CRUD" ON curriculum_items;
    CREATE POLICY "Curriculum items admin/teacher CRUD" ON curriculum_items FOR ALL USING (true) WITH CHECK (true);
END $$;
