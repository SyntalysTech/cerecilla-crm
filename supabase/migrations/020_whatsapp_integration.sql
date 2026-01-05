-- Migration: WhatsApp Business API Integration
-- Created: 2024-12-22
-- Description: Tables for WhatsApp Business Cloud API integration

-- ============================================
-- PASO 1: Tabla de configuración de WhatsApp
-- ============================================

CREATE TABLE IF NOT EXISTS public.configuracion_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Credenciales de Meta Business
  phone_number_id TEXT, -- ID del número de teléfono de WhatsApp Business
  business_account_id TEXT, -- ID de la cuenta de WhatsApp Business (WABA)
  access_token TEXT, -- Token de acceso permanente

  -- Configuración del número
  phone_number TEXT, -- Número de teléfono (+34 643 87 91 49)
  display_name TEXT, -- Nombre que se muestra ("Cerecilla SL Ahorro en Energía y Servi")

  -- Estado
  is_active BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solo puede haber una configuración
CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracion_whatsapp_single
  ON public.configuracion_whatsapp ((true));

-- Enable RLS
ALTER TABLE public.configuracion_whatsapp ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver/editar configuración
DROP POLICY IF EXISTS "Admins can manage whatsapp config" ON public.configuracion_whatsapp;
CREATE POLICY "Admins can manage whatsapp config"
  ON public.configuracion_whatsapp FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- PASO 2: Tabla de plantillas de WhatsApp
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificador de Meta
  template_id TEXT, -- ID de la plantilla en Meta
  template_name TEXT NOT NULL, -- Nombre único de la plantilla (ej: "bienvenida_cliente")

  -- Contenido
  category TEXT NOT NULL DEFAULT 'MARKETING', -- MARKETING, UTILITY, AUTHENTICATION
  language TEXT NOT NULL DEFAULT 'es',

  -- Componentes (header, body, footer, buttons)
  header_type TEXT, -- TEXT, IMAGE, VIDEO, DOCUMENT
  header_text TEXT,
  header_media_url TEXT,

  body_text TEXT NOT NULL, -- Texto con variables {{1}}, {{2}}, etc.
  body_variables TEXT[], -- Nombres de las variables para mapear

  footer_text TEXT,

  -- Botones (máximo 3)
  buttons JSONB, -- Array de {type, text, url/phone_number}

  -- Estado en Meta
  status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  rejection_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(template_name)
);

-- Enable RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view whatsapp templates" ON public.whatsapp_templates;
CREATE POLICY "Authenticated can view whatsapp templates"
  ON public.whatsapp_templates FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage whatsapp templates" ON public.whatsapp_templates;
