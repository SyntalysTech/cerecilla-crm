-- Migration: Add fecha_comisionable field to clientes table
-- This field tracks when a client's estado was changed to "COMISIONABLE"

ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS fecha_comisionable TIMESTAMPTZ;

COMMENT ON COLUMN public.clientes.fecha_comisionable IS 'Date when estado was changed to COMISIONABLE';

-- Create index for filtering by fecha_comisionable
CREATE INDEX IF NOT EXISTS idx_clientes_fecha_comisionable ON public.clientes(fecha_comisionable);
