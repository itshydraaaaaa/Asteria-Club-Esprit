-- ==============================================================================
-- Asteria Club Esprit — Event, Announcement & Secure QR Attendance System
-- Migration: 20261010_event_announcement_secure_attendance.sql
-- ==============================================================================

-- 1. EXPAND PUBLIC.EVENTS TABLE
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'WORKSHOP',
  ADD COLUMN IF NOT EXISTS audience_scope TEXT DEFAULT 'CLUB',
  ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attendance_required BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS check_in_window_start_min INT NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS check_in_window_end_min INT NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS late_threshold_min INT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS check_in_status TEXT NOT NULL DEFAULT 'SCHEDULED',
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_geofence_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS geofence_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS geofence_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS geofence_radius_m INT DEFAULT 100;

-- Safe constraints update for events
DO $do$
BEGIN
  ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
  ALTER TABLE public.events ADD CONSTRAINT events_type_check
    CHECK (type IN ('WORKSHOP', 'MEETING', 'SESSION', 'PODCAST', 'COMPETITION', 'GENERAL', 'HACKATHON'));
EXCEPTION WHEN OTHERS THEN NULL;
END $do$;

DO $do$
BEGIN
  ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_audience_scope_check;
  ALTER TABLE public.events ADD CONSTRAINT events_audience_scope_check
    CHECK (audience_scope IN ('CLUB', 'DEPARTMENT', 'BOARD'));
EXCEPTION WHEN OTHERS THEN NULL;
END $do$;

DO $do$
BEGIN
  ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_check_in_status_check;
  ALTER TABLE public.events ADD CONSTRAINT events_check_in_status_check
    CHECK (check_in_status IN ('SCHEDULED', 'OPEN', 'PAUSED', 'CLOSED'));
EXCEPTION WHEN OTHERS THEN NULL;
END $do$;

-- 2. LINK ANNOUNCEMENTS TO EVENTS & EXPAND SCOPE
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

DO $do$
BEGIN
  ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_scope_check;
  ALTER TABLE public.announcements ADD CONSTRAINT announcements_scope_check
    CHECK (scope IN ('CLUB', 'DEPARTMENT', 'BOARD'));
EXCEPTION WHEN OTHERS THEN NULL;
END $do$;

-- 3. EXPAND ATTENDANCE RECORDS (LATE STATUS, AUDIT METADATA)
DO $do$
BEGIN
  ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
  ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_status_check
    CHECK (status IN ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED'));
EXCEPTION WHEN OTHERS THEN NULL;
END $do$;

ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS marked_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manual_reason TEXT;

-- 4. QR SESSIONS TABLE (HOST & SERVER-ONLY SECRET ROTATION)
CREATE TABLE IF NOT EXISTS public.qr_sessions (
  event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  secret_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  paused BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. EXCUSE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.excuse_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_event_user_excuse UNIQUE (event_id, user_id)
);

-- 6. EVENT HOSTS TABLE
CREATE TABLE IF NOT EXISTS public.event_hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_event_host UNIQUE (event_id, user_id)
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_events_audience_scope ON public.events (audience_scope);
CREATE INDEX IF NOT EXISTS idx_events_host_id ON public.events (host_id);
CREATE INDEX IF NOT EXISTS idx_events_check_in_status ON public.events (check_in_status);
CREATE INDEX IF NOT EXISTS idx_announcements_event_id ON public.announcements (event_id);
CREATE INDEX IF NOT EXISTS idx_excuse_requests_event_id ON public.excuse_requests (event_id);
CREATE INDEX IF NOT EXISTS idx_excuse_requests_user_id ON public.excuse_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_excuse_requests_status ON public.excuse_requests (status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_event_status ON public.attendance_records (event_id, status);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excuse_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_hosts ENABLE ROW LEVEL SECURITY;

-- Helper function: check if authenticated user is board member
CREATE OR REPLACE FUNCTION public.is_board()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('PRESIDENT', 'VICE_PRESIDENT', 'BOARD')
  );
$func$;

-- Helper function: check if user is the designated host of an event
CREATE OR REPLACE FUNCTION public.is_event_host(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id AND (
      e.host_id = auth.uid() OR
      e.created_by_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.event_hosts eh
        WHERE eh.event_id = p_event_id AND eh.user_id = auth.uid()
      )
    )
  );
$func$;

-- QR Sessions: Strictly visible ONLY to event host and Board
DROP POLICY IF EXISTS "Host and Board can access QR sessions" ON public.qr_sessions;
CREATE POLICY "Host and Board can access QR sessions"
  ON public.qr_sessions FOR ALL
  TO authenticated
  USING (public.is_board() OR public.is_event_host(event_id))
  WITH CHECK (public.is_board() OR public.is_event_host(event_id));

-- Excuse Requests: Members view & submit their own; HoD sees for dept events; Board sees all
DROP POLICY IF EXISTS "Members can view own excuses" ON public.excuse_requests;
CREATE POLICY "Members can view own excuses"
  ON public.excuse_requests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_board() OR
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.departments d ON d.id = e.department_id
      WHERE e.id = excuse_requests.event_id AND d.hod_user_id = auth.uid()
    ) OR
    public.is_event_host(event_id)
  );

DROP POLICY IF EXISTS "Members can submit excuse requests" ON public.excuse_requests;
CREATE POLICY "Members can submit excuse requests"
  ON public.excuse_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Host, HoD, Board can review excuses" ON public.excuse_requests;
CREATE POLICY "Host, HoD, Board can review excuses"
  ON public.excuse_requests FOR UPDATE
  TO authenticated
  USING (
    public.is_board() OR
    public.is_event_host(event_id) OR
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.departments d ON d.id = e.department_id
      WHERE e.id = excuse_requests.event_id AND d.hod_user_id = auth.uid()
    )
  );
