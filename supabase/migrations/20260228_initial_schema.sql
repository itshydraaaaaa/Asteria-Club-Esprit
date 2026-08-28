-- =============================================================================
-- Asteria Club Esprit — Initial Supabase / PostgreSQL Schema & RLS Policies
-- Migration: 20260228_initial_schema.sql
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'Code2',
    hod_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. PROFILES TABLE (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'MEMBER' CHECK (role IN ('BOARD', 'HOD', 'MEMBER', 'APPLICANT')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    avatar_url TEXT,
    bio TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ALUMNI')),
    freelance_ready BOOLEAN DEFAULT FALSE,
    join_date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add foreign key back to departments for HoD
ALTER TABLE public.departments
    ADD CONSTRAINT fk_departments_hod
    FOREIGN KEY (hod_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. BOARD SEATS TABLE
CREATE TABLE IF NOT EXISTS public.board_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    "order" INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    recurrence_rule TEXT,
    check_in_code TEXT NOT NULL DEFAULT 'AST-2026',
    created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. RSVPS TABLE
CREATE TABLE IF NOT EXISTS public.rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'GOING' CHECK (status IN ('GOING', 'MAYBE', 'DECLINED')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_event_user_rsvp UNIQUE (event_id, user_id)
);

-- 6. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    method TEXT DEFAULT 'MANUAL' CHECK (method IN ('QR', 'CODE', 'MANUAL')),
    status TEXT DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED')),
    justification TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_event_user_attendance UNIQUE (event_id, user_id)
);

-- 7. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')),
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. TASK COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    scope TEXT DEFAULT 'CLUB' CHECK (scope IN ('CLUB', 'DEPARTMENT')),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. RECRUITMENT APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    department_preference TEXT NOT NULL,
    motivation TEXT NOT NULL,
    portfolio_link TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =============================================================================
-- TRIGGERS: Auto-create profile on auth.users sign-up
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'MEMBER'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions to extract role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_board()
RETURNS BOOLEAN AS $$
    SELECT (public.current_user_role() = 'BOARD');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles Policies
CREATE POLICY "Public and members can view profiles"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_board());

-- Departments Policies
CREATE POLICY "Everyone can view departments"
    ON public.departments FOR SELECT
    USING (true);

CREATE POLICY "Board can manage departments"
    ON public.departments FOR ALL
    USING (public.is_board());

-- Tasks Policies
CREATE POLICY "Authenticated users can view tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Board and HoD can manage tasks"
    ON public.tasks FOR ALL
    TO authenticated
    USING (
        public.is_board() OR
        EXISTS (
            SELECT 1 FROM public.departments
            WHERE id = tasks.department_id AND hod_user_id = auth.uid()
        )
    );

CREATE POLICY "Assignees can update their task status"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (assignee_id = auth.uid())
    WITH CHECK (assignee_id = auth.uid());

-- Task Comments Policies
CREATE POLICY "Authenticated users can view task comments"
    ON public.task_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create task comments"
    ON public.task_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Events Policies
CREATE POLICY "Authenticated users can view events"
    ON public.events FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Board and HoD can manage events"
    ON public.events FOR ALL
    TO authenticated
    USING (
        public.is_board() OR
        EXISTS (
            SELECT 1 FROM public.departments
            WHERE id = events.department_id AND hod_user_id = auth.uid()
        )
    );

-- RSVPs Policies
CREATE POLICY "Authenticated users can view RSVPs"
    ON public.rsvps FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage their own RSVP"
    ON public.rsvps FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Attendance Policies
CREATE POLICY "Users can view their attendance or Board/HoD can view all"
    ON public.attendance_records FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_board());

CREATE POLICY "Users can register check in or submit justification"
    ON public.attendance_records FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.is_board());

CREATE POLICY "Users can update their justification or Board can manage"
    ON public.attendance_records FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_board());

-- Announcements Policies
CREATE POLICY "Authenticated users can view announcements"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Board and HoD can manage announcements"
    ON public.announcements FOR ALL
    TO authenticated
    USING (public.is_board() OR public.current_user_role() = 'HOD');

-- Applications Policies
CREATE POLICY "Anyone can submit an application"
    ON public.applications FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Board and HoD can view and review applications"
    ON public.applications FOR SELECT
    TO authenticated
    USING (public.is_board() OR public.current_user_role() = 'HOD');

CREATE POLICY "Board and HoD can update applications"
    ON public.applications FOR UPDATE
    TO authenticated
    USING (public.is_board() OR public.current_user_role() = 'HOD');

-- Audit Logs Policies
CREATE POLICY "Board can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_board());

CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- =============================================================================
-- REALTIME SUBSCRIPTIONS
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
