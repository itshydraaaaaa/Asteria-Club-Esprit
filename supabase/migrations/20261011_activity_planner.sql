-- ==============================================================================
-- Asteria Club Esprit — Activity Planner Schema & Migration
-- Migration: 20261011_activity_planner.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PLANNER SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planner_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.planner_settings ENABLE ROW LEVEL SECURITY;

-- Board can read and write planner_settings
DROP POLICY IF EXISTS "Board can manage planner_settings" ON public.planner_settings;
CREATE POLICY "Board can manage planner_settings"
    ON public.planner_settings FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

-- HoD can read planner_settings (e.g. to check planner_hod_write)
DROP POLICY IF EXISTS "HoD can read planner_settings" ON public.planner_settings;
CREATE POLICY "HoD can read planner_settings"
    ON public.planner_settings FOR SELECT
    TO authenticated
    USING (public.current_user_role() = 'HOD');

-- Helper function: check if HoD write is permitted in settings
CREATE OR REPLACE FUNCTION public.planner_can_hod_write()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT COALESCE((value->>'enabled')::boolean, (value)::text = 'true', false)
    FROM public.planner_settings
    WHERE key = 'planner_hod_write';
$$;

-- ------------------------------------------------------------------------------
-- 2. ACTIVITY TYPES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#11606E',
    icon TEXT NOT NULL DEFAULT 'Calendar',
    description TEXT,
    default_lead_days INT NOT NULL DEFAULT 21,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;

-- Board can manage activity types
DROP POLICY IF EXISTS "Board can manage activity_types" ON public.activity_types;
CREATE POLICY "Board can manage activity_types"
    ON public.activity_types FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

-- HoD can view activity types
DROP POLICY IF EXISTS "HoD can view activity_types" ON public.activity_types;
CREATE POLICY "HoD can view activity_types"
    ON public.activity_types FOR SELECT
    TO authenticated
    USING (public.current_user_role() = 'HOD');

-- ------------------------------------------------------------------------------
-- 3. ACTIVITY TEMPLATES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type_id UUID NOT NULL REFERENCES public.activity_types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb, -- title, offset_days, default_role, section
    requirements JSONB NOT NULL DEFAULT '[]'::jsonb, -- category, title, quantity
    required_offices TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_templates_type ON public.activity_templates (activity_type_id);
ALTER TABLE public.activity_templates ENABLE ROW LEVEL SECURITY;

-- Board can manage templates
DROP POLICY IF EXISTS "Board can manage activity_templates" ON public.activity_templates;
CREATE POLICY "Board can manage activity_templates"
    ON public.activity_templates FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

-- HoD can view active templates
DROP POLICY IF EXISTS "HoD can view activity_templates" ON public.activity_templates;
CREATE POLICY "HoD can view activity_templates"
    ON public.activity_templates FOR SELECT
    TO authenticated
    USING (public.current_user_role() = 'HOD');

-- ------------------------------------------------------------------------------
-- 4. PLANNER RESOURCES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planner_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL CHECK (kind IN ('ROOM', 'EQUIPMENT')),
    capacity INT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.planner_resources ENABLE ROW LEVEL SECURITY;

-- Board can manage resources
DROP POLICY IF EXISTS "Board can manage planner_resources" ON public.planner_resources;
CREATE POLICY "Board can manage planner_resources"
    ON public.planner_resources FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

-- HoD can view resources
DROP POLICY IF EXISTS "HoD can view planner_resources" ON public.planner_resources;
CREATE POLICY "HoD can view planner_resources"
    ON public.planner_resources FOR SELECT
    TO authenticated
    USING (public.current_user_role() = 'HOD');

