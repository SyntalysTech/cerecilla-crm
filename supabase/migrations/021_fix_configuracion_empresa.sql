-- Migration: Fix configuracion_empresa table - add missing columns if they don't exist
-- Created: 2026-01-05

-- Add iban2 column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'configuracion_empresa'
    AND column_name = 'iban2'
  ) THEN
    ALTER TABLE public.configuracion_empresa ADD COLUMN iban2 TEXT;
  END IF;
END $$;

-- Add iban2_nombre column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'configuracion_empresa'
    AND column_name = 'iban2_nombre'
  ) THEN
    ALTER TABLE public.configuracion_empresa ADD COLUMN iban2_nombre TEXT;
  END IF;
END $$;

-- Add iban column if it doesn't exist (just in case)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'configuracion_empresa'
    AND column_name = 'iban'
  ) THEN
    ALTER TABLE public.configuracion_empresa ADD COLUMN iban TEXT;
  END IF;
END $$;

-- Add iban_nombre column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'configuracion_empresa'
    AND column_name = 'iban_nombre'
  ) THEN
    ALTER TABLE public.configuracion_empresa ADD COLUMN iban_nombre TEXT;
  END IF;
END $$;
