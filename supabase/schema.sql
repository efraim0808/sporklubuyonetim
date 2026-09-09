-- Reset app tables to a clean, production-ready state.
-- This file is intended to be run in the Supabase SQL editor.

BEGIN;

SET search_path = public, auth;

DROP TABLE IF EXISTS public.club_messages CASCADE;
DROP TABLE IF EXISTS public.club_notifications CASCADE;
DROP TABLE IF EXISTS public.club_announcements CASCADE;
DROP TABLE IF EXISTS public.club_payments CASCADE;
DROP TABLE IF EXISTS public.club_students CASCADE;
DROP TABLE IF EXISTS public.club_branches CASCADE;
DROP TABLE IF EXISTS public.club_coaches CASCADE;
DROP TABLE IF EXISTS public.club_applications CASCADE;
DROP TABLE IF EXISTS public.clubs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE IF NOT EXISTS public.clubs (
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

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'super-admin',
  full_name TEXT NOT NULL DEFAULT 'Süper Admin',
  username TEXT,
  password TEXT,
  email TEXT,
  phone TEXT,
  branch_id UUID REFERENCES public.club_branches(id) ON DELETE SET NULL,
  branch_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT,
  phone TEXT,
  branch_id UUID REFERENCES public.club_branches(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS public.club_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.club_branches(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS public.club_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.club_students(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.club_branches(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Ödenmedi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID,
  type TEXT NOT NULL DEFAULT 'notification',
  text TEXT NOT NULL,
  student_id UUID REFERENCES public.club_students(id) ON DELETE SET NULL,
  student_name TEXT,
  parent_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.club_notifications
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'notification';

ALTER TABLE public.club_notifications
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.club_students(id) ON DELETE SET NULL;

ALTER TABLE public.club_notifications
  ADD COLUMN IF NOT EXISTS student_name TEXT;

ALTER TABLE public.club_notifications
  ADD COLUMN IF NOT EXISTS parent_phone TEXT;

CREATE OR REPLACE FUNCTION public.club_is_active_for_access(club_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.clubs c
    WHERE c.id = club_uuid
      AND c.suspended = true
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_is_active_for_access(profile_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    LEFT JOIN public.clubs c ON c.id = p.club_id
    WHERE p.id = profile_uuid
      AND (
        p.is_active = false
        OR (c.id IS NOT NULL AND c.suspended = true)
      )
  );
$$;

CREATE TABLE IF NOT EXISTS public.club_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  student_id UUID REFERENCES public.club_students(id) ON DELETE SET NULL,
  student_name TEXT,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.club_messages
  ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.club_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_surname TEXT NOT NULL,
  birth_date DATE,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  branch_id UUID REFERENCES public.club_branches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  files JSONB DEFAULT '[]'::jsonb,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.club_applications
  ADD COLUMN IF NOT EXISTS password TEXT;

-- Access control is intentionally handled in the frontend application layer.
-- RLS is disabled here so suspended-club checks remain centralized in the UI logic.
ALTER TABLE public.clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_coaches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_applications DISABLE ROW LEVEL SECURITY;

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