-- ------------------------------------------------------------------------------
-- 5. ACTIVITIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type_id UUID NOT NULL REFERENCES public.activity_types(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'IDEA' CHECK (
        status IN (
            'IDEA', 'SUBMITTED', 'BRIEF_APPROVED', 'ADMIN_REQUESTS',
            'LOGISTICS_CONFIRMED', 'APPROVED', 'LOGISTICS_READY',
            'PROMOTION', 'LIVE', 'CLOSED', 'ON_HOLD', 'CANCELLED'
        )
    ),
    idea TEXT,
    objectives JSONB DEFAULT '[]'::jsonb,
    audience TEXT,
    expected_attendance INT DEFAULT 0,
    format TEXT NOT NULL DEFAULT 'IN_PERSON' CHECK (format IN ('IN_PERSON', 'ONLINE', 'HYBRID')),
    location TEXT,
    venue_resource_id UUID REFERENCES public.planner_resources(id) ON DELETE SET NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    budget_estimate NUMERIC(10, 2) DEFAULT 0,
    facilitators TEXT,
    closure_skip_reason TEXT,
    template_id UUID REFERENCES public.activity_templates(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_type_id ON public.activities (type_id);
CREATE INDEX IF NOT EXISTS idx_activities_department_id ON public.activities (department_id);
CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON public.activities (owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities (status);
CREATE INDEX IF NOT EXISTS idx_activities_starts_at ON public.activities (starts_at);
CREATE INDEX IF NOT EXISTS idx_activities_event_id ON public.activities (event_id);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6. ACTIVITY MEMBERS TABLE & HELPER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_members (
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'CO_OWNER', 'CONTRIBUTOR')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (activity_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_members_profile ON public.activity_members (profile_id);
ALTER TABLE public.activity_members ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is an assigned member of the given activity
CREATE OR REPLACE FUNCTION public.is_activity_member(act_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.activity_members
        WHERE activity_id = act_id
          AND profile_id = auth.uid()
    );
$$;

-- Helper function: check if current user can read the given activity
CREATE OR REPLACE FUNCTION public.can_view_activity(act_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT public.is_board()
        OR public.is_activity_member(act_id)
        OR EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = act_id
              AND (
                  a.owner_id = auth.uid()
                  OR (a.department_id IS NOT NULL AND public.is_hod_of(a.department_id))
              )
        );
$$;

-- Board can do everything on activities
DROP POLICY IF EXISTS "Board can manage activities" ON public.activities;
CREATE POLICY "Board can manage activities"
    ON public.activities FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

-- HoD and Activity Members can select permitted activities
DROP POLICY IF EXISTS "HoD can select own department activities" ON public.activities;
CREATE POLICY "HoD can select own department activities"
    ON public.activities FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid() OR
        public.is_activity_member(id) OR
        (department_id IS NOT NULL AND public.is_hod_of(department_id))
    );

-- HoD can insert activities into own department if planner_hod_write is enabled
DROP POLICY IF EXISTS "HoD can insert own department activities when allowed" ON public.activities;
CREATE POLICY "HoD can insert own department activities when allowed"
    ON public.activities FOR INSERT
    TO authenticated
    WITH CHECK (
        department_id IS NOT NULL AND
        public.is_hod_of(department_id) AND
        public.planner_can_hod_write()
    );

-- HoD can update activities of own department if planner_hod_write is enabled
DROP POLICY IF EXISTS "HoD can update own department activities when allowed" ON public.activities;
CREATE POLICY "HoD can update own department activities when allowed"
    ON public.activities FOR UPDATE
    TO authenticated
    USING (
        department_id IS NOT NULL AND
        public.is_hod_of(department_id) AND
        public.planner_can_hod_write()
    )
    WITH CHECK (
        department_id IS NOT NULL AND
        public.is_hod_of(department_id) AND
        public.planner_can_hod_write()
    );

DROP POLICY IF EXISTS "Board can manage activity_members" ON public.activity_members;
CREATE POLICY "Board can manage activity_members"
    ON public.activity_members FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

DROP POLICY IF EXISTS "HoD can view activity_members" ON public.activity_members;
CREATE POLICY "HoD can view activity_members"
    ON public.activity_members FOR SELECT
    TO authenticated
    USING (
        public.can_view_activity(activity_members.activity_id)
    );

DROP POLICY IF EXISTS "HoD can manage activity_members when allowed" ON public.activity_members;
CREATE POLICY "HoD can manage activity_members when allowed"
    ON public.activity_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_members.activity_id
              AND a.department_id IS NOT NULL
              AND public.is_hod_of(a.department_id)
              AND public.planner_can_hod_write()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_members.activity_id
              AND a.department_id IS NOT NULL
              AND public.is_hod_of(a.department_id)
              AND public.planner_can_hod_write()
        )
    );

-- ------------------------------------------------------------------------------
-- 7. EXTEND EXISTING TASKS TABLE
-- ------------------------------------------------------------------------------
-- Decision: tasks.department_id was NOT NULL. To support club-wide activities that have no department,
-- we safely ALTER TABLE tasks ALTER COLUMN department_id DROP NOT NULL.
ALTER TABLE public.tasks
    ALTER COLUMN department_id DROP NOT NULL;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS offset_days INT,
    ADD COLUMN IF NOT EXISTS depends_on UUID[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS section TEXT,
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_compressed BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_tasks_activity_id ON public.tasks (activity_id);

-- Update Tasks RLS to cover activity-based tasks for HoD
DROP POLICY IF EXISTS "Board and HoD can manage tasks" ON public.tasks;
CREATE POLICY "Board and HoD can manage tasks"
    ON public.tasks FOR ALL
    TO authenticated
    USING (
        public.is_board() OR
        (tasks.department_id IS NOT NULL AND public.is_hod_of(tasks.department_id)) OR
        (
            tasks.activity_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM public.activities a
                WHERE a.id = tasks.activity_id
                  AND a.department_id IS NOT NULL
                  AND public.is_hod_of(a.department_id)
            )
        )
    );

-- ------------------------------------------------------------------------------
-- 8. ADMIN CONTACTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office TEXT NOT NULL CHECK (
        office IN (
            'STUDENT_LIFE', 'SCOLARITE', 'TECHNICAL_EQUIPMENT',
            'LOGISTICS', 'PROMOTION', 'PURCHASES'
        )
    ),
    name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_contacts_office ON public.admin_contacts (office);
ALTER TABLE public.admin_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Board can manage admin_contacts" ON public.admin_contacts;
CREATE POLICY "Board can manage admin_contacts"
    ON public.admin_contacts FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

DROP POLICY IF EXISTS "HoD can view admin_contacts" ON public.admin_contacts;
CREATE POLICY "HoD can view admin_contacts"
    ON public.admin_contacts FOR SELECT
    TO authenticated
    USING (public.current_user_role() = 'HOD');

-- ------------------------------------------------------------------------------
-- 9. EMAIL TEMPLATES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office TEXT NOT NULL CHECK (
        office IN (
            'STUDENT_LIFE', 'SCOLARITE', 'TECHNICAL_EQUIPMENT',
            'LOGISTICS', 'PROMOTION', 'PURCHASES'
        )
    ),
    language TEXT NOT NULL CHECK (language IN ('FR', 'EN')),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT uq_email_templates_office_lang UNIQUE (office, language)
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Board can manage email_templates" ON public.email_templates;
CREATE POLICY "Board can manage email_templates"
    ON public.email_templates FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

DROP POLICY IF EXISTS "HoD can view email_templates" ON public.email_templates;
CREATE POLICY "HoD can view email_templates"
    ON public.email_templates FOR SELECT
    TO authenticated
    USING (public.current_user_role() = 'HOD');

-- ------------------------------------------------------------------------------
-- 10. ACTIVITY EMAILS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.admin_contacts(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
    office TEXT NOT NULL CHECK (
        office IN (
            'STUDENT_LIFE', 'SCOLARITE', 'TECHNICAL_EQUIPMENT',
            'LOGISTICS', 'PROMOTION', 'PURCHASES'
        )
    ),
    recipient_email TEXT,
    cc_emails TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'READY', 'SENT', 'REPLIED', 'APPROVED', 'REJECTED')
    ),
    due_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    reply_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_emails_activity_id ON public.activity_emails (activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_emails_status ON public.activity_emails (status);
CREATE INDEX IF NOT EXISTS idx_activity_emails_due_at ON public.activity_emails (due_at);

ALTER TABLE public.activity_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Board can manage activity_emails" ON public.activity_emails;
CREATE POLICY "Board can manage activity_emails"
    ON public.activity_emails FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

DROP POLICY IF EXISTS "HoD can view activity_emails" ON public.activity_emails;
CREATE POLICY "HoD can view activity_emails"
    ON public.activity_emails FOR SELECT
    TO authenticated
    USING (
        public.can_view_activity(activity_emails.activity_id)
    );

DROP POLICY IF EXISTS "HoD can edit activity_emails when allowed" ON public.activity_emails;
CREATE POLICY "HoD can edit activity_emails when allowed"
    ON public.activity_emails FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_emails.activity_id
              AND a.department_id IS NOT NULL
              AND public.is_hod_of(a.department_id)
              AND public.planner_can_hod_write()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_emails.activity_id
              AND a.department_id IS NOT NULL
              AND public.is_hod_of(a.department_id)
              AND public.planner_can_hod_write()
        )
    );

