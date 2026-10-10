-- ==============================================================================
-- Asteria Club Esprit — Dual Email Support (Gmail & ESPRIT Student Email)
-- Migration: 20261011_add_student_email_to_applications.sql
-- ==============================================================================

-- 1. Add student_email column to applications table
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS student_email TEXT;

-- 2. Add student_email column to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS student_email TEXT;

-- 3. Comments
COMMENT ON COLUMN public.applications.email IS
  'Primary applicant email (Gmail account used for authentication, portal credentials and auto-mails)';

COMMENT ON COLUMN public.applications.student_email IS
  'Official ESPRIT student email (prenom.nom@esprit.tn)';

COMMENT ON COLUMN public.profiles.student_email IS
  'Official ESPRIT institutional student email';
