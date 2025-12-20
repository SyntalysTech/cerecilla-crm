-- Migration: Add detailed address fields to operarios and clientes
-- Created: 2024-12-20

-- Add address fields to operarios
ALTER TABLE public.operarios
ADD COLUMN IF NOT EXISTS tipo_via TEXT,
ADD COLUMN IF NOT EXISTS nombre_via TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS escalera TEXT,
ADD COLUMN IF NOT EXISTS piso TEXT,
ADD COLUMN IF NOT EXISTS puerta TEXT,
ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
ADD COLUMN IF NOT EXISTS poblacion TEXT,
ADD COLUMN IF NOT EXISTS provincia TEXT;

-- Add address fields to clientes
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS tipo_via TEXT,
ADD COLUMN IF NOT EXISTS nombre_via TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS escalera TEXT,
ADD COLUMN IF NOT EXISTS piso TEXT,
ADD COLUMN IF NOT EXISTS puerta TEXT,
ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
ADD COLUMN IF NOT EXISTS poblacion TEXT,
ADD COLUMN IF NOT EXISTS provincia TEXT;

-- Update estado values: rename PENDIENTE to SIN ESTADO, add FINALIZADO
-- First update existing PENDIENTE records
UPDATE public.clientes SET estado = 'SIN ESTADO' WHERE estado = 'PENDIENTE';

-- Note: The application code will handle the new estado values
