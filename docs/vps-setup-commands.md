# Comandos para executar NA TUA VPS (tu acedes por SSH)

Ninguém consegue aceder à tua VPS por ti. Executa estes passos **dentro da VPS** (via SSH).

---

## 1. Entrar na VPS

No teu computador:

```bash
ssh utilizador@IP_DA_TUA_VPS
# ou
ssh utilizador@teu-dominio.com
```

(Substitui `utilizador` e `IP_DA_TUA_VPS` / `teu-dominio.com` pelos teus dados.)

---

## 2. Ver o que está a correr (portas, processos)

```bash
# Serviços a escutar em portas
sudo ss -tlnp
# ou
sudo netstat -tlnp

# Processos com "node" ou "whatsapp" ou "n8n"
ps aux | grep -E "node|whatsapp|n8n"
```

Assim vês se já tens algum serviço de WhatsApp e em que porta.

---

## 3. Onde está o teu projeto / env?

```bash
# Procurar ficheiros .env
sudo find / -name ".env" -type f 2>/dev/null | head -20

# Procurar pastas com "whatsapp" ou "aquimaq"
sudo find /home /opt /var -maxdepth 4 -type d -iname "*whatsapp*" 2>/dev/null
sudo find /home /opt /var -maxdepth 4 -type d -iname "*aquimaq*" 2>/dev/null
```

---

## 4. Supabase Edge Function precisa destes secrets

Isto **não** é na VPS — é no **Dashboard do Supabase** (Project Settings → Edge Functions → Secrets):

| Nome do Secret | Valor (exemplo) |
|----------------|-----------------|
| `SUPABASE_URL` | `https://TEU_PROJECT.supabase.co` |
| `SUPABASE_ANON_KEY` | (copiar do Dashboard → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | (copiar do Dashboard → API) |
| `WHATSAPP_API_URL` | URL do teu serviço na VPS, ex: `http://TEU_IP:3001` ou `https://wa.tudominio.com` |
| `WHATSAPP_API_KEY` | Uma password que definires (a mesma que o servidor na VPS vai exigir) |
| `WHATSAPP_INSTANCE` | Nome da instância, ex: `aquimaq` |

---

## 5. Se ainda não tens nenhum servidor de envio na VPS

A Edge Function `whatsapp-send` faz:

```
POST {WHATSAPP_API_URL}/message/sendText/{WHATSAPP_INSTANCE}
Header: apikey = WHATSAPP_API_KEY
Body: { "number": "5511999999999", "text": "ola", "delay": 1200 }
```

Precisas de um processo na VPS que:
1. Escute nessa URL (ou que redireciones para ela).
2. Receba o body e envie a mensagem pelo WhatsApp (via Baileys, n8n, ou outra API que uses).

Se usas **n8n**: cria um flow com Webhook que receba esse POST e um nó que envie para o WhatsApp.

Se usas **Baileys** ou outro script: esse script tem de expor um HTTP (Express, etc.) nesse path e com verificação do header `apikey`.

---

## Resumo

- **Aceder à VPS:** só tu, com `ssh utilizador@IP`.
- **Corrigir .env / serviços:** na VPS, depois de entrares.
- **Corrigir secrets:** no Supabase Dashboard, não na VPS.
- **Servidor de envio:** tem de estar a correr na VPS e a aceitar o POST acima.

Se disseres como envias hoje o WhatsApp na VPS (n8n, Node+Baileys, outro), posso escrever o servidor mínimo e os comandos exatos para o instalar e correr.
