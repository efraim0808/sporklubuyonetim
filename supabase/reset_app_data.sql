-- Direct database reset script without any RPC function dependency.
-- The locked super-admin account is intentionally never deleted.
-- Run this in the Supabase SQL editor when you want to clean the app data manually.

BEGIN;

-- 1) Remove notification and message records first so they do not block other deletions.
DELETE FROM public.club_notifications;
DELETE FROM public.club_messages;

-- 2) Remove application records next to avoid FK conflicts.
DELETE FROM public.club_applications;

-- 3) Remove student data.
DELETE FROM public.club_students;

-- 4) Remove coach records.
DELETE FROM public.club_coaches;

-- 5) Remove branch data.
DELETE FROM public.club_branches;

-- 6) Remove clubs last.
DELETE FROM public.clubs;

-- 6) Keep the super-admin profile intact; do not delete or modify it.
-- If you also want to delete non-admin profiles, exclude both role variants explicitly.
DELETE FROM public.profiles
WHERE role IS NOT NULL
  AND LOWER(role) NOT IN ('super-admin', 'super_admin');

-- Frontend-only authorization: access control is enforced in the application, not in database policies.
ALTER TABLE public.club_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_coaches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_applications DISABLE ROW LEVEL SECURITY;

INSERT INTO public.profiles (id, club_id, role, full_name, username, password, email, phone, is_active, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
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
ON CONFLICT (id) DO NOTHING;

COMMIT;
