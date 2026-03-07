# Copiar WhatsApp (e outros) do .env para os Secrets do Supabase

As **Edge Functions** (whatsapp-send, whatsapp-inbound, etc.) **não leem o teu ficheiro .env**.  
Elas usam apenas as variáveis configuradas em **Supabase Dashboard → Project Settings → Edge Functions → Secrets**.

Se tens a rota e as chaves no `.env`, tens de as **copiar para os Secrets**.

---

## Passo a passo

1. Abre **Supabase Dashboard** → teu projeto **bzicdqrbqykypzesxayw**.
2. Vai a **Project Settings** (ícone engrenagem) → **Edge Functions**.
3. Na secção **Secrets**, adiciona (ou edita) estes nomes com os **valores do teu .env**:

| Nome do Secret | Onde copiar o valor |
|----------------|---------------------|
| `SUPABASE_URL` | No .env: `VITE_SUPABASE_URL` (ex: https://bzicdqrbqykypzesxayw.supabase.co) |
| `SUPABASE_ANON_KEY` | No .env: `VITE_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | No .env: `VITE_SUPABASE_SERVICE_ROLE_KEY` |
| **`WHATSAPP_API_URL`** | No .env: **`WHATSAPP_API_URL`** (ex: http://72.61.60.210:47918) |
| **`WHATSAPP_API_KEY`** | No .env: **`WHATSAPP_API_KEY`** |
| **`WHATSAPP_INSTANCE`** | No .env: **`WHATSAPP_INSTANCE`** (ex: aquimaq) |

4. Guarda. As Edge Functions passam a usar estes valores quando o whatsapp-send chama a API na VPS.

---

## O que a Edge Function faz com isso

Ela chama:

```http
POST {WHATSAPP_API_URL}/message/sendText/{WHATSAPP_INSTANCE}
Header: apikey = WHATSAPP_API_KEY
Body: { "number": "5511999999999", "text": "mensagem", "delay": 1200 }
```

Ou seja: `POST http://TUA_URL:PORTA/message/sendText/aquimaq` com o body acima.  
O serviço na VPS (porta 47918 no teu caso) tem de estar a escutar e a aceitar este path e formato (ex.: n8n com Webhook nesse path).

---

## Resumo

- **Rota no .env** = só para referência local; as Edge Functions **não** a usam.
- **Correção** = copiar `WHATSAPP_API_URL`, `WHATSAPP_API_KEY` e `WHATSAPP_INSTANCE` do .env para **Edge Functions → Secrets** no Supabase.
- Depois faz **Redeploy** da function se precisar:  
  `npx supabase functions deploy whatsapp-send`