-- ------------------------------------------------------------------------------
-- 11. ACTIVITY REQUIREMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (
        category IN (
            'SPACE', 'EQUIPMENT', 'MATERIALS', 'PEOPLE',
            'PURCHASE', 'PERMISSION', 'PROMOTION'
        )
    ),
    title TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    needed_by TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'NEEDED' CHECK (
        status IN ('NEEDED', 'REQUESTED', 'CONFIRMED', 'READY', 'RETURNED')
    ),
    est_cost NUMERIC(10, 2) DEFAULT 0,
    actual_cost NUMERIC(10, 2) DEFAULT 0,
    linked_email_id UUID REFERENCES public.activity_emails(id) ON DELETE SET NULL,
    resource_id UUID REFERENCES public.planner_resources(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_requirements_activity_id ON public.activity_requirements (activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_requirements_category ON public.activity_requirements (category);
CREATE INDEX IF NOT EXISTS idx_activity_requirements_status ON public.activity_requirements (status);
CREATE INDEX IF NOT EXISTS idx_activity_requirements_resource_id ON public.activity_requirements (resource_id);

ALTER TABLE public.activity_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Board can manage activity_requirements" ON public.activity_requirements;
CREATE POLICY "Board can manage activity_requirements"
    ON public.activity_requirements FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

DROP POLICY IF EXISTS "HoD can view activity_requirements" ON public.activity_requirements;
CREATE POLICY "HoD can view activity_requirements"
    ON public.activity_requirements FOR SELECT
    TO authenticated
    USING (
        public.can_view_activity(activity_requirements.activity_id)
    );

DROP POLICY IF EXISTS "HoD can manage activity_requirements when allowed" ON public.activity_requirements;
CREATE POLICY "HoD can manage activity_requirements when allowed"
    ON public.activity_requirements FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_requirements.activity_id
              AND a.department_id IS NOT NULL
              AND public.is_hod_of(a.department_id)
              AND public.planner_can_hod_write()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_requirements.activity_id
              AND a.department_id IS NOT NULL
              AND public.is_hod_of(a.department_id)
              AND public.planner_can_hod_write()
        )
    );

