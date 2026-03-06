-- Allow staff roles to read whatsapp_sessions (needed for unread_count badge in admin panel)
DROP POLICY IF EXISTS "staff_select_whatsapp_sessions" ON public.whatsapp_sessions;
CREATE POLICY "staff_select_whatsapp_sessions" ON public.whatsapp_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'gerente', 'vendedor')
    )
  );

-- Allow staff roles to update whatsapp_sessions (needed for claim/close conversation)
DROP POLICY IF EXISTS "staff_update_whatsapp_sessions" ON public.whatsapp_sessions;
CREATE POLICY "staff_update_whatsapp_sessions" ON public.whatsapp_sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'gerente', 'vendedor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'gerente', 'vendedor')
    )
  );
