-- Migration: Add file_data_base64 field to store file content
-- This allows viewing/downloading files even after WhatsApp media URLs expire

ALTER TABLE public.whatsapp_received_files
ADD COLUMN IF NOT EXISTS file_data_base64 TEXT;

COMMENT ON COLUMN public.whatsapp_received_files.file_data_base64 IS 'Base64 encoded file data (for temporary storage before moving to Supabase Storage)';
