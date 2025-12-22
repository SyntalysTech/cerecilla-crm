-- Migration: Enable operario portal access
-- Created: 2024-12-20
-- Description: Link operarios to user accounts and add 'operario' role

-- ============================================
-- PASO 1: Añadir 'operario' al enum user_role
-- ============================================

-- Primero eliminamos TODAS las políticas que usan el enum user_role
-- Políticas en user_roles
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

-- Políticas en profiles
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Políticas en operario_comisiones
DROP POLICY IF EXISTS "operario_comisiones_all" ON public.operario_comisiones;

-- Políticas en configuracion_comisiones
DROP POLICY IF EXISTS "configuracion_comisiones_all" ON public.configuracion_comisiones;

-- Políticas en referido_clientes
DROP POLICY IF EXISTS "referido_clientes_all" ON public.referido_clientes;

-- Políticas en configuracion_referidos
DROP POLICY IF EXISTS "configuracion_referidos_all" ON public.configuracion_referidos;

-- Políticas en cliente_documentos
DROP POLICY IF EXISTS "Users can delete their own documents or admins can delete any" ON public.cliente_documentos;

-- Políticas en cliente_observaciones
DROP POLICY IF EXISTS "Authenticated users can view non-admin observations" ON public.cliente_observaciones;
DROP POLICY IF EXISTS "Users can update their own observations" ON public.cliente_observaciones;
DROP POLICY IF EXISTS "Admins can delete observations" ON public.cliente_observaciones;

-- Políticas en storage.objects (incluyendo las de documentos bucket de migración 019)
DROP POLICY IF EXISTS "Users can delete their own document files or admins" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documentos" ON storage.objects;

-- Políticas en documentos table (de migración 019, si existen)
DROP POLICY IF EXISTS "Authenticated users can view documentos table" ON public.documentos;
DROP POLICY IF EXISTS "Authenticated users can insert documentos table" ON public.documentos;
DROP POLICY IF EXISTS "Admins can delete documentos table" ON public.documentos;

-- Políticas en operario_permisos (de migración 019, si existen)
DROP POLICY IF EXISTS "operario_permisos_view" ON public.operario_permisos;
DROP POLICY IF EXISTS "operario_permisos_manage" ON public.operario_permisos;

-- Políticas en operarios (pueden existir de intentos anteriores)
DROP POLICY IF EXISTS "Operarios view policy" ON public.operarios;
DROP POLICY IF EXISTS "Operarios insert policy" ON public.operarios;
DROP POLICY IF EXISTS "Operarios update policy" ON public.operarios;
DROP POLICY IF EXISTS "Operarios delete policy" ON public.operarios;
DROP POLICY IF EXISTS "Authenticated users can view operarios" ON public.operarios;
DROP POLICY IF EXISTS "Authenticated users can insert operarios" ON public.operarios;
DROP POLICY IF EXISTS "Authenticated users can update operarios" ON public.operarios;
DROP POLICY IF EXISTS "Authenticated users can delete operarios" ON public.operarios;

-- Políticas en clientes (pueden existir de intentos anteriores)
DROP POLICY IF EXISTS "Clientes view policy" ON public.clientes;
DROP POLICY IF EXISTS "Clientes insert policy" ON public.clientes;
DROP POLICY IF EXISTS "Clientes update policy" ON public.clientes;
DROP POLICY IF EXISTS "Clientes delete policy" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can delete clientes" ON public.clientes;

-- Quitamos el default de la columna
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;

-- Convertimos la columna a TEXT temporalmente
ALTER TABLE public.user_roles
    ALTER COLUMN role TYPE TEXT
    USING role::TEXT;

-- Eliminamos el ENUM antiguo
DROP TYPE IF EXISTS public.user_role;

-- Creamos el nuevo ENUM con el rol 'operario'
CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'admin',
    'manager',
    'agent',
    'collaborator',
    'viewer',
    'operario'
);

-- Volvemos a poner la columna como ENUM
ALTER TABLE public.user_roles
    ALTER COLUMN role TYPE public.user_role
    USING role::public.user_role;

-- Ponemos el nuevo default
ALTER TABLE public.user_roles
    ALTER COLUMN role SET DEFAULT 'viewer'::public.user_role;

-- ============================================
-- PASO 2: Añadir user_id a tabla operarios
-- ============================================

