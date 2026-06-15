-- Add Bank and Professional Information fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS branch_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
ADD COLUMN IF NOT EXISTS experience_years TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS work_location TEXT,
ADD COLUMN IF NOT EXISTS professional_designation TEXT,
ADD COLUMN IF NOT EXISTS last_ctc TEXT,
ADD COLUMN IF NOT EXISTS aadhar_card TEXT,
ADD COLUMN IF NOT EXISTS pan_card TEXT;
