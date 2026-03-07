# WhatsApp Integration Architecture — Aquimaq

> ⚠️ **LEIA ANTES DE QUALQUER COISA**
>
> Esta stack **NÃO usa Evolution API, NÃO usa WPP Connect, NÃO usa Baileys Cloud, NÃO usa n8n**.
> É um servidor Node.js **custom**, feito do zero com Baileys + Fastify, rodando na VPS própria.
> Qualquer AI que assumir Evolution API e usar `/message/sendText/{instance}` ou header `apikey` vai quebrar tudo.

---

## Visão Geral

```
Cliente WhatsApp
      │
      ▼
 VPS Hostinger (72.61.60.210:47918)
 /opt/aquimaq-bot  ← Node.js + Baileys + Fastify
      │
      ├── mensagem recebida → POST Supabase Edge Function /whatsapp-inbound
      │         └── se human_mode=false → chama Edge Function /ai-chat → resposta via POST /message/send
      │
      └── API REST própria (Fastify) escuta requisições do Supabase
                └── quando admin envia → Supabase Edge Function /whatsapp-send → POST /message/send
```

---

## VPS — Servidor Baileys Custom

| Item | Valor |
|------|-------|
| **Localização** | `/opt/aquimaq-bot/` |
| **Linguagem** | TypeScript (Node.js) |
| **Porta** | `47918` |
| **Framework HTTP** | Fastify v4 |
| **WhatsApp lib** | `@whiskeysockets/baileys` v6 |
| **Fila** | BullMQ + Redis |
| **Auth** | Header `x-api-key` |

### Stack completa (`package.json`)
- `@whiskeysockets/baileys` — conexão direta com WhatsApp Web
- `fastify` — servidor HTTP que expõe a REST API para o Supabase
- `bullmq` + `ioredis` — fila de mensagens
- `openai` — IA (é o bot que responde no WhatsApp)
- `@prisma/client` — banco local PostgreSQL
- `pino` — logs

---

## API REST da VPS — Endpoints

Base URL: `http://72.61.60.210:47918`

Auth obrigatória em todos os endpoints (exceto `/qr` e `/health`):
```
Header: x-api-key: <WHATSAPP_API_KEY do .env>
```

### `POST /message/send` ← **ÚNICO endpoint para enviar mensagem**

```json
// Body (application/json)
{
  "phone": "5511999990000",   // só dígitos, sem espaço, sem @s.whatsapp.net
  "text": "Olá! Como posso ajudar?"
}
```

```json
// Response 200
{ "success": true }
```

> O servidor Baileys internamente converte `phone` → `phone@s.whatsapp.net` antes de chamar `sock.sendMessage()`.

### `GET /message/history/:phone`
Retorna histórico de mensagens de um telefone.

### `PATCH /message/handoff`
Atualiza o status de atendimento de uma sessão (ai/human/closed).

### `GET /health`
Health check sem autenticação.

---

## Formato do número de telefone

Sempre somente dígitos, com DDI:

```
✅ "5511999990000"   ← correto (Brasil DDI 55 + DDD + número)
❌ "+55 11 99999-0000"
❌ "5511999990000@s.whatsapp.net"
❌ "11999990000"     ← sem DDI
```

O campo `chat_conversations.contact_phone` no Supabase já é salvo assim pelo `whatsapp-inbound`.

---

## Edge Functions Supabase

### `whatsapp-inbound` (sem JWT)
- **Chamado por**: webhook do servidor Baileys na VPS quando chega mensagem
- **Faz**: salva mensagem no banco, cria/atualiza conversa, chama `ai-chat` se `human_mode=false`, envia resposta do bot via `POST /message/send`
- **Secrets necessários**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_API_URL`, `WHATSAPP_API_KEY`, `WHATSAPP_INSTANCE` (não usada no send, mas verificada), `AI_CHAT_INTERNAL_SECRET` (opcional)

### `whatsapp-send` (sem JWT, mas com auth manual)
- **Chamado por**: painel admin quando gerente/admin envia mensagem numa conversa WhatsApp
- **Faz**: verifica sessão do usuário, verifica se é admin/gerente/vendedor, chama `POST /message/send` na VPS, insere mensagem no banco com `delivery_status = sent/failed`
- **Secrets necessários**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_API_URL`, `WHATSAPP_API_KEY`, `WHATSAPP_INSTANCE`

