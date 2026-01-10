-- Migration: Add IRPF field to facturas_operarios
-- Description: Add IRPF withholding tax percentage for operator invoices

ALTER TABLE public.facturas_operarios
ADD COLUMN IF NOT EXISTS irpf DECIMAL(5,2) DEFAULT 15;

-- Add comment
COMMENT ON COLUMN public.facturas_operarios.irpf IS 'IRPF withholding tax percentage (default 15%)';
