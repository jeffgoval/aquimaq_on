# Evolution API na VPS (Hostinger) para WhatsApp

Este documento descreve como colocar a **Evolution API** a correr numa VPS (ex.: Hostinger) para integrar o WhatsApp ao atendimento (chat com IA e handoff para vendedores).

## Visão geral

- **Evolution API**: servidor que conecta ao WhatsApp e expõe webhooks + API REST.
- **VPS**: hospeda a Evolution (ex.: Docker).
- **Supabase**: Edge Functions `whatsapp-inbound` (recebe webhook) e `whatsapp-send` (envia mensagem quando o vendedor responde).

Fluxo: **WhatsApp** ↔ **Evolution (VPS)** ↔ **Supabase** (whatsapp-inbound / ai-chat / whatsapp-send).

---

## 1. Requisitos na VPS

- Acesso SSH à VPS.
- Docker e Docker Compose instalados (ou seguir a documentação oficial da Evolution para instalação sem Docker).
- Porta 8080 (ou a que a Evolution usar) acessível; em produção use um proxy reverso (ex.: Nginx) com HTTPS e domínio.

---

## 2. Deploy da Evolution API

1. **Documentação oficial**: https://doc.evolution-api.com/
2. **Repositório**: https://github.com/EvolutionAPI/evolution-api

Exemplo com Docker (ajustar conforme a versão atual):

```bash
# Clone ou use a imagem oficial
docker pull atendai/evolution-api:latest

# Exemplo de execução (variáveis mínimas)
docker run -d \
  --name evolution \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY="sua-chave-segura" \
  -e WEBHOOK_GLOBAL_URL="https://SEU_PROJETO.supabase.co/functions/v1/whatsapp-inbound" \
  -e WEBHOOK_GLOBAL_ENABLED="true" \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT="true" \
  atendai/evolution-api:latest
```

Ou use Docker Compose com um ficheiro `docker-compose.yml` baseado na documentação da Evolution.

3. **Criar instância WhatsApp**: após o arranque, chamar a API da Evolution para criar uma instância e gerar o QR Code (ou pairing). A instância é um nome (ex.: `aquimaq`) que será usado em `EVOLUTION_INSTANCE`. (Ver documentação oficial da Evolution para o fluxo de conexão via dashboard ou API.)

4. **Configurar webhook** para a instância:
   - Evento: `MESSAGES_UPSERT` (mensagens recebidas).
   - URL: `https://<teu-projeto>.supabase.co/functions/v1/whatsapp-inbound`

A Evolution envia um payload em formato específico (evento + data.key, data.message, etc.). A função `whatsapp-inbound` já está preparada para aceitar esse formato.

---

## 3. Variáveis e secrets no Supabase

Configurar no **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets** (ou via CLI):

| Nome | Descrição |
|------|-----------|
| `EVOLUTION_API_URL` | URL base da API na VPS (ex.: `https://api.seudominio.com` ou `http://IP_VPS:8080`) |
| `EVOLUTION_API_KEY` | Chave de autenticação da Evolution (ex.: `AUTHENTICATION_API_KEY` usada no container) |
| `EVOLUTION_INSTANCE` | Nome da instância WhatsApp (ex.: `aquimaq`) |
| `AI_CHAT_INTERNAL_SECRET` | Secret partilhado para o whatsapp-inbound chamar o ai-chat sem JWT (valor aleatório seguro; definir o mesmo nas duas funções) |
| `WHATSAPP_INBOUND_SECRET` | (Opcional) Secret para validar assinatura do webhook no header `x-whatsapp-signature` |

---

## 4. Validação

1. **Webhook**: Enviar um POST de teste para `whatsapp-inbound` com um body no formato Evolution (evento `messages.upsert`, data.key, data.message) e confirmar que não retorna 400.
2. **WhatsApp real**: Enviar uma mensagem para o número ligado à Evolution e confirmar que a resposta da IA chega (e que a conversa aparece no Admin → Chat).
3. **Envio pelo vendedor**: No painel Admin, atribuir uma conversa WhatsApp a um vendedor e enviar uma mensagem; deve ser enviada via Evolution (`whatsapp-send`).

---

## 5. Resumo do fluxo

- Cliente envia mensagem no WhatsApp → Evolution recebe e envia POST para `whatsapp-inbound`.
- `whatsapp-inbound` parseia o payload Evolution, cria/atualiza conversa e sessão, chama `ai-chat` (com `_internal_secret`).
- `ai-chat` responde com RAG + produtos (estoque/preço) e pode acionar handoff (`request_human`); nesse caso a conversa passa a `waiting_human` (ou já é atribuída a um vendedor).
- Resposta da IA é enviada ao cliente via Evolution (`/message/sendText/{instance}`).
- Vendedor responde pelo Admin → `whatsapp-send` envia para o cliente via Evolution.
