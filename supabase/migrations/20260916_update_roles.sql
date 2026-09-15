-- ==============================================================================
-- Asteria Club Esprit — Role Governance & Hierarchy Migration
-- Migration: 20260916_update_roles.sql
-- 
-- Roles supported:
-- 1. PRESIDENT: Executive President (Supreme executive oversight)
-- 2. VICE_PRESIDENT: Executive Vice President (Operations & Governance)
-- 3. BOARD: Executive Board (Tracks: PR, HR, CM, CRD, General)
-- 4. HOD: Head of Department (Web Dev, AI/ML, Design, Video, Photography...)
-- 5. MEMBER: Active full member of Asteria Club
-- 6. WAITING_FOR_INTERVIEW: Portal account provisioned, awaiting interview
-- 7. DECLINED: Application or interview not retained for this cycle
-- 8. APPLICANT: Candidate who submitted the recruitment form
-- ==============================================================================

-- 1. Drop the existing constraint on profiles.role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Re-create the constraint with all 8 hierarchical roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'PRESIDENT',
    'VICE_PRESIDENT',
    'BOARD',
    'HOD',
    'MEMBER',
    'WAITING_FOR_INTERVIEW',
    'DECLINED',
    'APPLICANT'
  ));

-- 3. Add commentary for PostgreSQL schema documentation
COMMENT ON COLUMN public.profiles.role IS 
  'Membership hierarchy: PRESIDENT, VICE_PRESIDENT, BOARD (PR/HR/CM/CRD), HOD, MEMBER, WAITING_FOR_INTERVIEW, DECLINED, APPLICANT';
