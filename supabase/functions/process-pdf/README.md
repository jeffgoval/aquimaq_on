# process-pdf

Edge Function que faz ingestão e vetorização de PDFs (manuais/bulas) para RAG.

- **Auth:** JWT validado dentro da função via `getUser()`. O gateway não deve validar JWT.
- **Deploy:** `supabase functions deploy process-pdf` (o `config.toml` já define `verify_jwt = false` para esta função).