-- ------------------------------------------------------------------------------
-- 12. ACTIVITY AGENDA ITEMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_agenda_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    duration_min INT NOT NULL DEFAULT 30,
    title TEXT NOT NULL,
    speaker TEXT,
    location TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    lead_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_agenda_activity_id ON public.activity_agenda_items (activity_id);
ALTER TABLE public.activity_agenda_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Board can manage activity_agenda_items" ON public.activity_agenda_items;
CREATE POLICY "Board can manage activity_agenda_items"
    ON public.activity_agenda_items FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

DROP POLICY IF EXISTS "HoD can view activity_agenda_items" ON public.activity_agenda_items;
CREATE POLICY "HoD can view activity_agenda_items"
    ON public.activity_agenda_items FOR SELECT
    TO authenticated
    USING (
        public.can_view_activity(activity_agenda_items.activity_id)
    );

DROP POLICY IF EXISTS "HoD can manage activity_agenda_items when allowed" ON public.activity_agenda_items;
CREATE POLICY "HoD can manage activity_agenda_items when allowed"
    ON public.activity_agenda_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_agenda_items.activity_id
              AND a.department_id IS NOT NULL
              AND public.is_hod_of(a.department_id)
              AND public.planner_can_hod_write()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_agenda_items.activity_id
              AND a.department_id IS NOT NULL
              AND public.is_hod_of(a.department_id)
              AND public.planner_can_hod_write()
        )
    );

