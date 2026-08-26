-- Direct database reset script without any RPC function dependency.
-- The locked super-admin account is intentionally never deleted.
-- Run this in the Supabase SQL editor when you want to clean the app data manually.

BEGIN;

-- 1) Remove application records first to avoid FK conflicts.
DELETE FROM public.club_applications;

-- 2) Remove student data.
DELETE FROM public.club_students;

-- 3) Remove coach records.
DELETE FROM public.club_coaches;

-- 4) Remove branch data.
DELETE FROM public.club_branches;

-- 5) Remove clubs last.
DELETE FROM public.clubs;

-- 6) Keep the super-admin profile intact; do not delete or modify it.
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
