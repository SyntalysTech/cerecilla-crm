-- Migration: Create facturacion system for operarios
-- Description: Tables for managing operator invoices

-- =============================================
-- FACTURAS_OPERARIOS table for invoice tracking
-- =============================================
CREATE TABLE IF NOT EXISTS public.facturas_operarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operario_id UUID NOT NULL REFERENCES public.operarios(id) ON DELETE CASCADE,
  numero_factura TEXT NOT NULL,
  fecha_factura DATE NOT NULL,
  total_comision DECIMAL(10,2) DEFAULT 0,
  estado TEXT CHECK (estado IN ('pendiente', 'emitida', 'enviada', 'pagada')) DEFAULT 'pendiente',
  enviada_at TIMESTAMPTZ,
  pagada_at TIMESTAMPTZ,
  documentos_completos BOOLEAN DEFAULT false,
  documentos_faltantes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FACTURA_CLIENTES table for tracking which clients are in each invoice
-- =============================================
CREATE TABLE IF NOT EXISTS public.factura_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID NOT NULL REFERENCES public.facturas_operarios(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  comision DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(factura_id, cliente_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_facturas_operarios_operario_id ON public.facturas_operarios(operario_id);
CREATE INDEX IF NOT EXISTS idx_facturas_operarios_estado ON public.facturas_operarios(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_operarios_fecha ON public.facturas_operarios(fecha_factura);
CREATE INDEX IF NOT EXISTS idx_factura_clientes_factura_id ON public.factura_clientes(factura_id);
CREATE INDEX IF NOT EXISTS idx_factura_clientes_cliente_id ON public.factura_clientes(cliente_id);

-- Enable RLS
ALTER TABLE public.facturas_operarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factura_clientes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for facturas_operarios
CREATE POLICY "Authenticated users can view facturas_operarios"
  ON public.facturas_operarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert facturas_operarios"
  ON public.facturas_operarios FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update facturas_operarios"
  ON public.facturas_operarios FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete facturas_operarios"
  ON public.facturas_operarios FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for factura_clientes
CREATE POLICY "Authenticated users can view factura_clientes"
  ON public.factura_clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert factura_clientes"
  ON public.factura_clientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete factura_clientes"
  ON public.factura_clientes FOR DELETE
  TO authenticated
  USING (true);
