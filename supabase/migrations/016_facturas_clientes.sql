-- Migration: Create table for customer invoices
-- Created: 2024-12-20

-- Tabla para facturas a clientes
CREATE TABLE IF NOT EXISTS public.facturas_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero_factura TEXT NOT NULL UNIQUE,
  fecha_factura DATE NOT NULL,
  concepto TEXT NOT NULL,
  importe DECIMAL(10,2) NOT NULL DEFAULT 0,
  iva INTEGER NOT NULL DEFAULT 21,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'emitida',
  iban_usado TEXT, -- IBAN que aparece en la factura
  cobrada_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_facturas_clientes_cliente ON public.facturas_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_clientes_estado ON public.facturas_clientes(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_clientes_fecha ON public.facturas_clientes(fecha_factura);

-- Enable RLS
ALTER TABLE public.facturas_clientes ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Authenticated users can manage facturas_clientes"
  ON public.facturas_clientes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_facturas_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_facturas_clientes_updated_at ON public.facturas_clientes;
CREATE TRIGGER trigger_update_facturas_clientes_updated_at
  BEFORE UPDATE ON public.facturas_clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_facturas_clientes_updated_at();
