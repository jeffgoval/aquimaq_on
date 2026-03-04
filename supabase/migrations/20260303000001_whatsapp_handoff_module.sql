-- WhatsApp handoff module: schema, queue routing, and RLS for multi-seller support.

-- 1) Shared enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_channel') THEN
    CREATE TYPE chat_channel AS ENUM ('web', 'whatsapp');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_queue_state') THEN
    CREATE TYPE chat_queue_state AS ENUM ('new', 'bot', 'waiting_human', 'assigned', 'closed');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_delivery_status') THEN
    CREATE TYPE chat_delivery_status AS ENUM ('pending', 'sent', 'delivered', 'failed');
  END IF;
END
$$;

-- 2) Conversation shape upgrades
ALTER TABLE public.chat_conversations
  ALTER COLUMN channel DROP DEFAULT;

ALTER TABLE public.chat_conversations
  ALTER COLUMN channel TYPE chat_channel
  USING CASE
    WHEN channel = 'whatsapp' THEN 'whatsapp'::chat_channel
    ELSE 'web'::chat_channel
  END;

ALTER TABLE public.chat_conversations
  ALTER COLUMN channel SET DEFAULT 'web'::chat_channel;

ALTER TABLE public.chat_conversations
  ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS current_queue_state chat_queue_state NOT NULL DEFAULT 'new'::chat_queue_state;

CREATE INDEX IF NOT EXISTS idx_chat_conversations_contact_phone
  ON public.chat_conversations(contact_phone);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_assigned_agent
  ON public.chat_conversations(assigned_agent);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_queue_state
  ON public.chat_conversations(current_queue_state);

-- 3) Message shape upgrades
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS external_message_id TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status chat_delivery_status NOT NULL DEFAULT 'pending'::chat_delivery_status,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_messages_external_message_id
  ON public.chat_messages(external_message_id)
  WHERE external_message_id IS NOT NULL;

-- 4) WhatsApp session upgrades
ALTER TABLE public.whatsapp_sessions
  ADD COLUMN IF NOT EXISTS assigned_agent UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_customer_message_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_handoff_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_assigned_agent
  ON public.whatsapp_sessions(assigned_agent);

-- 5) Handoff/audit events
CREATE TABLE IF NOT EXISTS public.chat_assignment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  from_agent UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_agent UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_assignment_events_conversation
  ON public.chat_assignment_events(conversation_id, created_at DESC);

-- 6) Queue helper: next seller round-robin
CREATE OR REPLACE FUNCTION public.next_vendedor_for_handoff(last_agent_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  chosen UUID;
BEGIN
  IF last_agent_id IS NULL THEN
    SELECT p.id INTO chosen
    FROM public.profiles p
    WHERE p.role = 'vendedor'
    ORDER BY p.created_at NULLS LAST, p.id
    LIMIT 1;
  ELSE
    SELECT p.id INTO chosen
    FROM public.profiles p
    WHERE p.role = 'vendedor'
      AND (p.created_at, p.id) > (
        SELECT p2.created_at, p2.id
        FROM public.profiles p2
        WHERE p2.id = last_agent_id
      )
    ORDER BY p.created_at NULLS LAST, p.id
    LIMIT 1;

    IF chosen IS NULL THEN
      SELECT p.id INTO chosen
      FROM public.profiles p
      WHERE p.role = 'vendedor'
      ORDER BY p.created_at NULLS LAST, p.id
      LIMIT 1;
    END IF;
  END IF;

  RETURN chosen;
END;
$$;

-- 7) Conversation handoff RPC
CREATE OR REPLACE FUNCTION public.handoff_chat_conversation(
  p_conversation_id UUID,
  p_to_agent UUID,
  p_reason TEXT DEFAULT 'manual_handoff'
)
RETURNS public.chat_conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  acting_user UUID;
  acting_role TEXT;
  prev_agent UUID;
  updated_row public.chat_conversations;
BEGIN
  acting_user := auth.uid();
  IF acting_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO acting_role
  FROM public.profiles
  WHERE id = acting_user;

  IF acting_role NOT IN ('vendedor', 'gerente', 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT assigned_agent INTO prev_agent
  FROM public.chat_conversations
  WHERE id = p_conversation_id
  FOR UPDATE;

  UPDATE public.chat_conversations
  SET assigned_agent = p_to_agent,
      status = 'active',
      current_queue_state = 'assigned',
      updated_at = now()
  WHERE id = p_conversation_id
  RETURNING * INTO updated_row;

  IF updated_row.id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  INSERT INTO public.chat_assignment_events(conversation_id, from_agent, to_agent, reason)
  VALUES (p_conversation_id, prev_agent, p_to_agent, p_reason);

  UPDATE public.whatsapp_sessions
  SET assigned_agent = p_to_agent,
      human_mode = true,
      last_handoff_at = now()
  WHERE conversation_id = p_conversation_id;

  RETURN updated_row;
END;
$$;

-- 8) RLS hardening
ALTER TABLE public.chat_assignment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_assignment_events_select_roles" ON public.chat_assignment_events;
CREATE POLICY "chat_assignment_events_select_roles"
ON public.chat_assignment_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.chat_conversations c ON c.id = chat_assignment_events.conversation_id
    WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'gerente')
        OR (p.role = 'vendedor' AND c.assigned_agent = p.id)
      )
  )
);

DROP POLICY IF EXISTS "chat_assignment_events_insert_roles" ON public.chat_assignment_events;
CREATE POLICY "chat_assignment_events_insert_roles"
ON public.chat_assignment_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('vendedor', 'gerente', 'admin')
  )
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_conversations_select_by_role" ON public.chat_conversations;
CREATE POLICY "chat_conversations_select_by_role"
ON public.chat_conversations
FOR SELECT
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'gerente')
        OR (p.role = 'vendedor' AND chat_conversations.assigned_agent = p.id)
      )
  )
);

DROP POLICY IF EXISTS "chat_conversations_update_by_role" ON public.chat_conversations;
CREATE POLICY "chat_conversations_update_by_role"
ON public.chat_conversations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'gerente')
        OR (p.role = 'vendedor' AND chat_conversations.assigned_agent = p.id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'gerente')
        OR (p.role = 'vendedor' AND chat_conversations.assigned_agent = p.id)
      )
  )
);

DROP POLICY IF EXISTS "chat_conversations_insert_customer_or_role" ON public.chat_conversations;
CREATE POLICY "chat_conversations_insert_customer_or_role"
ON public.chat_conversations
FOR INSERT
WITH CHECK (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('vendedor', 'gerente', 'admin')
  )
);

DROP POLICY IF EXISTS "chat_messages_select_by_role" ON public.chat_messages;
CREATE POLICY "chat_messages_select_by_role"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.id = chat_messages.conversation_id
      AND (
        c.customer_id = auth.uid()
        OR p.role IN ('admin', 'gerente')
        OR (p.role = 'vendedor' AND c.assigned_agent = p.id)
      )
  )
);

DROP POLICY IF EXISTS "chat_messages_insert_by_role" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_by_role"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    LEFT JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.id = chat_messages.conversation_id
      AND (
        c.customer_id = auth.uid()
        OR (p.role IS NOT NULL AND p.role IN ('vendedor', 'gerente', 'admin'))
      )
  )
);

-- Only service role can directly touch whatsapp_sessions.
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.whatsapp_sessions;
CREATE POLICY "service_role_all" ON public.whatsapp_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
