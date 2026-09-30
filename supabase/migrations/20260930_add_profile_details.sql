-- =============================================================================
-- Asteria Club Esprit — Extended Profile Details Migration
-- Migration: 20260930_add_profile_details.sql
-- Adds phone, portfolio_link, and banner_url columns to public.profiles
-- =============================================================================

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_link TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT;

COMMENT ON COLUMN public.profiles.phone IS 'Member direct contact phone number';
COMMENT ON COLUMN public.profiles.portfolio_link IS 'Member portfolio, GitHub, Behance or personal website URL';
COMMENT ON COLUMN public.profiles.banner_url IS 'Custom cover banner image URL for member dossier';
