-- Migration: Create cliente_observaciones table for chat-style notes
-- Description: Store observations as individual messages with author, date, and time

CREATE TABLE IF NOT EXISTS public.cliente_observaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  mensaje TEXT NOT NULL,
  es_admin BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cliente_observaciones_cliente_id ON public.cliente_observaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_observaciones_created_at ON public.cliente_observaciones(created_at);

-- Enable RLS
ALTER TABLE public.cliente_observaciones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view non-admin observations"
  ON public.cliente_observaciones FOR SELECT
  TO authenticated
  USING (es_admin = false OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin', 'manager')
  ));

CREATE POLICY "Authenticated users can insert observations"
  ON public.cliente_observaciones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own observations"
  ON public.cliente_observaciones FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can delete observations"
  ON public.cliente_observaciones FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  ));
