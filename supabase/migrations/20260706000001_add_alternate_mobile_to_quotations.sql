-- Add alternate_mobile column to quotations table
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS alternate_mobile TEXT DEFAULT '';
