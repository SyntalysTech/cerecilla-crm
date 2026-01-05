-- Migration: Fix cliente_observaciones RLS policies
-- Description: Update policies to correctly check admin roles

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view non-admin observations" ON public.cliente_observaciones;
DROP POLICY IF EXISTS "Authenticated users can insert observations" ON public.cliente_observaciones;
DROP POLICY IF EXISTS "Users can update their own observations" ON public.cliente_observaciones;
DROP POLICY IF EXISTS "Admins can delete observations" ON public.cliente_observaciones;

-- Create new policies with correct role checks

-- View policy: All users can see non-admin observations
-- Admins can see all observations
CREATE POLICY "View observations"
  ON public.cliente_observaciones FOR SELECT
  TO authenticated
  USING (
    es_admin = false
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Insert policy: All authenticated users can insert
CREATE POLICY "Insert observations"
  ON public.cliente_observaciones FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update policy: Own observations or admin
CREATE POLICY "Update observations"
  ON public.cliente_observaciones FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Delete policy: Admins only
CREATE POLICY "Delete observations"
  ON public.cliente_observaciones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );
