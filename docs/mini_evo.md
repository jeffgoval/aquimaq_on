# WhatsApp API - Mini Evolution para Ecommerce

API de atendimento WhatsApp com agente IA (GPT-4o mini) e handoff para vendedor humano.

## Fluxo

```
Cliente manda mensagem
        ↓
   Baileys recebe
        ↓
   Salva no banco
        ↓
  IA processa (GPT-4o mini)
  com contexto do pedido
        ↓
  IA sabe responder?
   ↓ sim        ↓ não
Responde     Handoff → notifica vendedor via WhatsApp
```

## Stack

- **Fastify** — servidor HTTP
- **Baileys** — WhatsApp Web
- **BullMQ + Redis** — fila de mensagens persistida
- **PostgreSQL + Prisma** — banco de dados
- **GPT-4o mini** — agente IA
- **Pino** — logs

## Setup

### 1. Subir infraestrutura

```bash
docker-compose up -d
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
# editar .env com suas chaves
```

### 4. Rodar migrations

```bash
npm run db:migrate
```

### 5. Iniciar em desenvolvimento

```bash
npm run dev
```

Na primeira execução, um QR Code aparece no terminal — escaneie com o WhatsApp.

## Endpoints

Todos os endpoints exigem header `x-api-key`.

### Mensagens

```
POST /message/send
{
  "phone": "5511999999999",
  "text": "Seu pedido #123 foi confirmado!"
}

GET /message/history/:phone

PATCH /message/handoff
{
  "phone": "5511999999999",
  "status": "human" | "ai" | "closed"
}
```

### Sessões

```
GET  /session
GET  /session/:name
POST /session/:name/reconnect
```

### Health

```
GET /health
```

## Handoff automático

A IA detecta quando precisa transferir para humano e:
1. Envia mensagem ao cliente avisando da transferência
2. Notifica o vendedor via WhatsApp com dados do cliente
3. Pausa a IA — respostas humanas não passam pela IA

Para reativar a IA após atendimento humano:

```bash
PATCH /message/handoff
{ "phone": "5511999999999", "status": "ai" }
```

## Anti-ban

- Simula digitação antes de enviar (1–5s)
- Jitter aleatório entre mensagens (3–9s)
- Máximo 3 mensagens simultâneas no worker
- `markOnlineOnConnect: false`

## Integração com Ecommerce

Configure `ECOMMERCE_API_URL` e `ECOMMERCE_API_KEY` no `.env`.

A API busca dados de pedidos automaticamente quando o cliente menciona um número de pedido.

Endpoint esperado na sua API:
```
GET /orders/:id → { id, status, total, items, trackingCode }
```
