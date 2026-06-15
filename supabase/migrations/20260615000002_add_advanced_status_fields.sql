-- supabase/migrations/20260615000002_add_advanced_status_fields.sql

-- Drop the existing constraint for status if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_status_check;
  END IF;
END $$;

-- Add new columns for tracking status dates and durations
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_duration INT;

-- Add the updated constraint allowing all advanced statuses
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_status_check 
  CHECK (status IN ('active', 'inactive', 'suspend', 'terminate', 'resign'));
