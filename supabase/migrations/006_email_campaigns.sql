-- Migration: Email Campaigns Tracking System
-- Description: Tables for tracking email campaign analytics (opens, clicks, unsubscribes)

-- Tabla de campañas
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  html_content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  unsubscribe_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  filters JSONB,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de destinatarios de campaña
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id),
  email TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'pending',
  open_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de eventos de tracking
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES email_campaign_recipients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  link_url TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de bajas de email (unsubscribes)
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  campaign_id UUID REFERENCES email_campaigns(id),
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON email_campaign_recipients(email);
CREATE INDEX IF NOT EXISTS idx_tracking_events_campaign ON email_tracking_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_recipient ON email_tracking_events(recipient_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_type ON email_tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_unsubscribes_email ON email_unsubscribes(email);

-- Añadir columna unsubscribed a clientes si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clientes' AND column_name = 'unsubscribed'
  ) THEN
    ALTER TABLE clientes ADD COLUMN unsubscribed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Políticas para email_campaigns
CREATE POLICY "Users can view campaigns" ON email_campaigns
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create campaigns" ON email_campaigns
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update campaigns" ON email_campaigns
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete campaigns" ON email_campaigns
  FOR DELETE TO authenticated USING (true);

-- Políticas para email_campaign_recipients
CREATE POLICY "Users can view recipients" ON email_campaign_recipients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert recipients" ON email_campaign_recipients
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update recipients" ON email_campaign_recipients
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anon can update recipients" ON email_campaign_recipients
  FOR UPDATE TO anon USING (true);

-- Políticas para email_tracking_events (anon puede insertar para tracking)
CREATE POLICY "Anon can insert tracking" ON email_tracking_events
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Users can view tracking" ON email_tracking_events
  FOR SELECT TO authenticated USING (true);

-- Políticas para email_unsubscribes
CREATE POLICY "Anon can insert unsubscribes" ON email_unsubscribes
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Users can view unsubscribes" ON email_unsubscribes
  FOR SELECT TO authenticated USING (true);

-- Trigger para actualizar updated_at en campaigns
CREATE OR REPLACE FUNCTION update_email_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER trigger_update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_email_campaigns_updated_at();
