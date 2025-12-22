-- Migration: Create documentos bucket and add operario permissions
-- Created: 2024-12-22
-- Description:
--   1. Create missing 'documentos' storage bucket for general documents
--   2. Add granular permissions for operarios

-- ============================================
-- PASO 1: Crear bucket 'documentos' para documentos generales
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  true, -- Public para que se puedan ver los documentos
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies para el bucket 'documentos'
DROP POLICY IF EXISTS "Authenticated users can view documentos" ON storage.objects;
CREATE POLICY "Authenticated users can view documentos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documentos');

DROP POLICY IF EXISTS "Authenticated users can upload documentos" ON storage.objects;
CREATE POLICY "Authenticated users can upload documentos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documentos');

DROP POLICY IF EXISTS "Admins can delete documentos" ON storage.objects;
CREATE POLICY "Admins can delete documentos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documentos' AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- PASO 2: Crear tabla de documentos si no existe
-- ============================================

CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL DEFAULT 'otro',
  archivo_url TEXT NOT NULL,
  archivo_nombre TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Campo de visibilidad: 'todos', 'solo_admins', 'operarios'
  visibilidad TEXT NOT NULL DEFAULT 'todos'
);

-- Añadir columna si la tabla ya existe
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS visibilidad TEXT NOT NULL DEFAULT 'todos';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documentos_created_at ON public.documentos(created_at);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON public.documentos(tipo);

-- Enable RLS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Authenticated users can view documentos table" ON public.documentos;
CREATE POLICY "Authenticated users can view documentos table"
  ON public.documentos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert documentos table" ON public.documentos;
CREATE POLICY "Authenticated users can insert documentos table"
  ON public.documentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete documentos table" ON public.documentos;
CREATE POLICY "Admins can delete documentos table"
  ON public.documentos FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- PASO 3: Tabla de permisos de operarios
-- ============================================

CREATE TABLE IF NOT EXISTS public.operario_permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operario_id UUID NOT NULL REFERENCES public.operarios(id) ON DELETE CASCADE,

  -- Permisos de visualización
  puede_ver_clientes BOOLEAN DEFAULT true,
  puede_ver_solo_sus_clientes BOOLEAN DEFAULT true, -- Si false, ve todos
  puede_ver_estadisticas BOOLEAN DEFAULT false,
  puede_ver_facturacion BOOLEAN DEFAULT false,
  puede_ver_documentos BOOLEAN DEFAULT true,

  -- Permisos de edición
  puede_crear_clientes BOOLEAN DEFAULT true,
  puede_editar_clientes BOOLEAN DEFAULT true,
  puede_editar_solo_sus_clientes BOOLEAN DEFAULT true, -- Si false, edita todos
  puede_eliminar_clientes BOOLEAN DEFAULT false,

  -- Permisos de documentos
  puede_subir_documentos BOOLEAN DEFAULT true,
  puede_eliminar_documentos BOOLEAN DEFAULT false,

  -- Permisos de estado
  puede_cambiar_estado BOOLEAN DEFAULT false,
  estados_permitidos TEXT[] DEFAULT ARRAY['Seguimiento', 'En Tramite'], -- Estados a los que puede cambiar

  -- Permisos especiales
  puede_ver_comisiones BOOLEAN DEFAULT true,
  puede_ver_observaciones_admin BOOLEAN DEFAULT false,
  puede_exportar_datos BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(operario_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_operario_permisos_operario_id ON public.operario_permisos(operario_id);

-- Enable RLS
ALTER TABLE public.operario_permisos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "operario_permisos_view" ON public.operario_permisos;
CREATE POLICY "operario_permisos_view"
  ON public.operario_permisos FOR SELECT
  TO authenticated
  USING (
    -- Admins ven todos
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'manager')
    )
    OR
    -- Operarios ven solo sus propios permisos
    EXISTS (
      SELECT 1 FROM public.operarios
      WHERE operarios.id = operario_permisos.operario_id
      AND operarios.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "operario_permisos_manage" ON public.operario_permisos;
CREATE POLICY "operario_permisos_manage"
  ON public.operario_permisos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- PASO 4: Función para crear permisos por defecto al vincular operario
-- ============================================

CREATE OR REPLACE FUNCTION public.create_default_operario_permisos()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear permisos si se asignó un user_id (cuenta vinculada)
  IF NEW.user_id IS NOT NULL AND (OLD IS NULL OR OLD.user_id IS NULL) THEN
    INSERT INTO public.operario_permisos (operario_id)
    VALUES (NEW.id)
    ON CONFLICT (operario_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear permisos por defecto
DROP TRIGGER IF EXISTS trigger_create_operario_permisos ON public.operarios;
CREATE TRIGGER trigger_create_operario_permisos
  AFTER INSERT OR UPDATE OF user_id ON public.operarios
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_operario_permisos();

-- ============================================
-- PASO 5: Crear permisos para operarios existentes con cuenta
-- ============================================

INSERT INTO public.operario_permisos (operario_id)
SELECT id FROM public.operarios WHERE user_id IS NOT NULL
ON CONFLICT (operario_id) DO NOTHING;

-- ============================================
-- PASO 6: Función helper para obtener permisos del operario actual
-- ============================================

CREATE OR REPLACE FUNCTION public.get_operario_permisos()
RETURNS public.operario_permisos AS $$
DECLARE
  permisos public.operario_permisos;
BEGIN
  SELECT op.* INTO permisos
  FROM public.operario_permisos op
  JOIN public.operarios o ON o.id = op.operario_id
  WHERE o.user_id = auth.uid();

  RETURN permisos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_operario_permisos() TO authenticated;
