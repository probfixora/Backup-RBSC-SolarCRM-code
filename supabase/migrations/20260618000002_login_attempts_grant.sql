-- Fix: explicitly grant all privileges on login_attempts to service_role.
-- The previous migration revoked from anon/authenticated but did not
-- explicitly grant to service_role, causing DELETE (and UPDATE) to fail silently
-- when called from the Edge Function via PostgREST.

GRANT ALL ON public.login_attempts TO service_role;
GRANT ALL ON public.login_attempts TO postgres;

-- Also grant usage on the sequence for the GENERATED ALWAYS AS IDENTITY column
GRANT USAGE, SELECT ON SEQUENCE public.login_attempts_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.login_attempts_id_seq TO postgres;
