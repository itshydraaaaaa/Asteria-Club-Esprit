-- ==============================================================================
-- Asteria Club Esprit — Recruitment Lifecycle & Interview Stage Status Migration
-- Migration: 20261009_expand_applications_status.sql
-- ==============================================================================

-- 1. Update applications status constraint to include 'INTERVIEW'
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('PENDING', 'INTERVIEW', 'ACCEPTED', 'REJECTED'));

COMMENT ON COLUMN public.applications.status IS
  'Recruitment lifecycle: PENDING (Application received), INTERVIEW (Invited to interview & WAITING_FOR_INTERVIEW account created), ACCEPTED (Official member), REJECTED (Declined)';
