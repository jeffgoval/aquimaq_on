# process-pdf

Edge Function: ingestão e vetorização de PDFs (manuais/bulas) para RAG.

- **Auth:** JWT validado na função com `getUser(token)`. Gateway com `verify_jwt = false`.
- **Secrets (Edge Functions):** `OPENAI_API_KEY` (mesma do chat-ai).
- **Deploy:** `npx supabase functions deploy process-pdf --no-verify-jwt`
