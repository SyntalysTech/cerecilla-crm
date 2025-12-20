-- Migration: Add custom commissions per operario and referral system
-- Created: 2024-12-20

-- Comisiones personalizadas por operario (por servicio)
CREATE TABLE IF NOT EXISTS public.operario_comisiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operario_id UUID NOT NULL REFERENCES public.operarios(id) ON DELETE CASCADE,
  servicio TEXT NOT NULL CHECK (servicio IN ('Luz', 'Gas', 'Telefonía', 'Seguros', 'Alarmas')),
  comision DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(operario_id, servicio)
);

-- Configuración global de comisiones por defecto
CREATE TABLE IF NOT EXISTS public.configuracion_comisiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio TEXT NOT NULL UNIQUE CHECK (servicio IN ('Luz', 'Gas', 'Telefonía', 'Seguros', 'Alarmas')),
  comision_defecto DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar valores por defecto
INSERT INTO public.configuracion_comisiones (servicio, comision_defecto)
VALUES
  ('Luz', 25.00),
  ('Gas', 25.00),
  ('Telefonía', 25.00),
  ('Seguros', 25.00),
  ('Alarmas', 25.00)
ON CONFLICT (servicio) DO NOTHING;

-- Sistema de referidos
CREATE TABLE IF NOT EXISTS public.referidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT,
  referido_por_operario_id UUID REFERENCES public.operarios(id) ON DELETE SET NULL,
  referido_por_nombre TEXT, -- Backup del nombre del operario que refirió
  estado TEXT CHECK (estado IN ('pendiente', 'contactado', 'convertido', 'rechazado')) DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clientes cargados por referidos (para contar y calcular comisión)
CREATE TABLE IF NOT EXISTS public.referido_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referido_id UUID NOT NULL REFERENCES public.referidos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  comision_pagada DECIMAL(10,2) DEFAULT 0,
  fecha_carga TIMESTAMPTZ DEFAULT now()
);

-- Configuración del sistema de referidos
CREATE TABLE IF NOT EXISTS public.configuracion_referidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comision_por_cliente DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  clientes_minimos_para_pago INTEGER NOT NULL DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar configuración por defecto
INSERT INTO public.configuracion_referidos (comision_por_cliente, clientes_minimos_para_pago)
VALUES (50.00, 1)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.operario_comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referido_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_referidos ENABLE ROW LEVEL SECURITY;

-- Policies para operario_comisiones
DROP POLICY IF EXISTS "operario_comisiones_select" ON public.operario_comisiones;
CREATE POLICY "operario_comisiones_select" ON public.operario_comisiones
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "operario_comisiones_all" ON public.operario_comisiones;
CREATE POLICY "operario_comisiones_all" ON public.operario_comisiones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Policies para configuracion_comisiones
DROP POLICY IF EXISTS "configuracion_comisiones_select" ON public.configuracion_comisiones;
CREATE POLICY "configuracion_comisiones_select" ON public.configuracion_comisiones
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "configuracion_comisiones_all" ON public.configuracion_comisiones;
CREATE POLICY "configuracion_comisiones_all" ON public.configuracion_comisiones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Policies para referidos
DROP POLICY IF EXISTS "referidos_select" ON public.referidos;
CREATE POLICY "referidos_select" ON public.referidos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "referidos_all" ON public.referidos;
CREATE POLICY "referidos_all" ON public.referidos
  FOR ALL TO authenticated USING (true);

-- Policies para referido_clientes
DROP POLICY IF EXISTS "referido_clientes_select" ON public.referido_clientes;
CREATE POLICY "referido_clientes_select" ON public.referido_clientes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "referido_clientes_all" ON public.referido_clientes;
CREATE POLICY "referido_clientes_all" ON public.referido_clientes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Policies para configuracion_referidos
DROP POLICY IF EXISTS "configuracion_referidos_select" ON public.configuracion_referidos;
CREATE POLICY "configuracion_referidos_select" ON public.configuracion_referidos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "configuracion_referidos_all" ON public.configuracion_referidos;
CREATE POLICY "configuracion_referidos_all" ON public.configuracion_referidos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_operario_comisiones_operario ON public.operario_comisiones(operario_id);
CREATE INDEX IF NOT EXISTS idx_referidos_operario ON public.referidos(referido_por_operario_id);
CREATE INDEX IF NOT EXISTS idx_referidos_estado ON public.referidos(estado);
CREATE INDEX IF NOT EXISTS idx_referido_clientes_referido ON public.referido_clientes(referido_id);