> `WHATSAPP_INSTANCE` não é passado na chamada HTTP (o servidor Baileys tem sessão única `aquimaq`). É checado apenas para validar que a variável existe.

---

## Variáveis de Ambiente

### `.env` local (somente para scripts e referência):
```
WHATSAPP_API_URL=http://72.61.60.210:47918
WHATSAPP_API_KEY=BbDuAYlZTzUDYQ8pXbwEJitplz3Du9BG
WHATSAPP_INSTANCE=aquimaq
```

### Secrets no Supabase Dashboard (Edge Functions → Secrets):
Mesmas variáveis acima devem estar configuradas lá. Sem elas, `whatsapp-send` retorna 500.

Para configurar via CLI:
```bash
npx supabase secrets set \
  WHATSAPP_API_URL=http://72.61.60.210:47918 \
  WHATSAPP_API_KEY=BbDuAYlZTzUDYQ8pXbwEJitplz3Du9BG \
  WHATSAPP_INSTANCE=aquimaq \
  --project-ref bzicdqrbqykypzesxayw
```

---

## Fluxo Completo: Admin Envia Mensagem

```
1. Admin abre painel /admin/atendimento
2. Seleciona conversa WhatsApp → clica "Assumir"
   → claimConversation() → whatsapp_sessions.human_mode = true
3. Admin digita mensagem → clica Enviar
   → handleSend() → sendAdminMessage() → sendWhatsAppMessage()
   → fetch POST {SUPABASE_URL}/functions/v1/whatsapp-send
     Authorization: Bearer {access_token do admin logado}
     body: { conversation_id, content }
4. Edge Function whatsapp-send:
   a. Valida JWT → pega userId
   b. Checa role: deve ser admin/gerente/vendedor
   c. Busca contact_phone da conversation
   d. POST http://72.61.60.210:47918/message/send
      x-api-key: {WHATSAPP_API_KEY}
      body: { phone: contact_phone, text: content }
   e. Insere chat_messages com delivery_status = sent/failed
   f. Retorna 200 ou 502
5. Frontend recebe sucesso → getMessages() → renderiza msg na tela
```

## Fluxo Completo: Cliente Envia → Bot Responde

```
1. Cliente envia mensagem no WhatsApp
2. Baileys na VPS (sock.ev.on "messages.upsert") recebe
3. handleIncomingMessage() → checa human_mode no Supabase
4. Se human_mode = false:
   → POST {SUPABASE_URL}/functions/v1/whatsapp-inbound
     body: payload do Baileys (event, data.key, data.message, etc.)
5. whatsapp-inbound:
   a. Parseia payload
   b. Salva mensagem do cliente no banco
   c. Chama ai-chat Edge Function
   d. Recebe resposta da IA
   e. POST http://72.61.60.210:47918/message/send
      x-api-key: {WHATSAPP_API_KEY}
      body: { phone: phone, text: aiReply }
6. Bot responde no WhatsApp do cliente
```

---

## Deploy das Edge Functions

```bash
# Sempre com --no-verify-jwt (auth é feita manualmente no código)
npx supabase functions deploy whatsapp-send --project-ref bzicdqrbqykypzesxayw --no-verify-jwt
npx supabase functions deploy whatsapp-inbound --project-ref bzicdqrbqykypzesxayw --no-verify-jwt
```

---

## VPS — Acesso SSH

```bash
ssh -i C:\git_local\.ssh\id_ed25519_hostinger root@72.61.60.210

# Bot roda via PM2
pm2 list
pm2 logs aquimaq-bot
pm2 restart aquimaq-bot

# Código do bot
ls /opt/aquimaq-bot/src/
```
