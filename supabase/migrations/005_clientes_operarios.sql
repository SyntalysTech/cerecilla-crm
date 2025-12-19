-- Migration: Create clientes and operarios tables
-- Description: Tables for clients and operators imported from old CRM

-- =============================================
-- OPERARIOS (Operators/Partners) table
-- =============================================
CREATE TABLE IF NOT EXISTS public.operarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  alias TEXT,
  telefonos TEXT,
  tiene_doc_autonomo BOOLEAN DEFAULT false,
  tiene_doc_escritura BOOLEAN DEFAULT false,
  tiene_doc_cif BOOLEAN DEFAULT false,
  tiene_doc_contrato BOOLEAN DEFAULT false,
  tipo TEXT CHECK (tipo IN ('Empresa', 'Autonomo')),
  nombre TEXT,
  documento TEXT,
  empresa TEXT,
  cif TEXT,
  cuenta_bancaria TEXT,
  direccion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for common searches
CREATE INDEX IF NOT EXISTS idx_operarios_alias ON public.operarios(alias);
CREATE INDEX IF NOT EXISTS idx_operarios_email ON public.operarios(email);

-- Enable RLS
ALTER TABLE public.operarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operarios - allow authenticated users full access
CREATE POLICY "Authenticated users can view operarios"
  ON public.operarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert operarios"
  ON public.operarios FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update operarios"
  ON public.operarios FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete operarios"
  ON public.operarios FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- CLIENTES (Clients/Contracts) table
-- =============================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operador TEXT,
  servicio TEXT CHECK (servicio IN ('Luz', 'Gas', 'Luz y Gas')),
  estado TEXT,
  tiene_suministro BOOLEAN DEFAULT false,
  es_cambio_titular BOOLEAN DEFAULT false,
  tipo_persona TEXT CHECK (tipo_persona IN ('Persona Fisica', 'Persona Juridica')),
  nombre_apellidos TEXT,
  razon_social TEXT,
  documento_nuevo_titular TEXT,
  documento_anterior_titular TEXT,
  email TEXT,
  telefono TEXT,
  cuenta_bancaria TEXT,
  direccion TEXT,
  observaciones TEXT,
  observaciones_admin TEXT,
  cups_gas TEXT,
  cups_luz TEXT,
  compania_gas TEXT,
  compania_luz TEXT,
  potencia_gas TEXT,
  potencia_luz TEXT,
  facturado BOOLEAN DEFAULT false,
  cobrado BOOLEAN DEFAULT false,
  pagado BOOLEAN DEFAULT false,
  factura_pagos TEXT,
  factura_cobros TEXT,
  precio_kw_gas TEXT,
  precio_kw_luz TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common searches
CREATE INDEX IF NOT EXISTS idx_clientes_operador ON public.clientes(operador);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON public.clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_servicio ON public.clientes(servicio);

-- Enable RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clientes - allow authenticated users full access
CREATE POLICY "Authenticated users can view clientes"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clientes"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clientes"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete clientes"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- DOCUMENTOS table for storing document metadata
-- =============================================
CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT CHECK (tipo IN ('plantilla', 'guia', 'contrato', 'otro')),
  archivo_url TEXT NOT NULL,
  archivo_nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documentos - allow authenticated users full access
CREATE POLICY "Authenticated users can view documentos"
  ON public.documentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage documentos"
  ON public.documentos FOR ALL
  TO authenticated
  USING (true);
