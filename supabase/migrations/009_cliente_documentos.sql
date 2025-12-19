-- Migration: Create cliente_documentos table for client file uploads
-- Description: Store documents attached to specific clients

CREATE TABLE IF NOT EXISTS public.cliente_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  archivo_url TEXT NOT NULL,
  archivo_nombre TEXT NOT NULL,
  archivo_size INTEGER,
  archivo_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cliente_documentos_cliente_id ON public.cliente_documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_documentos_created_at ON public.cliente_documentos(created_at);

-- Enable RLS
ALTER TABLE public.cliente_documentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view client documents"
  ON public.cliente_documentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert client documents"
  ON public.cliente_documentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete their own documents or admins can delete any"
  ON public.cliente_documentos FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  ));

-- Create storage bucket for client documents if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cliente-documentos',
  'cliente-documentos',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for cliente-documentos bucket
CREATE POLICY "Authenticated users can view client document files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'cliente-documentos');

CREATE POLICY "Authenticated users can upload client document files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cliente-documentos');

CREATE POLICY "Users can delete their own document files or admins"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cliente-documentos' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
      )
    )
  );
