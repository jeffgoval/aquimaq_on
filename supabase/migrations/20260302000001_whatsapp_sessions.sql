-- WhatsApp session state for n8n/Evolution API integration
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           TEXT NOT NULL UNIQUE,           -- ex: 5511999999999
  human_mode      BOOLEAN NOT NULL DEFAULT FALSE,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone ON whatsapp_sessions(phone);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_session_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_sessions_updated_at ON whatsapp_sessions;
CREATE TRIGGER trg_whatsapp_sessions_updated_at
  BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_session_timestamp();

-- RLS: só service_role acessa (n8n usa service role key)
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON whatsapp_sessions;
CREATE POLICY "service_role_all" ON whatsapp_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