CREATE POLICY "Admins can manage whatsapp templates"
  ON public.whatsapp_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- PASO 3: Tabla de mensajes enviados
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Destinatario
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL, -- Número destino

  -- Mensaje
  template_id UUID REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  template_name TEXT,
  message_type TEXT NOT NULL DEFAULT 'template', -- template, text, image, document

  -- Contenido (para mensajes no-template)
  content TEXT,
  media_url TEXT,

  -- Variables usadas en la plantilla
  template_variables JSONB,

  -- Respuesta de Meta
  wamid TEXT, -- WhatsApp Message ID
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, read, failed
  error_code TEXT,
  error_message TEXT,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Campaña (si es parte de envío masivo)
  campaign_id UUID,

  -- Usuario que envió
  sent_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_cliente ON public.whatsapp_messages(cliente_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON public.whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_campaign ON public.whatsapp_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Authenticated can view whatsapp messages"
  ON public.whatsapp_messages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Authenticated can insert whatsapp messages"
  ON public.whatsapp_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Admins can manage whatsapp messages"
  ON public.whatsapp_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- PASO 4: Tabla de campañas de WhatsApp
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nombre TEXT NOT NULL,
  descripcion TEXT,

  -- Plantilla a usar
  template_id UUID REFERENCES public.whatsapp_templates(id),

  -- Filtros de destinatarios
  filtro_estado TEXT[], -- Estados de clientes a incluir
  filtro_servicio TEXT[], -- Servicios
  filtro_operador TEXT[], -- Operadores específicos

  -- Estadísticas
  total_destinatarios INTEGER DEFAULT 0,
  enviados INTEGER DEFAULT 0,
  entregados INTEGER DEFAULT 0,
  leidos INTEGER DEFAULT 0,
  fallidos INTEGER DEFAULT 0,

  -- Estado
  status TEXT DEFAULT 'draft', -- draft, scheduled, sending, completed, cancelled
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Usuario
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view whatsapp campaigns" ON public.whatsapp_campaigns;
CREATE POLICY "Authenticated can view whatsapp campaigns"
  ON public.whatsapp_campaigns FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage whatsapp campaigns" ON public.whatsapp_campaigns;
CREATE POLICY "Admins can manage whatsapp campaigns"
  ON public.whatsapp_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- PASO 5: Insertar plantillas por defecto (ejemplos)
-- ============================================

INSERT INTO public.whatsapp_templates (template_name, category, body_text, body_variables, footer_text)
VALUES
  (
    'bienvenida_cliente',
    'MARKETING',
    'Hola {{1}}, gracias por confiar en Cerecilla Energía. Tu contrato de {{2}} está en proceso. Te mantendremos informado del estado.',
    ARRAY['nombre', 'servicio'],
    'Cerecilla SL - Ahorro en Energía y Servicios'
  ),
  (
    'estado_actualizado',
    'UTILITY',
    'Hola {{1}}, tu expediente ha sido actualizado. Nuevo estado: {{2}}. Si tienes dudas, no dudes en contactarnos.',
    ARRAY['nombre', 'estado'],
    'Cerecilla SL'
  ),
  (
    'documentacion_pendiente',
    'UTILITY',
    'Hola {{1}}, necesitamos que nos envíes la siguiente documentación para continuar con tu trámite: {{2}}. Gracias.',
    ARRAY['nombre', 'documentos'],
    'Cerecilla SL'
  ),
  (
    'recordatorio_pago',
    'UTILITY',
    'Hola {{1}}, te recordamos que tienes un pago pendiente de {{2}}€. Si ya lo has realizado, ignora este mensaje.',
    ARRAY['nombre', 'importe'],
    'Cerecilla SL'
  ),
  (
    'promocion_servicios',
    'MARKETING',
    'Hola {{1}}, tenemos una oferta especial para ti en {{2}}. Contacta con nosotros para más información. ¡No te lo pierdas!',
    ARRAY['nombre', 'servicio'],
    'Cerecilla SL - Ahorro en Energía'
  )
ON CONFLICT (template_name) DO NOTHING;

-- ============================================
-- PASO 6: Función para actualizar estadísticas de campaña
-- ============================================

CREATE OR REPLACE FUNCTION public.update_whatsapp_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.campaign_id IS NOT NULL THEN
    UPDATE public.whatsapp_campaigns
    SET
      enviados = (SELECT COUNT(*) FROM public.whatsapp_messages WHERE campaign_id = NEW.campaign_id AND status IN ('sent', 'delivered', 'read')),
      entregados = (SELECT COUNT(*) FROM public.whatsapp_messages WHERE campaign_id = NEW.campaign_id AND status IN ('delivered', 'read')),
      leidos = (SELECT COUNT(*) FROM public.whatsapp_messages WHERE campaign_id = NEW.campaign_id AND status = 'read'),
      fallidos = (SELECT COUNT(*) FROM public.whatsapp_messages WHERE campaign_id = NEW.campaign_id AND status = 'failed'),
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_campaign_stats ON public.whatsapp_messages;
CREATE TRIGGER trigger_update_campaign_stats
  AFTER INSERT OR UPDATE OF status ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_whatsapp_campaign_stats();
