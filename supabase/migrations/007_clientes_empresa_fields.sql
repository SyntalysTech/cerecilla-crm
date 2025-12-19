-- Migration: Add empresa-specific fields to clientes table
-- Description: Add CIF empresa, nombre admin, and DNI admin fields for empresa clients

-- Add empresa-specific columns
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS cif_empresa TEXT,
ADD COLUMN IF NOT EXISTS nombre_admin TEXT,
ADD COLUMN IF NOT EXISTS dni_admin TEXT;

-- Update tipo_persona constraint to match form values
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_tipo_persona_check;
ALTER TABLE public.clientes ADD CONSTRAINT clientes_tipo_persona_check
  CHECK (tipo_persona IS NULL OR tipo_persona IN ('particular', 'empresa', 'Persona Fisica', 'Persona Juridica'));
