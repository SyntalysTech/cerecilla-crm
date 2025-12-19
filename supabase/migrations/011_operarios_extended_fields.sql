-- Migration: Extend operarios table with additional fields
-- Description: Add admin info for empresas, password, and cuenta_bancaria checkbox

-- Add new fields for empresa admin information
ALTER TABLE public.operarios
ADD COLUMN IF NOT EXISTS nombre_admin TEXT,
ADD COLUMN IF NOT EXISTS dni_admin TEXT,
ADD COLUMN IF NOT EXISTS password_operario TEXT,
ADD COLUMN IF NOT EXISTS tiene_cuenta_bancaria BOOLEAN DEFAULT false;

-- Create index for searches
CREATE INDEX IF NOT EXISTS idx_operarios_tipo ON public.operarios(tipo);
