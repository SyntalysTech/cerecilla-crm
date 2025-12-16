-- ============================================
-- Migration: 002_storage_bucket
-- Description: Storage bucket for email template images
-- Date: 2025-12-XX
-- ============================================

-- Crear bucket para imágenes de email templates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'email-assets',
    'email-assets',
    true,
    5242880, -- 5MB max
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Usuarios autenticados pueden subir imágenes
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-assets');

-- Policy: Cualquiera puede ver las imágenes (son públicas para los emails)
CREATE POLICY "Public can view email assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'email-assets');

-- Policy: Usuarios autenticados pueden eliminar sus propias imágenes
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'email-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
