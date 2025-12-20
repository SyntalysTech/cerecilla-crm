-- Migration: Create table for company configuration (invoicing data)
-- Created: 2024-12-20

-- Tabla para configuración de la empresa (datos de facturación)
CREATE TABLE IF NOT EXISTS public.configuracion_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Solo permitimos una fila (singleton)
  singleton_key TEXT NOT NULL UNIQUE DEFAULT 'config' CHECK (singleton_key = 'config'),

  -- Datos de la empresa
  nombre TEXT NOT NULL DEFAULT 'CERECILLA ENERGÍA S.L.',
  cif TEXT NOT NULL DEFAULT 'B12345678',
  direccion TEXT NOT NULL DEFAULT 'Calle Principal 123',
  poblacion TEXT NOT NULL DEFAULT 'Madrid',
  provincia TEXT NOT NULL DEFAULT 'Madrid',
  codigo_postal TEXT NOT NULL DEFAULT '28001',
  telefono TEXT,
  email TEXT,

  -- Datos bancarios
  iban TEXT,

  -- Metadatos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar configuración por defecto si no existe
INSERT INTO public.configuracion_empresa (
  nombre, cif, direccion, poblacion, provincia, codigo_postal
) VALUES (
  'CERECILLA ENERGÍA S.L.',
  'B12345678',
  'Calle Principal 123',
  'Madrid',
  'Madrid',
  '28001'
) ON CONFLICT (singleton_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.configuracion_empresa ENABLE ROW LEVEL SECURITY;

-- Policies: todos pueden leer, solo admins pueden modificar
DROP POLICY IF EXISTS "configuracion_empresa_select" ON public.configuracion_empresa;
CREATE POLICY "configuracion_empresa_select" ON public.configuracion_empresa
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "configuracion_empresa_update" ON public.configuracion_empresa;
CREATE POLICY "configuracion_empresa_update" ON public.configuracion_empresa
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_configuracion_empresa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_configuracion_empresa_updated_at ON public.configuracion_empresa;
CREATE TRIGGER trigger_update_configuracion_empresa_updated_at
  BEFORE UPDATE ON public.configuracion_empresa
  FOR EACH ROW
  EXECUTE FUNCTION update_configuracion_empresa_updated_at();
