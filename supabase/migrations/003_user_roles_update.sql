-- ============================================
-- Migration: 003_user_roles_update
-- Description: Actualizar roles para Cerecilla CRM
-- Date: 2025-12-16
-- ============================================

-- Roles disponibles:
-- - super_admin: Control total del sistema, puede crear otros admins
-- - admin: Administrador general, gestiona usuarios y configuración
-- - manager: Gestor/Responsable de equipo, supervisa agentes
-- - agent: Agente comercial/Empleado, gestiona clientes y ventas
-- - collaborator: Colaborador externo (inmobiliarias, partners)
-- - viewer: Solo lectura, para auditoría o consultas

-- ============================================
-- PASO 0: Eliminar TODAS las políticas RLS que dependen del ENUM user_role
-- ============================================

-- Políticas en emails
DROP POLICY IF EXISTS "Users can view own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can view own emails or admins all" ON public.emails;
DROP POLICY IF EXISTS "Users can insert own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can update own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can delete own emails" ON public.emails;
DROP POLICY IF EXISTS "Super admins full access" ON public.emails;
DROP POLICY IF EXISTS "Admins full access" ON public.emails;

-- Políticas en email_templates
DROP POLICY IF EXISTS "Users can view own templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can view own templates or admins all" ON public.email_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.email_templates;
DROP POLICY IF EXISTS "Super admins full access" ON public.email_templates;
DROP POLICY IF EXISTS "Admins full access" ON public.email_templates;

-- Políticas en user_roles
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins full access" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage" ON public.user_roles;

-- Políticas en profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins full access" ON public.profiles;

-- ============================================
-- PASO 1: Actualizar el ENUM user_role existente
-- ============================================

-- Primero quitamos el default de la columna
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;

-- Convertimos la columna a TEXT temporalmente
ALTER TABLE public.user_roles
    ALTER COLUMN role TYPE TEXT
    USING role::TEXT;

-- Ahora podemos eliminar el ENUM antiguo
DROP TYPE IF EXISTS public.user_role;

-- Creamos el nuevo ENUM con todos los roles
CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'admin',
    'manager',
    'agent',
    'collaborator',
    'viewer'
);

-- Convertimos roles antiguos a nuevos antes de cambiar el tipo
UPDATE public.user_roles SET role = 'viewer' WHERE role = 'user';

-- Volvemos a poner la columna como ENUM
ALTER TABLE public.user_roles
    ALTER COLUMN role TYPE public.user_role
    USING role::public.user_role;

-- Ponemos el nuevo default
ALTER TABLE public.user_roles
    ALTER COLUMN role SET DEFAULT 'viewer'::public.user_role;

-- ============================================
-- PASO 2: Añadir campos extra a profiles
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notes TEXT;

-- Índice para buscar usuarios activos
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- ============================================
-- PASO 3: Actualizar el usuario principal a super_admin
-- ============================================
UPDATE public.user_roles
SET role = 'super_admin'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'laia.cerecilla@gmail.com');

-- ============================================
-- PASO 4: Recrear políticas RLS para emails
-- ============================================
CREATE POLICY "Users can view own emails"
    ON public.emails FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own emails"
    ON public.emails FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own emails"
    ON public.emails FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- ============================================
-- PASO 5: Recrear políticas RLS para email_templates
-- ============================================
CREATE POLICY "Users can view own templates"
    ON public.email_templates FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own templates"
    ON public.email_templates FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates"
    ON public.email_templates FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own templates"
    ON public.email_templates FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- ============================================
-- PASO 6: RLS para profiles
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

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
-- PASO 7: RLS para user_roles
-- ============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (true);

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

-- ============================================
-- PASO 8: Función para crear perfil automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GRANTS
-- ============================================
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
