-- Migration: Fix servicio constraint to allow all service types
-- Created: 2024-12-20

-- Drop the existing constraint on clientes.servicio
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_servicio_check;

-- The servicio field now stores comma-separated values like "Luz, Gas, Telefonía"
-- so we can't use a simple CHECK constraint anymore.
-- If validation is needed, it should be done at the application level.

-- Alternatively, if we want to keep some validation, we could change to TEXT without constraint
-- ALTER TABLE public.clientes ALTER COLUMN servicio TYPE TEXT;

-- Note: The servicio column is now a free text field that can contain any combination
-- of services separated by ", " (comma space)
