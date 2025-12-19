-- ============================================
-- Migration: 002_storage_bucket
-- Description: Storage bucket for email template assets (images and documents)
-- Date: 2025-12-XX
-- ============================================

-- Crear bucket para assets de email templates (imágenes y documentos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'email-assets',
    'email-assets',
    true,
    10485760, -- 10MB max
    ARRAY[
        -- Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        -- Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-rar-compressed',
        'text/plain',
        'text/csv'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

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
