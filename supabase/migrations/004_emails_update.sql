-- ============================================
-- Migration: 004_emails_update
-- Description: Actualizar tabla emails para soportar múltiples destinatarios
-- Date: 2025-12-16
-- ============================================

-- Añadir nuevas columnas para múltiples destinatarios
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS to_addresses TEXT[] DEFAULT '{}';
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS cc_addresses TEXT[] DEFAULT '{}';
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS bcc_addresses TEXT[] DEFAULT '{}';
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS html TEXT;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS text TEXT;

-- Actualizar el ENUM de status para incluir más estados
ALTER TABLE public.emails ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.emails
    ALTER COLUMN status TYPE TEXT
    USING status::TEXT;

DROP TYPE IF EXISTS public.email_status;

CREATE TYPE public.email_status AS ENUM ('queued', 'sending', 'sent', 'delivered', 'failed', 'bounced');

UPDATE public.emails SET status = 'sent' WHERE status NOT IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'bounced');

ALTER TABLE public.emails
    ALTER COLUMN status TYPE public.email_status
    USING status::public.email_status;

ALTER TABLE public.emails ALTER COLUMN status SET DEFAULT 'queued';

-- Migrar datos existentes de to_email a to_addresses
UPDATE public.emails
SET to_addresses = ARRAY[to_email]
WHERE to_email IS NOT NULL AND (to_addresses IS NULL OR to_addresses = '{}');

-- Índice para búsquedas por destinatario
CREATE INDEX IF NOT EXISTS idx_emails_to_addresses ON public.emails USING GIN(to_addresses);
