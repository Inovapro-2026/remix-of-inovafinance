# 🤖 GUIA DE INTEGRAÇÃO - WhatsApp JS no INOVAFINANCE

## Mensagem para o Gemini / IA de Desenvolvimento

---

## 🎯 OBJETIVO

Integrar o **WhatsApp Web JS** ao sistema **INOVAFINANCE**, que roda totalmente em Docker, para envio automático de notificações de:

- ⏰ Rotinas (15 minutos antes)
- 📅 Eventos da Agenda
- 🔔 Lembretes de produtividade
- 📊 Resumos diários
- 🤖 Dicas da IA INOVA

---

## 🧩 ARQUITETURA OBRIGATÓRIA

O WhatsApp **NÃO** deve rodar dentro do backend principal.

Deve rodar em **container separado**:

```yaml
services:
  inovafinance-whatsapp:
    build: ./whatsapp-bot
    container_name: inovafinance-whatsapp
    restart: unless-stopped
    volumes:
      - ./auth_info_baileys:/app/auth_info_baileys
    environment:
      - PORT=3001
      - SUPABASE_URL=https://xxx.supabase.co
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
```

---

## 📦 STACK TECNOLÓGICA

| Tecnologia | Versão | Função |
|------------|--------|--------|
| Node.js | 18+ | Runtime |
| whatsapp-web.js | ^1.x | Cliente WhatsApp |
| puppeteer | incluído | Navegador headless |
| chromium | stable | Browser |
| express | ^4.x | API HTTP |
| node-cron | ^3.x | Scheduler |
| @supabase/supabase-js | ^2.x | Banco de dados |

---

## 📁 VOLUME OBRIGATÓRIO

A sessão do WhatsApp **DEVE** ser persistida:

```yaml
volumes:
  - ./auth_info_baileys:/app/auth_info_baileys
```

**Sem isso, o QR Code será solicitado a cada restart!**

---

## 🔌 API ENDPOINTS

### 1. Enviar Mensagem
```http
POST /send
Content-Type: application/json

{
  "phone": "5511999999999",
  "message": "Sua mensagem aqui"
}
```

**Resposta:**
```json
{
  "success": true,
  "messageId": "msg_xxx",
  "queued": true
}
```

### 2. Status do Bot
```http
GET /status
```

**Resposta:**
```json
{
  "status": "online",
  "whatsapp": "CONNECTED",
  "ready": true,
  "authenticated": true,
  "info": {
    "number": "5511999999999",
    "name": "INOVAFINANCE Bot"
  },
  "queue": {
    "total": 0,
    "pending": 0
  }
}
```

### 3. QR Code
```http
GET /qr
```

### 4. Testar Notificação
```http
POST /test-notification
Content-Type: application/json

{
  "user_matricula": 617011
}
```

### 5. Ver Fila
```http
GET /queue
```

### 6. Debug Scheduler
```http
GET /test-scheduler
```

---

## 🔗 COMUNICAÇÃO ENTRE CONTAINERS

```
INOVAFINANCE (backend)
        ↓
http://inovafinance-whatsapp:3001/send
        ↓
WhatsApp Web JS (container separado)
        ↓
WhatsApp do Usuário
```

### ⚠️ IMPORTANTE:
- **NUNCA** usar `localhost` entre containers
- **SEMPRE** usar o nome do serviço do docker-compose
- Exemplo: `http://inovafinance-whatsapp:3001`

---

## 🔧 SISTEMA DE FILA (QUEUE)

O bot implementa uma fila inteligente de mensagens:

```javascript
class MessageQueue {
    add(phone, message, metadata)  // Adiciona à fila
    processQueue()                  // Processa pendentes
    normalizePhone(phone)          // Formata número
    getStatus()                    // Retorna status
}
```

### Características:
- ✅ Retry automático (até 3 tentativas)
- ✅ Delay entre tentativas (5 segundos)
- ✅ Log de sucesso/falha
- ✅ Não perde mensagens em restart

---

## ⏱️ TIMEZONE

**SEMPRE** usar `America/Sao_Paulo`:

```javascript
function getBrazilTime() {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { 
        timeZone: 'America/Sao_Paulo' 
    }));
}
```

### Formato de horário no banco:
- `hora`: `"08:30:00"` (HH:MM:SS)
- `data`: `"2026-01-23"` (YYYY-MM-DD)

---

## 📱 FORMATO DO NÚMERO DE TELEFONE

### Entrada aceita:
- `11999999999`
- `5511999999999`
- `(11) 99999-9999`
- `+55 11 99999-9999`

### Formato final:
```
5511999999999@c.us
```

