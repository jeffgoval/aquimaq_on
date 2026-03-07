# WhatsApp: .env e VPS — checklist para corrigir

O envio do admin (whatsapp-send) e a resposta do bot (whatsapp-inbound) dependem de variáveis no **Supabase** e, se aplicável, na **VPS**.

---

## 1. .env na raiz do projeto (frontend)

Copia `.env.example` para `.env` e preenche:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   # Dashboard → Settings → API
```

Opcional (CTAs de WhatsApp no site):

```env
VITE_WHATSAPP_NUMBER=5511999999999
```

---

## 2. Secrets das Edge Functions (Supabase)

No **Dashboard Supabase** → **Project Settings** → **Edge Functions** → **Secrets**, configura:

| Secret | Onde é usado | Descrição |
|--------|----------------|-----------|
| `SUPABASE_URL` | várias functions | `https://SEU_PROJECT_REF.supabase.co` |
| `SUPABASE_ANON_KEY` | whatsapp-send (auth) | Chave anon do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | todas que acedem ao DB | Service role key (nunca no frontend) |
| `WHATSAPP_API_URL` | whatsapp-send, whatsapp-inbound | URL base da API de envio na **tua VPS** (ex: `https://tua-vps.com:8080` ou `http://IP:3000`) |
| `WHATSAPP_API_KEY` | whatsapp-send, whatsapp-inbound | API key que a tua API na VPS exige (header `apikey`) |
| `WHATSAPP_INSTANCE` | whatsapp-send, whatsapp-inbound | Nome/ID da instância WhatsApp (ex: `aquimaq`) |
| `WHATSAPP_INBOUND_SECRET` | whatsapp-inbound | Segredo para validar `x-whatsapp-signature` (HMAC do body) |
| `WHATSAPP_ALLOWED_ORIGINS` | whatsapp-inbound | Origens permitidas, separadas por vírgula (ex: `https://tua-vps.com`) |
| `AI_CHAT_INTERNAL_SECRET` | whatsapp-inbound, ai-chat | Segredo interno para chamadas entre functions |

Sem `WHATSAPP_API_URL`, `WHATSAPP_API_KEY` e `WHATSAPP_INSTANCE`, a Edge Function **whatsapp-send** devolve erro e o admin não consegue enviar mensagem.

---

## 3. VPS — o que precisa existir

A Edge Function **whatsapp-send** faz:

```http
POST {WHATSAPP_API_URL}/message/sendText/{WHATSAPP_INSTANCE}
Content-Type: application/json
apikey: {WHATSAPP_API_KEY}

{
  "number": "5511999999999",
  "text": "mensagem",
  "delay": 1200
}
```

Na **VPS** precisas de:

1. **Um serviço a correr** (Node, n8n, script, etc.) que:
   - escute nesse path (ou um que tu definas),
   - aceite o body `number`, `text` (e opcionalmente `delay`),
   - envie a mensagem para o WhatsApp (Baileys, API oficial, etc.).

2. **Configurar os secrets** do Supabase com:
   - `WHATSAPP_API_URL` = URL desse serviço (ex: `http://localhost:3001` só não funciona a partir do Supabase; usa IP público ou domínio).
   - `WHATSAPP_API_KEY` = o valor que esse serviço espera no header `apikey`.
   - `WHATSAPP_INSTANCE` = o identificador da instância que esse serviço usa.

Se na VPS **não** tens um HTTP que faz o envio, tens de criar um (ex: pequeno servidor Node que recebe o POST e chama Baileys, ou um flow no n8n com Webhook + envio WhatsApp).

---

## 4. Resumo rápido

- **.env (raiz):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (e opcionalmente `VITE_WHATSAPP_NUMBER`).
- **Supabase → Edge Functions → Secrets:**  
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,  
  `WHATSAPP_API_URL`, `WHATSAPP_API_KEY`, `WHATSAPP_INSTANCE`,  
  `WHATSAPP_INBOUND_SECRET`, `WHATSAPP_ALLOWED_ORIGINS`, `AI_CHAT_INTERNAL_SECRET`.
- **VPS:** Serviço HTTP que aceite `POST .../message/sendText/{instance}` com body `{ number, text, delay }` e envie para o WhatsApp.

Depois de corrigir .env, secrets e o serviço na VPS, o fluxo do admin (assumir conversa e enviar mensagem) deve funcionar.
