-- WhatsApp Settings table for storing phone number registration status
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waba_id TEXT,
  phone_number_id TEXT UNIQUE NOT NULL,
  phone_e164 TEXT,
  status TEXT DEFAULT 'PENDING',
  verified_name TEXT,
  quality_rating TEXT,
  platform_type TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read/write
CREATE POLICY "Admins can manage whatsapp_settings" ON whatsapp_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Allow service role full access (for API routes)
CREATE POLICY "Service role full access" ON whatsapp_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_settings_updated_at
  BEFORE UPDATE ON whatsapp_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_settings_updated_at();
