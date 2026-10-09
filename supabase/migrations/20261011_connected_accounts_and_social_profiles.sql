-- ==============================================================================
-- Asteria Club Esprit — Connected Accounts & Social Profiles
-- Migration: 20261011_connected_accounts_and_social_profiles.sql
-- ==============================================================================

-- 1. MEMBER CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.member_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (
    provider IN (
      'github', 'linkedin', 'discord', 'google',
      'instagram', 'tiktok', 'x', 'facebook',
      'youtube', 'behance', 'dribbble', 'telegram',
      'website', 'other'
    )
  ),
  type TEXT NOT NULL CHECK (type IN ('oauth', 'manual')),
  provider_user_id TEXT,
  username TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  avatar_url TEXT,
  custom_label TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  visibility TEXT NOT NULL DEFAULT 'members' CHECK (visibility IN ('public', 'members', 'private')),
  display_order INT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  linked_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Unique external account: an OAuth provider ID can belong to at most ONE Asteria member
  CONSTRAINT uq_member_connections_provider_user UNIQUE (provider, provider_user_id),

  -- Safe URL check: Must be HTTP/HTTPS, no javascript:, no data:
  CONSTRAINT chk_member_connections_url CHECK (
    profile_url ~* '^https?://[^\s/$.?#].[^\s]*$'
    AND profile_url !~* '^(javascript|data|vbscript|file):'
  )
);

-- Partial index to ensure at most one OAuth connection per provider per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_member_connections_oauth_user_provider
  ON public.member_connections (user_id, provider)
  WHERE type = 'oauth';

-- 2. CONNECTION MODERATION LOG TABLE
CREATE TABLE IF NOT EXISTS public.connection_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connection_id UUID,
  provider TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'REMOVED' CHECK (action IN ('REMOVED', 'RESTRICTED')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_member_connections_user_id ON public.member_connections (user_id);
CREATE INDEX IF NOT EXISTS idx_member_connections_visibility ON public.member_connections (visibility);
CREATE INDEX IF NOT EXISTS idx_member_connections_provider ON public.member_connections (provider);
CREATE INDEX IF NOT EXISTS idx_moderation_log_member_id ON public.connection_moderation_log (member_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_admin_id ON public.connection_moderation_log (admin_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.member_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_moderation_log ENABLE ROW LEVEL SECURITY;

-- SELECT POLICY:
-- 1. Owner can view all their connections (including 'private')
-- 2. Anyone (including unauthenticated viewers) can view 'public' connections
-- 3. Authenticated members can view 'members' connections
-- Note: 'private' connections are strictly viewable ONLY by the owner (Board and HoD get NO override)
DROP POLICY IF EXISTS "member_connections_select" ON public.member_connections;
CREATE POLICY "member_connections_select"
  ON public.member_connections FOR SELECT
  USING (
    user_id = auth.uid() OR
    visibility = 'public' OR
    (visibility = 'members' AND auth.uid() IS NOT NULL)
  );

-- INSERT POLICY: Member can insert connections for themselves only
DROP POLICY IF EXISTS "member_connections_insert" ON public.member_connections;
CREATE POLICY "member_connections_insert"
  ON public.member_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE POLICY: Member can update their own connections only
DROP POLICY IF EXISTS "member_connections_update" ON public.member_connections;
CREATE POLICY "member_connections_update"
  ON public.member_connections FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE POLICY: Member can delete their own connections; Board can delete for moderation
DROP POLICY IF EXISTS "member_connections_delete" ON public.member_connections;
CREATE POLICY "member_connections_delete"
  ON public.member_connections FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_board()
  );

-- MODERATION LOG POLICIES:
DROP POLICY IF EXISTS "moderation_log_select" ON public.connection_moderation_log;
CREATE POLICY "moderation_log_select"
  ON public.connection_moderation_log FOR SELECT
  TO authenticated
  USING (
    member_id = auth.uid() OR
    admin_id = auth.uid() OR
    public.is_board()
  );

DROP POLICY IF EXISTS "moderation_log_insert" ON public.connection_moderation_log;
CREATE POLICY "moderation_log_insert"
  ON public.connection_moderation_log FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_board() AND
    admin_id = auth.uid()
  );
