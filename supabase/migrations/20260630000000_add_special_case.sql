-- Add is_special_case boolean to cases table to support admin bypass to subsidy
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS is_special_case BOOLEAN DEFAULT false;