### Função de normalização:
```javascript
normalizePhone(phone) {
    let normalized = String(phone).replace(/\D/g, '');
    if (!normalized.startsWith('55')) {
        normalized = '55' + normalized;
    }
    return normalized + '@c.us';
}
```

---

## 🔔 TIPOS DE NOTIFICAÇÃO

### 1. Rotina em 15 minutos
```
🔔 *INOVAFINANCE*

Sua rotina começa em *15 minutos*:

📌 *ACORDAR*
⏰ Horário: 05:00
📂 Categoria: pessoal

💡 Mantenha o foco e boa produtividade! 🚀
```

### 2. Evento da Agenda
```
🔔 *INOVAFINANCE*

Seu compromisso começa em *15 minutos*:

📌 *Reunião com Cliente*
⏰ Horário: 14:00
📅 Data: 2026-01-23

Não se atrase! 🎯
```

### 3. Teste
```
🧪 *TESTE INOVAFINANCE*

Esta é uma notificação de teste.

✅ Se você recebeu esta mensagem, o sistema está funcionando corretamente!

🕐 Horário: 22:35:00
📅 Data: 2026-01-22
```

---

## 🔄 FLUXO COMPLETO DE ENVIO

```
1. Scheduler detecta rotina/evento
         ↓
2. Faltam 15 minutos para o horário
         ↓
3. Verifica se usuário tem WhatsApp ativo
         ↓
4. Monta mensagem formatada
         ↓
5. Adiciona à fila (Queue)
         ↓
6. Verifica se client está pronto
         ↓
7. Envia mensagem
         ↓
8. Retry se falhar (até 3x)
         ↓
9. Log de sucesso/falha
         ↓
10. Atualiza contador no banco
```

---

## 🔒 ESTADO GLOBAL

```javascript
let isClientReady = false;        // Só envia se TRUE
let isClientAuthenticated = false; // Sessão válida
let clientStatus = 'INITIALIZING'; // Status atual
let connectionAttempts = 0;       // Tentativas de reconexão
```

### Estados possíveis:
- `INITIALIZING` - Iniciando
- `WAITING_QR_SCAN` - Aguardando QR
- `AUTHENTICATED` - Autenticado
- `CONNECTED` - Pronto para enviar
- `DISCONNECTED` - Desconectado
- `AUTH_FAILURE` - Falha na autenticação

---

## 🔁 RECONEXÃO AUTOMÁTICA

```javascript
client.on('disconnected', async (reason) => {
    connectionAttempts++;
    
    if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(connectionAttempts * 5000, 30000);
        
        setTimeout(() => {
            client.initialize();
        }, delay);
    }
});
```

### Comportamento:
- Tenta até 10 vezes
- Delay progressivo (5s, 10s, 15s... até 30s)
- Log de cada tentativa

---

## 🧪 TESTES OBRIGATÓRIOS

Após deploy, verificar:

1. **Envio manual** - POST /send
2. **Envio automático** - Criar rotina e aguardar
3. **App fechado** - Funciona sem frontend
4. **Frontend fechado** - Funciona sem browser
5. **Docker restart** - `docker-compose restart`
6. **WhatsApp desconectado** - Reconecta automático
7. **Fila de mensagens** - GET /queue

---

## 📊 TABELA DO BANCO DE DADOS

### user_whatsapp_settings
```sql
CREATE TABLE user_whatsapp_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_matricula INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    total_notifications_sent INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## ✅ CHECKLIST DE PRODUÇÃO

- [ ] Container Docker rodando
- [ ] Volume persistente configurado
- [ ] QR Code escaneado
- [ ] Status = CONNECTED
- [ ] Endpoint /send funcionando
- [ ] Scheduler ativo (cron a cada minuto)
- [ ] Timezone America/Sao_Paulo
- [ ] Usuários com WhatsApp cadastrado
- [ ] Rotinas/Agenda com horários corretos
- [ ] Logs visíveis no container

---

## 🐳 COMANDOS ÚTEIS

```bash
# Ver logs em tempo real
docker logs -f inovafinance-whatsapp

# Reiniciar container
docker-compose restart inovafinance-whatsapp

# Rebuild completo
docker-compose up -d --build inovafinance-whatsapp

# Testar status
curl https://inovabank.inovapro.cloud/whatsapp-api/status

# Testar envio
curl -X POST https://inovabank.inovapro.cloud/whatsapp-api/test-notification \
  -H "Content-Type: application/json" \
  -d '{"user_matricula": 617011}'
```

---

## 🚀 RESULTADO FINAL ESPERADO

O WhatsApp deve funcionar como:

- ✅ Serviço independente
- ✅ Confiável (retry automático)
- ✅ Persistente (sessão salva)
- ✅ Automático (scheduler)
- ✅ Sem perda de mensagens (fila)
- ✅ Pronto para escala SaaS
