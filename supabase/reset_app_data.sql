-- Complete reset for demo/test data while keeping the locked super admin profile intact.
-- Run this in Supabase SQL Editor.

BEGIN;

-- 1) Delete all non-super-admin profiles.
DELETE FROM public.profiles
WHERE role IS NOT NULL
  AND LOWER(role) IN ('super-admin', 'super_admin') = FALSE;

-- 2) Truncate sample/test data tables.
TRUNCATE TABLE public.club_messages, public.club_announcements, public.club_payments,
  public.club_students, public.club_branches, public.club_coaches,
  public.club_applications, public.clubs RESTART IDENTITY CASCADE;

-- 3) Clean duplicate coach rows before re-inserting any data.
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

-- 4) Keep the super-admin identity available by restoring a locked root record if it is missing.
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

-- Optional: if you also want a dedicated SQL function for the app to call:
-- CREATE OR REPLACE FUNCTION public.reset_app_data()
-- RETURNS TABLE(message text)
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   DELETE FROM public.profiles
--   WHERE role IS NOT NULL
--     AND LOWER(role) IN ('super-admin', 'super_admin') = FALSE;
--
--   TRUNCATE TABLE public.club_messages, public.club_announcements, public.club_payments,
--     public.club_students, public.club_branches, public.club_coaches,
--     public.club_applications, public.clubs RESTART IDENTITY CASCADE;
--
--   INSERT INTO public.profiles (id, club_id, role, full_name, username, password, email, phone, is_active, created_at)
--   VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     NULL,
--     'super-admin',
--     'Süper Admin',
--     'sagliksk@gmail.com',
--     'Efraim+08',
--     'sagliksk@gmail.com',
--     NULL,
--     true,
--     NOW()
--   )
--   ON CONFLICT (id) DO NOTHING;
--
--   RETURN QUERY SELECT 'System reset complete. Only the locked super-admin remains.'::text;
-- END;
-- $$;