-- ------------------------------------------------------------------------------
-- 13. ACTIVITY REPORTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_reports (
    activity_id UUID PRIMARY KEY REFERENCES public.activities(id) ON DELETE CASCADE,
    summary TEXT,
    attendance_count INT DEFAULT 0,
    objectives_result JSONB DEFAULT '{}'::jsonb,
    budget_actual NUMERIC(10, 2) DEFAULT 0,
    went_well TEXT,
    problems_encountered TEXT,
    to_improve TEXT,
    lessons_learned TEXT,
    media_links TEXT[] DEFAULT '{}',
    submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.activity_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Board can manage activity_reports" ON public.activity_reports;
CREATE POLICY "Board can manage activity_reports"
    ON public.activity_reports FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

DROP POLICY IF EXISTS "HoD can view activity_reports" ON public.activity_reports;
CREATE POLICY "HoD can view activity_reports"
    ON public.activity_reports FOR SELECT
    TO authenticated
    USING (
        public.can_view_activity(activity_reports.activity_id)
    );

DROP POLICY IF EXISTS "HoD can submit activity_reports when allowed" ON public.activity_reports;
CREATE POLICY "HoD can submit activity_reports when allowed"
    ON public.activity_reports FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_reports.activity_id
              AND a.department_id IS NOT NULL
              AND public.is_hod_of(a.department_id)
              AND public.planner_can_hod_write()
        )
    );

DROP POLICY IF EXISTS "HoD can update activity_reports when allowed" ON public.activity_reports;
CREATE POLICY "HoD can update activity_reports when allowed"
    ON public.activity_reports FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_reports.activity_id
              AND a.department_id IS NOT NULL
              AND public.is_hod_of(a.department_id)
              AND public.planner_can_hod_write()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_reports.activity_id
              AND a.department_id IS NOT NULL
              AND public.is_hod_of(a.department_id)
              AND public.planner_can_hod_write()
        )
    );

-- ------------------------------------------------------------------------------
-- 14. ACTIVITY COMMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL DEFAULT 'ACTIVITY', -- 'ACTIVITY', 'TASK', 'REQUIREMENT', etc.
    entity_id UUID,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON public.activity_comments (activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_entity ON public.activity_comments (entity_type, entity_id);

ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Board can manage activity_comments" ON public.activity_comments;
CREATE POLICY "Board can manage activity_comments"
    ON public.activity_comments FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

DROP POLICY IF EXISTS "HoD can view and add activity_comments" ON public.activity_comments;
CREATE POLICY "HoD can view and add activity_comments"
    ON public.activity_comments FOR ALL
    TO authenticated
    USING (
        public.can_view_activity(activity_comments.activity_id)
    )
    WITH CHECK (
        author_id = auth.uid() AND
        public.can_view_activity(activity_comments.activity_id)
    );

-- ------------------------------------------------------------------------------
-- 15. ACTIVITY FILES TABLE & PRIVATE STORAGE BUCKET
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL DEFAULT 'ACTIVITY',
    entity_id UUID,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type TEXT,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_files_activity_id ON public.activity_files (activity_id);
ALTER TABLE public.activity_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Board can manage activity_files" ON public.activity_files;
CREATE POLICY "Board can manage activity_files"
    ON public.activity_files FOR ALL
    TO authenticated
    USING (public.is_board())
    WITH CHECK (public.is_board());

DROP POLICY IF EXISTS "HoD can view activity_files" ON public.activity_files;
CREATE POLICY "HoD can view activity_files"
    ON public.activity_files FOR SELECT
    TO authenticated
    USING (
        public.can_view_activity(activity_files.activity_id)
    );

DROP POLICY IF EXISTS "HoD can upload activity_files when allowed" ON public.activity_files;
CREATE POLICY "HoD can upload activity_files when allowed"
    ON public.activity_files FOR INSERT
    TO authenticated
    WITH CHECK (
        uploaded_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.activities a
            WHERE a.id = activity_files.activity_id
              AND a.department_id IS NOT NULL
              AND public.is_hod_of(a.department_id)
              AND public.planner_can_hod_write()
        )
    );

-- Storage Bucket: activity-files (Private, 25MB limit, allowed document/media types)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'activity-files',
    'activity-files',
    false,
    26214400,
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authorized users can read activity-files" ON storage.objects;
CREATE POLICY "Authorized users can read activity-files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'activity-files' AND (
            public.is_board() OR
            public.current_user_role() = 'HOD'
        )
    );

DROP POLICY IF EXISTS "Authorized users can upload activity-files" ON storage.objects;
CREATE POLICY "Authorized users can upload activity-files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'activity-files' AND (
            public.is_board() OR
            (public.current_user_role() = 'HOD' AND public.planner_can_hod_write())
        )
    );

DROP POLICY IF EXISTS "Board can delete activity-files" ON storage.objects;
CREATE POLICY "Board can delete activity-files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'activity-files' AND public.is_board()
    );

