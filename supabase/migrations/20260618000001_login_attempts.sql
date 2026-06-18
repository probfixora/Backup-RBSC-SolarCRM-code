-- Migration: login_attempts table for server-side progressive rate limiting
-- Each row tracks failed login state for a given email address.

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email           text NOT NULL UNIQUE,
  failed_count    integer NOT NULL DEFAULT 0,
  lockout_until   timestamptz,
  last_attempt_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by email on every login attempt
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts (email);

-- No RLS needed — this table is ONLY accessible via the service role key
-- used inside the secure-login Edge Function. It must NOT be exposed to
-- the anonymous / authenticated Supabase client on the frontend.
ALTER TABLE public.login_attempts DISABLE ROW LEVEL SECURITY;

-- Grant NO privileges to anon or authenticated roles
REVOKE ALL ON public.login_attempts FROM anon, authenticated;
