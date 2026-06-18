-- Migration: Fix RLS Vulnerabilities across the database
-- 1. payment_history was missing RLS entirely
-- 2. inventory tables had permissive policies granting access to PUBLIC
-- 3. email_logs allowed anonymous inserts
-- 4. customer_feedback allowed PUBLIC access instead of just service_role

-- ─── 1. Fix payment_history ────────────────────────────────────────────────
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
-- For now, default to DENY ALL from the client for payment_history.
-- Payments should be managed via Edge Functions using service_role,
-- or explicitly enabled for 'accounts'/'admin' roles later if needed.

-- ─── 2. Fix Inventory Tables ───────────────────────────────────────────────
-- Drop the permissive policies that defaulted to PUBLIC (anon + authenticated)
DROP POLICY IF EXISTS "Enable read access for all" ON public.inventory;
DROP POLICY IF EXISTS "Enable insert for all" ON public.inventory;
DROP POLICY IF EXISTS "Enable update for all" ON public.inventory;
DROP POLICY IF EXISTS "Enable delete for all" ON public.inventory;

DROP POLICY IF EXISTS "Enable read access for all transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Enable insert for all transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Enable update for all transactions" ON public.inventory_transactions;

DROP POLICY IF EXISTS "Enable read access for all reservations" ON public.inventory_reservations;
DROP POLICY IF EXISTS "Enable insert for all reservations" ON public.inventory_reservations;
DROP POLICY IF EXISTS "Enable update for all reservations" ON public.inventory_reservations;
DROP POLICY IF EXISTS "Enable delete for all reservations" ON public.inventory_reservations;

-- Provide secure policies (only authenticated users can read/write)
-- Inventory
CREATE POLICY "Auth users can select inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert inventory" ON public.inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update inventory" ON public.inventory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete inventory" ON public.inventory FOR DELETE TO authenticated USING (true);

-- Inventory Transactions
CREATE POLICY "Auth users can select inventory_transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert inventory_transactions" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update inventory_transactions" ON public.inventory_transactions FOR UPDATE TO authenticated USING (true);

-- Inventory Reservations
CREATE POLICY "Auth users can select inventory_reservations" ON public.inventory_reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert inventory_reservations" ON public.inventory_reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update inventory_reservations" ON public.inventory_reservations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete inventory_reservations" ON public.inventory_reservations FOR DELETE TO authenticated USING (true);

-- Wattage Mappings
DROP POLICY IF EXISTS "Authenticated can read wattage mappings" ON public.wattage_mappings;
CREATE POLICY "Auth users can select wattage_mappings" ON public.wattage_mappings FOR SELECT TO authenticated USING (true);

-- ─── 3. Fix email_logs ─────────────────────────────────────────────────────
-- Drop the permissive insert policy
DROP POLICY IF EXISTS "Enable insert for all" ON public.email_logs;

-- Recreate it for authenticated users only
CREATE POLICY "Enable insert for authenticated"
  ON public.email_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- ─── 4. Fix customer_feedback ──────────────────────────────────────────────
-- The previous policy intended for service_role actually applied to PUBLIC
DROP POLICY IF EXISTS "Service role has full access to customer_feedback" ON public.customer_feedback;

-- We don't need to explicitly grant to service_role, because service_role bypasses RLS by default.
-- So we can just leave it with no policies, which means DENY ALL for anon/authenticated,
-- ensuring only the backend (Edge Function) can insert or read feedback.
