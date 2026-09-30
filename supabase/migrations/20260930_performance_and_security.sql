-- ==============================================================================
-- Asteria Club Esprit — Performance Indexes & RLS Security Fix
-- Migration: 20260930_performance_and_security.sql
-- ==============================================================================

-- 1. SECURITY & RLS FIX: Expand public.is_board() to recognize PRESIDENT and VICE_PRESIDENT
-- Previously, public.is_board() strictly checked for 'BOARD', which inadvertently blocked
-- Executive Presidents and Vice-Presidents from RLS-protected queries in Supabase.
CREATE OR REPLACE FUNCTION public.is_board()
RETURNS BOOLEAN AS $$
    SELECT (public.current_user_role() IN ('PRESIDENT', 'VICE_PRESIDENT', 'BOARD'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. HIGH-PERFORMANCE B-TREE INDEXES FOR LATENCY OPTIMIZATION
-- Foreign keys and high-frequency filtered / sorted query paths

-- PROFILES
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles (department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_join_date ON public.profiles (join_date DESC);

-- TASKS
CREATE INDEX IF NOT EXISTS idx_tasks_department_id ON public.tasks (department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks (due_date);

-- EVENTS
CREATE INDEX IF NOT EXISTS idx_events_department_id ON public.events (department_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events (start_time);
CREATE INDEX IF NOT EXISTS idx_events_check_in_code ON public.events (check_in_code) WHERE check_in_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_created_by_id ON public.events (created_by_id);

-- ATTENDANCE RECORDS
CREATE INDEX IF NOT EXISTS idx_attendance_records_event_id ON public.attendance_records (event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON public.attendance_records (user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON public.attendance_records (status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_checked_in_at ON public.attendance_records (checked_in_at DESC);

-- ANNOUNCEMENTS
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_scope_dept ON public.announcements (scope, department_id);

-- APPLICATIONS
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications (email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications (created_at DESC);

-- AUDIT LOGS
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);

-- TASK COMMENTS
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments (task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments (created_at ASC);
