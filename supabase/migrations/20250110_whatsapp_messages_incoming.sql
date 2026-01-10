-- Add columns for incoming messages to whatsapp_messages table
ALTER TABLE whatsapp_messages
ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outgoing' CHECK (direction IN ('incoming', 'outgoing')),
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reply_to_wamid TEXT;

-- Create index for faster conversation lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_direction
ON whatsapp_messages(phone_number, direction, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_cliente_id
ON whatsapp_messages(cliente_id) WHERE cliente_id IS NOT NULL;

-- Add index for unread messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_unread
ON whatsapp_messages(direction, is_read)
WHERE direction = 'incoming' AND is_read = false;
