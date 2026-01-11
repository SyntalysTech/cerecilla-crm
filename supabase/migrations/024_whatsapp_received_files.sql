-- Migration: Create table for WhatsApp received files (images, documents, etc.)
-- These files are stored so admins can review them in the CRM

CREATE TABLE IF NOT EXISTS public.whatsapp_received_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the WhatsApp message
  message_id UUID REFERENCES public.whatsapp_messages(id) ON DELETE CASCADE,

  -- Link to cliente if identified
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,

  -- Sender info
  phone_number TEXT NOT NULL,
  sender_name TEXT,

  -- File info from WhatsApp
  whatsapp_media_id TEXT NOT NULL,
  media_type TEXT NOT NULL, -- image, document, audio, video
  mime_type TEXT,
  file_size INTEGER,

  -- Our storage
  storage_url TEXT, -- URL in Supabase storage after download
  storage_path TEXT, -- Path in storage bucket

  -- AI Analysis (for invoices/documents)
  ai_analysis JSONB,
  analysis_type TEXT, -- 'invoice', 'document', 'image', etc.

  -- Extracted data (for quick access without parsing ai_analysis)
  detected_tipo TEXT, -- luz, gas, telefonia, seguro, alarma, otro
  detected_compania TEXT,
  detected_importe TEXT,
  detected_cups TEXT,

  -- Status
  status TEXT DEFAULT 'pending', -- pending, downloaded, analyzed, error
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,

  -- For review workflow
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_received_files_phone ON public.whatsapp_received_files(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_received_files_cliente ON public.whatsapp_received_files(cliente_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_received_files_status ON public.whatsapp_received_files(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_received_files_reviewed ON public.whatsapp_received_files(reviewed);
CREATE INDEX IF NOT EXISTS idx_whatsapp_received_files_created ON public.whatsapp_received_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_received_files_tipo ON public.whatsapp_received_files(detected_tipo);

-- Enable RLS
ALTER TABLE public.whatsapp_received_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies - admins can do everything
CREATE POLICY "Authenticated users can view received files"
  ON public.whatsapp_received_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert received files"
  ON public.whatsapp_received_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update received files"
  ON public.whatsapp_received_files FOR UPDATE
  TO authenticated
  USING (true);

-- Service role can do everything (for webhook)
CREATE POLICY "Service role full access"
  ON public.whatsapp_received_files FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.whatsapp_received_files TO authenticated;
GRANT ALL ON public.whatsapp_received_files TO service_role;

COMMENT ON TABLE public.whatsapp_received_files IS 'Stores files (images, documents) received via WhatsApp for review in CRM';