-- Añadir campo para vincular operario con usuario
ALTER TABLE public.operarios
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Índice para buscar operario por user_id
CREATE INDEX IF NOT EXISTS idx_operarios_user_id ON public.operarios(user_id);

-- ============================================
-- PASO 3: Recrear políticas RLS
-- ============================================

-- Políticas para user_roles
CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can update roles"
    ON public.user_roles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- Política para profiles
CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- ============================================
-- PASO 4: Políticas RLS para operarios según rol
-- ============================================

-- Nuevas políticas: admins ven todo, operarios solo se ven a sí mismos
CREATE POLICY "Operarios view policy"
    ON public.operarios FOR SELECT
    TO authenticated
    USING (
        -- Admins y managers ven todo
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin', 'manager', 'agent')
        )
        OR
        -- Operarios solo se ven a sí mismos
        user_id = auth.uid()
    );

CREATE POLICY "Operarios insert policy"
    ON public.operarios FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin', 'manager')
        )
    );

CREATE POLICY "Operarios update policy"
    ON public.operarios FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin', 'manager')
        )
    );

CREATE POLICY "Operarios delete policy"
    ON public.operarios FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- ============================================
-- PASO 5: Políticas RLS para clientes según rol operario
-- ============================================

-- Nuevas políticas: admins ven todo, operarios solo ven sus clientes
CREATE POLICY "Clientes view policy"
    ON public.clientes FOR SELECT
    TO authenticated
    USING (
        -- Admins y personal interno ven todo
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin', 'manager', 'agent')
        )
        OR
        -- Operarios solo ven clientes donde son el operador
        EXISTS (
            SELECT 1 FROM public.operarios
            WHERE operarios.user_id = auth.uid()
            AND (
                clientes.operador = operarios.alias
                OR clientes.operador = operarios.nombre
                OR clientes.operador = operarios.email
            )
        )
    );

CREATE POLICY "Clientes insert policy"
    ON public.clientes FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Admins pueden crear cualquier cliente
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin', 'manager', 'agent')
        )
        OR
        -- Operarios pueden crear clientes (el operador será su alias)
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'operario'
        )
    );

CREATE POLICY "Clientes update policy"
    ON public.clientes FOR UPDATE
    TO authenticated
    USING (
        -- Admins pueden actualizar todo
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin', 'manager', 'agent')
        )
        OR
        -- Operarios solo actualizan sus clientes
        EXISTS (
            SELECT 1 FROM public.operarios
            WHERE operarios.user_id = auth.uid()
            AND (
                clientes.operador = operarios.alias
                OR clientes.operador = operarios.nombre
                OR clientes.operador = operarios.email
            )
        )
    );

CREATE POLICY "Clientes delete policy"
    ON public.clientes FOR DELETE
    TO authenticated
    USING (
        -- Solo admins pueden eliminar
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- ============================================
-- PASO 6: Función helper para obtener operario del usuario actual
-- ============================================

CREATE OR REPLACE FUNCTION public.get_current_operario()
RETURNS TABLE (
    id UUID,
    alias TEXT,
    nombre TEXT,
    email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.alias, o.nombre, o.email
    FROM public.operarios o
    WHERE o.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_current_operario() TO authenticated;

-- ============================================
-- PASO 7: Recrear políticas eliminadas de otras tablas
-- ============================================

-- Políticas para operario_comisiones
CREATE POLICY "operario_comisiones_all" ON public.operario_comisiones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Políticas para configuracion_comisiones
CREATE POLICY "configuracion_comisiones_all" ON public.configuracion_comisiones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Políticas para referido_clientes
CREATE POLICY "referido_clientes_all" ON public.referido_clientes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Políticas para configuracion_referidos
CREATE POLICY "configuracion_referidos_all" ON public.configuracion_referidos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Políticas para cliente_documentos
CREATE POLICY "Users can delete their own documents or admins can delete any"
  ON public.cliente_documentos FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  ));

-- Políticas para cliente_observaciones
CREATE POLICY "Authenticated users can view non-admin observations"
  ON public.cliente_observaciones FOR SELECT
  TO authenticated
  USING (es_admin = false OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin', 'manager')
  ));

CREATE POLICY "Users can update their own observations"
  ON public.cliente_observaciones FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins can delete observations"
  ON public.cliente_observaciones FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  ));

-- Políticas para storage.objects
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
