-- Migration: Create audit_logs table and attach triggers to sensitive tables

-- 1. Create the audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID, -- Can be null if action performed by service_role/system
    changed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only superadmin/admin can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) IN ('admin', 'superadmin')
    );

-- Prevent direct inserts/updates/deletes from the API
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated, anon;
-- (Service role and postgres will still have access to insert via triggers)

-- 2. Create the generic trigger function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_record_id TEXT;
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
BEGIN
    -- Extract the user ID from the Supabase auth context (will be null if service_role)
    v_user_id := auth.uid();

    IF (TG_OP = 'DELETE') THEN
        v_record_id := OLD.id::TEXT;
        v_old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_record_id := NEW.id::TEXT;
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        v_record_id := NEW.id::TEXT;
        v_new_data := to_jsonb(NEW);
    END IF;

    -- Insert the audit log record
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        changed_by
    ) VALUES (
        TG_TABLE_NAME::TEXT,
        v_record_id,
        TG_OP,
        v_old_data,
        v_new_data,
        v_user_id
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach triggers to sensitive tables

-- Drop existing triggers if re-running migration
DROP TRIGGER IF EXISTS profiles_audit_trigger ON public.profiles;
CREATE TRIGGER profiles_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS cases_audit_trigger ON public.cases;
CREATE TRIGGER cases_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS docs_audit_trigger ON public.customer_uploaded_docs;
CREATE TRIGGER docs_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.customer_uploaded_docs
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS payment_history_audit_trigger ON public.payment_history;
CREATE TRIGGER payment_history_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.payment_history
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS erp_tasks_audit_trigger ON public.erp_tasks;
CREATE TRIGGER erp_tasks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.erp_tasks
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
