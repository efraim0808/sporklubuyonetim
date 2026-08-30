-- Reset app tables to a clean, production-ready state.
-- This file is intended to be run in the Supabase SQL editor.

BEGIN;

DROP TABLE IF EXISTS club_messages CASCADE;
DROP TABLE IF EXISTS club_notifications CASCADE;
DROP TABLE IF EXISTS club_announcements CASCADE;
DROP TABLE IF EXISTS club_payments CASCADE;
DROP TABLE IF EXISTS club_students CASCADE;
DROP TABLE IF EXISTS club_branches CASCADE;
DROP TABLE IF EXISTS club_coaches CASCADE;
DROP TABLE IF EXISTS club_applications CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  manager_name TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  address TEXT,
  username TEXT,
  password TEXT,
  suspended BOOLEAN NOT NULL DEFAULT false,
  subscription JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'super-admin',
  full_name TEXT NOT NULL DEFAULT 'Süper Admin',
  username TEXT,
  password TEXT,
  email TEXT,
  phone TEXT,
  branch_id UUID REFERENCES club_branches(id) ON DELETE SET NULL,
  branch_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS club_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS club_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT,
  phone TEXT,
  branch_id UUID REFERENCES club_branches(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_club_coaches_identity
  ON public.club_coaches (
    club_id,
    COALESCE(branch_id::text, '00000000-0000-0000-0000-000000000000'),
    LOWER(TRIM(name)),
    LOWER(TRIM(username))
  );

CREATE TABLE IF NOT EXISTS club_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES club_branches(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  birth_date DATE,
  parent_name TEXT,
  parent_phone TEXT,
  started_at DATE,
  status TEXT NOT NULL DEFAULT 'active',
  branch_ids JSONB DEFAULT '[]'::jsonb,
  branch_status JSONB DEFAULT '{}'::jsonb,
  attendance JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS club_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES club_students(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES club_branches(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Ödenmedi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS club_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS club_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID,
  type TEXT NOT NULL DEFAULT 'notification',
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.club_notifications
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'notification';

CREATE TABLE IF NOT EXISTS club_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  student_id UUID REFERENCES club_students(id) ON DELETE SET NULL,
  student_name TEXT,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.club_messages
  ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS club_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_surname TEXT NOT NULL,
  birth_date DATE,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  branch_id UUID REFERENCES club_branches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  files JSONB DEFAULT '[]'::jsonb,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.club_applications
  ADD COLUMN IF NOT EXISTS password TEXT;

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clubs_all_access" ON clubs;
DROP POLICY IF EXISTS "profiles_all_access" ON profiles;
DROP POLICY IF EXISTS "club_branches_all_access" ON club_branches;
DROP POLICY IF EXISTS "club_coaches_all_access" ON club_coaches;
DROP POLICY IF EXISTS "club_students_all_access" ON club_students;
DROP POLICY IF EXISTS "club_payments_all_access" ON club_payments;
DROP POLICY IF EXISTS "club_announcements_all_access" ON club_announcements;
DROP POLICY IF EXISTS "club_notifications_all_access" ON club_notifications;
DROP POLICY IF EXISTS "club_messages_all_access" ON club_messages;
DROP POLICY IF EXISTS "club_applications_all_access" ON club_applications;

CREATE POLICY "clubs_all_access" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "profiles_all_access" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "club_branches_all_access" ON club_branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "club_coaches_all_access" ON club_coaches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "club_students_all_access" ON club_students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "club_payments_all_access" ON club_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "club_announcements_all_access" ON club_announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "club_notifications_all_access" ON club_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "club_messages_all_access" ON club_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "club_applications_all_access" ON club_applications FOR ALL USING (true) WITH CHECK (true);

WITH ranked_coaches AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY club_id,
                        COALESCE(branch_id::text, '00000000-0000-0000-0000-000000000000'),
                        LOWER(TRIM(name)),
                        LOWER(TRIM(username))
           ORDER BY created_at ASC, id ASC
         ) AS row_num
  FROM public.club_coaches
)
DELETE FROM public.club_coaches c
USING ranked_coaches r
WHERE c.id = r.id
  AND r.row_num > 1;

CREATE OR REPLACE FUNCTION public.reset_app_data()
RETURNS TABLE(message text)
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.profiles
  WHERE role IS NOT NULL
    AND LOWER(role) NOT IN ('super-admin', 'super_admin');

  TRUNCATE TABLE public.club_messages, public.club_announcements, public.club_payments,
    public.club_students, public.club_branches, public.club_coaches,
    public.club_applications, public.clubs RESTART IDENTITY CASCADE;

  INSERT INTO public.profiles (id, club_id, role, full_name, username, password, email, phone, is_active, created_at)
  VALUES (
    gen_random_uuid(),
    NULL,
    'super-admin',
    'Süper Admin',
    'sagliksk@gmail.com',
    'Efraim+08',
    'sagliksk@gmail.com',
    NULL,
    true,
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT 'System reset complete. Only the locked super-admin remains.'::text;
END;
$$;

COMMIT;

-- The system is intentionally left empty and ready for real data entry.
-- Create the super admin user via Supabase Auth first, then optionally insert or link the profile record.
