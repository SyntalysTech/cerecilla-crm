-- Migration: Add multiple operators support and track who created the client
-- Description: Create cliente_operadores table for many-to-many relationship and add created_by to clientes

-- Add created_by field to clientes table
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by_email TEXT;

-- Create table for multiple operators per client
CREATE TABLE IF NOT EXISTS public.cliente_operadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  operario_id UUID NOT NULL REFERENCES public.operarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cliente_id, operario_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cliente_operadores_cliente_id ON public.cliente_operadores(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_operadores_operario_id ON public.cliente_operadores(operario_id);

-- Enable RLS
ALTER TABLE public.cliente_operadores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view cliente_operadores"
  ON public.cliente_operadores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cliente_operadores"
  ON public.cliente_operadores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cliente_operadores"
  ON public.cliente_operadores FOR DELETE
  TO authenticated
  USING (true);
