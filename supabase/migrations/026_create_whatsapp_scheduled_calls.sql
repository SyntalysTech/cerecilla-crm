-- Migration: Create whatsapp_scheduled_calls table
-- Stores call requests from WhatsApp bot for CRM calendar/agenda view

CREATE TABLE IF NOT EXISTS public.whatsapp_scheduled_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact information
  phone_number TEXT NOT NULL,
  sender_name TEXT,

  -- Request details
  service_interest TEXT NOT NULL, -- Which service they asked about (Luz, Gas, Telefonía, etc.)
  requested_datetime TIMESTAMPTZ, -- When they want to be called (if specified)
  notes TEXT, -- Additional context from conversation

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),

  -- Related message
  message_id UUID REFERENCES public.whatsapp_messages(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_whatsapp_scheduled_calls_status ON public.whatsapp_scheduled_calls(status);
CREATE INDEX idx_whatsapp_scheduled_calls_created_at ON public.whatsapp_scheduled_calls(created_at DESC);
CREATE INDEX idx_whatsapp_scheduled_calls_service ON public.whatsapp_scheduled_calls(service_interest);

-- Enable RLS
ALTER TABLE public.whatsapp_scheduled_calls ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all scheduled calls
CREATE POLICY "Allow authenticated users to read scheduled calls"
  ON public.whatsapp_scheduled_calls
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert scheduled calls
CREATE POLICY "Allow authenticated users to insert scheduled calls"
  ON public.whatsapp_scheduled_calls
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update scheduled calls
CREATE POLICY "Allow authenticated users to update scheduled calls"
  ON public.whatsapp_scheduled_calls
  FOR UPDATE
  TO authenticated
  USING (true);

-- Updated timestamp trigger
CREATE TRIGGER update_whatsapp_scheduled_calls_updated_at
  BEFORE UPDATE ON public.whatsapp_scheduled_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.whatsapp_scheduled_calls IS 'Stores call requests from WhatsApp bot for calendar/agenda view in CRM';
COMMENT ON COLUMN public.whatsapp_scheduled_calls.service_interest IS 'Which service the client asked about (Luz, Gas, Telefonía, Fibra, Seguros, Alarmas, Colaborador)';
COMMENT ON COLUMN public.whatsapp_scheduled_calls.requested_datetime IS 'When the client wants to be called (if they specified a time)';
COMMENT ON COLUMN public.whatsapp_scheduled_calls.status IS 'pending = waiting to call, completed = already called, cancelled = client cancelled';
