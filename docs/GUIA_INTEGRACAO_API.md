# Guia Completo: Integração OpenAI e Twilio no Áquila Pro

## 📋 Índice
1. [OpenAI - Obter Chave de API](#openai)
2. [Twilio - Obter Chaves de API](#twilio)
3. [Configurar Variáveis de Ambiente](#env)
4. [Testar as Integrações](#teste)

---

## 🤖 OpenAI - Obter Chave de API {#openai}

### Passo 1: Criar Conta na OpenAI

1. Acesse [https://platform.openai.com](https://platform.openai.com)
2. Clique em **"Sign up"** (ou faça login se já tiver conta)
3. Preencha seus dados:
   - Email
   - Senha
   - Nome completo
4. Verifique seu email
5. Complete o perfil (empresa, caso de uso)

### Passo 2: Configurar Método de Pagamento

1. Vá para **Settings** → **Billing overview**
2. Clique em **"Add to paid account"**
3. Selecione **"Pay as you go"** (pague conforme usar)
4. Adicione um cartão de crédito válido
5. Defina um limite de gastos (recomendado: $10-50/mês)

**Importante:** A OpenAI oferece $5 de crédito gratuito nos primeiros 3 meses.

### Passo 3: Gerar Chave de API

1. Vá para **API keys** (https://platform.openai.com/api-keys)
2. Clique em **"Create new secret key"**
3. Escolha um nome descritivo (ex: "aquila-pro-production")
4. **Copie a chave imediatamente** (só aparece uma vez!)
5. Guarde em local seguro

**Formato da chave:**
```
sk-proj-abc123def456ghi789jkl012mno345pqr678stu
```

### Passo 4: Definir Limites de Uso (Opcional mas Recomendado)

1. Vá para **Settings** → **Usage limits**
2. Configure:
   - **Hard limit**: Máximo a gastar por mês
   - **Soft limit**: Alerta quando atingir este valor

### Modelos Disponíveis

| Modelo | Descrição | Custo |
|--------|-----------|-------|
| gpt-4o | Mais rápido e barato | $0.15/1M input tokens |
| gpt-4-turbo | Melhor qualidade | $0.03/1K input tokens |
| gpt-3.5-turbo | Básico | $0.0005/1K input tokens |

**Recomendação para Áquila Pro:** Use `gpt-4o` para análise de alertas e `gpt-3.5-turbo` para chatbot.

---

## 📱 Twilio - Obter Chaves de API {#twilio}

### Passo 1: Criar Conta na Twilio

1. Acesse [https://www.twilio.com/console](https://www.twilio.com/console)
2. Clique em **"Sign up"**
3. Preencha seus dados:
   - Email
   - Senha
   - Nome completo
   - Número de telefone (para verificação)
4. Verifique seu email e número de telefone
5. Complete o questionário sobre seu caso de uso

### Passo 2: Verificar Número de Telefone

1. Twilio enviará um SMS com código de verificação
2. Insira o código para confirmar
3. Você receberá $15 de crédito gratuito

### Passo 3: Obter Account SID e Auth Token

1. Vá para **Console** → **Account** (https://www.twilio.com/console)
2. Você verá:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: `your_auth_token_here`
3. **Copie ambos** (o token aparece apenas uma vez)

**Exemplo:**
```
Account SID: AC1234567890abcdef1234567890abcdef
Auth Token: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

### Passo 4: Comprar Número de Telefone Twilio

1. Vá para **Phone Numbers** → **Manage** → **Buy a Number**
2. Selecione o país (Brasil: +55)
3. Escolha um número com o prefixo desejado
4. Clique em **"Buy"** (custa $1 por mês)
5. O número será adicionado à sua conta

**Exemplo de número:**
```
+55 11 99999-9999
```

### Passo 5: Configurar Webhook para SMS Recebidos (Opcional)

1. Vá para **Phone Numbers** → **Manage** → **Active Numbers**
2. Clique no número que você comprou
3. Em **Messaging**, configure:
   - **A Message Comes In**: Webhook URL
   - **Request URL**: `https://seu-site.com/api/twilio/sms`
   - **HTTP Method**: POST

### Serviços Twilio Disponíveis

| Serviço | Descrição | Custo |
|---------|-----------|-------|
| SMS | Enviar/receber SMS | $0.0075/SMS |
| WhatsApp | Enviar via WhatsApp | $0.005/mensagem |
| Voice | Chamadas telefônicas | $0.013/minuto |
| Video | Videochamadas | $0.01/minuto |

**Recomendação para Áquila Pro:** Use SMS para alertas de segurança e WhatsApp para notificações aos pais.

---

## 🔐 Configurar Variáveis de Ambiente {#env}

### No Arquivo `.env` do Seu Projeto

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-seu_token_aqui
OPENAI_MODEL=gpt-4o
OPENAI_TEMPERATURE=0.7

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=seu_auth_token_aqui
TWILIO_PHONE_NUMBER=+55119999999999
TWILIO_WHATSAPP_NUMBER=whatsapp:+55119999999999

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aquila_pro

# App Settings
NODE_ENV=production
PORT=3000
```

### ⚠️ Segurança

- **NUNCA** commite o arquivo `.env` no Git
- Adicione `.env` ao `.gitignore`
- Use variáveis de ambiente no servidor de produção
- Rotacione as chaves regularmente

---

## 🧪 Testar as Integrações {#teste}

### Testar OpenAI

```bash
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-proj-seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Olá, como você está?"}
    ]
  }'
```

### Testar Twilio SMS

```bash
curl -X POST https://api.twilio.com/2010-04-01/Accounts/ACxxxxxxxxx/Messages.json \
  -u "ACxxxxxxxxx:seu_auth_token" \
  -d "To=+5511999999999" \
  -d "From=+5511988888888" \
  -d "Body=Teste de SMS do Áquila Pro"
```

### Testar Twilio WhatsApp

```bash
curl -X POST https://api.twilio.com/2010-04-01/Accounts/ACxxxxxxxxx/Messages.json \
  -u "ACxxxxxxxxx:seu_auth_token" \
  -d "To=whatsapp:+5511999999999" \
  -d "From=whatsapp:+5511988888888" \
  -d "Body=Teste de WhatsApp do Áquila Pro"
```

---

## 💡 Casos de Uso no Áquila Pro

### OpenAI
- **Análise de Alertas**: Gerar descrições automáticas de incidentes
- **Chatbot**: Responder perguntas sobre segurança escolar
- **Geração de Relatórios**: Criar resumos de dados de presença
- **Detecção de Anomalias**: Identificar padrões suspeitos

### Twilio
- **Alertas de Segurança**: SMS quando aluno sai sem autorização
- **Notificações aos Pais**: WhatsApp com atualizações de presença
- **Confirmação de Contato**: SMS para verificar número de telefone
- **Suporte ao Cliente**: Chatbot via WhatsApp

---

## 📞 Suporte

- **OpenAI**: https://help.openai.com
- **Twilio**: https://www.twilio.com/docs
- **Documentação OpenAI API**: https://platform.openai.com/docs
- **Documentação Twilio API**: https://www.twilio.com/docs/api

---

## ✅ Checklist de Implementação

- [ ] Criar conta OpenAI
- [ ] Adicionar método de pagamento OpenAI
- [ ] Gerar chave de API OpenAI
- [ ] Criar conta Twilio
- [ ] Comprar número de telefone Twilio
- [ ] Obter Account SID e Auth Token Twilio
- [ ] Configurar variáveis de ambiente
- [ ] Testar integração OpenAI
- [ ] Testar integração Twilio SMS
- [ ] Testar integração Twilio WhatsApp
- [ ] Implementar no backend do Áquila Pro
- [ ] Fazer deploy em produção

---

**Próximo Passo:** Após obter as chaves, vou criar os endpoints backend para integrar essas APIs ao seu site!
