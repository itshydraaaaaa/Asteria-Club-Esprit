-- ==============================================================================
-- Asteria Club Esprit — RLS Helpers, Real Notifications, and Audit Log Extension
-- Migration: 20261011_rls_helpers_notifications_audit.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RLS SECURITY DEFINER HELPERS
-- ------------------------------------------------------------------------------

-- Ensure current_user_role() is SECURITY DEFINER with fixed search_path to prevent recursion and search_path injection
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Replace public.is_board() so it returns true for PRESIDENT, VICE_PRESIDENT, and BOARD
CREATE OR REPLACE FUNCTION public.is_board()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('PRESIDENT', 'VICE_PRESIDENT', 'BOARD')
    );
$$;

-- Add public.is_hod_of(dept uuid) returning true when user is HOD of that department
CREATE OR REPLACE FUNCTION public.is_hod_of(dept UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.departments d
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE d.id = dept
          AND d.hod_user_id = auth.uid()
          AND p.role = 'HOD'
    );
$$;

-- ------------------------------------------------------------------------------
-- 2. REAL NOTIFICATIONS TABLE & RLS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite index optimized for user feed query: (user_id, is_read, created_at desc)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created
    ON public.notifications (user_id, is_read, created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can only read their own notifications
DROP POLICY IF EXISTS "Users can select own notifications" ON public.notifications;
CREATE POLICY "Users can select own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can only update their own notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Note: No INSERT policy granted to authenticated users.
-- Notifications are inserted exclusively via server-side service-role client.

-- ------------------------------------------------------------------------------
-- 3. AUDIT LOG EXTENSION
-- ------------------------------------------------------------------------------

ALTER TABLE public.audit_logs 
    ADD COLUMN IF NOT EXISTS entity_type TEXT,
    ADD COLUMN IF NOT EXISTS entity_id UUID;

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON public.audit_logs (entity_type, entity_id);
