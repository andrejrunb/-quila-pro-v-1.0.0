# 📊 Documentação do Banco de Dados - Sistema Áquila Pro

## Visão Geral

O Sistema Áquila Pro utiliza **MySQL/TiDB** como banco de dados principal, gerenciado através do **Drizzle ORM**. O banco contém 4 tabelas principais para gerenciar usuários, templates de mensagens, logs de comunicação e submissões de contato.

---

## 📋 Tabelas do Banco de Dados

### 1. **users** - Usuários do Sistema

Armazena informações de usuários autenticados via OAuth Manus.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|-----------|
| `id` | INT | Identificador único | PRIMARY KEY, AUTO_INCREMENT |
| `openId` | VARCHAR(64) | ID OAuth do Manus | UNIQUE, NOT NULL |
| `name` | TEXT | Nome completo do usuário | NULLABLE |
| `email` | VARCHAR(320) | Email do usuário | NULLABLE |
| `loginMethod` | VARCHAR(64) | Método de login (google, etc) | NULLABLE |
| `role` | ENUM | Papel do usuário | 'user' \| 'admin', DEFAULT 'user' |
| `createdAt` | TIMESTAMP | Data de criação | DEFAULT NOW() |
| `updatedAt` | TIMESTAMP | Data de atualização | DEFAULT NOW(), ON UPDATE NOW() |
| `lastSignedIn` | TIMESTAMP | Último acesso | DEFAULT NOW() |

**Índices:**
- `openId` (UNIQUE)

**Relacionamentos:**
- Referenciado por: `smsTemplates.createdBy`, `whatsappTemplates.createdBy`, `messageLogs.sentBy`, `contactSubmissions.respondedBy`

**Exemplo:**
```json
{
  "id": 1,
  "openId": "HMy8hfPMELY2EbpX6EME9p",
  "name": "Andre Jr",
  "email": "andrejrciencias@gmail.com",
  "loginMethod": "google",
  "role": "admin",
  "createdAt": "2026-02-27T01:21:13.000Z",
  "updatedAt": "2026-02-27T01:27:00.000Z",
  "lastSignedIn": "2026-02-27T01:27:00.000Z"
}
```

---

### 2. **sms_templates** - Templates de SMS

Armazena templates de mensagens SMS para diferentes tipos de alertas escolares.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|-----------|
| `id` | INT | Identificador único | PRIMARY KEY, AUTO_INCREMENT |
| `name` | VARCHAR(255) | Nome do template | NOT NULL |
| `description` | TEXT | Descrição do template | NULLABLE |
| `alertType` | ENUM | Tipo de alerta | 'unauthorized_exit' \| 'late_arrival' \| 'absence' \| 'health_incident' \| 'custom' |
| `content` | TEXT | Conteúdo da mensagem | NOT NULL |
| `variables` | TEXT | Variáveis disponíveis (JSON) | NULLABLE |
| `isActive` | INT | Status ativo/inativo | DEFAULT 1 |
| `createdBy` | INT | ID do usuário criador | NOT NULL, FOREIGN KEY → users.id |
| `createdAt` | TIMESTAMP | Data de criação | DEFAULT NOW() |
| `updatedAt` | TIMESTAMP | Data de atualização | DEFAULT NOW(), ON UPDATE NOW() |

**Tipos de Alertas:**
- `unauthorized_exit` - Saída não autorizada da escola
- `late_arrival` - Chegada atrasada
- `absence` - Ausência do aluno
- `health_incident` - Incidente de saúde
- `custom` - Template customizado

**Variáveis Disponíveis:**
```json
{
  "studentName": "Nome do aluno",
  "schoolName": "Nome da escola",
  "timestamp": "Data/hora do evento",
  "location": "Local do evento",
  "contactName": "Nome do responsável"
}
```

**Exemplo:**
```json
{
  "id": 1,
  "name": "Alerta de Saída Não Autorizada",
  "description": "Enviado quando um aluno sai da escola sem autorização",
  "alertType": "unauthorized_exit",
  "content": "Alerta: {{studentName}} saiu da escola às {{timestamp}}. Local: {{location}}",
  "variables": "{\"studentName\": \"string\", \"timestamp\": \"datetime\", \"location\": \"string\"}",
  "isActive": 1,
  "createdBy": 1,
  "createdAt": "2026-02-27T01:30:00.000Z",
  "updatedAt": "2026-02-27T01:30:00.000Z"
}
```

---

### 3. **whatsapp_templates** - Templates de WhatsApp

Armazena templates de mensagens WhatsApp para notificações e comunicados.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|-----------|
| `id` | INT | Identificador único | PRIMARY KEY, AUTO_INCREMENT |
| `name` | VARCHAR(255) | Nome do template | NOT NULL |
| `description` | TEXT | Descrição do template | NULLABLE |
| `notificationType` | ENUM | Tipo de notificação | 'attendance_confirmation' \| 'daily_report' \| 'alert' \| 'reminder' \| 'custom' |
| `content` | TEXT | Conteúdo da mensagem | NOT NULL |
| `variables` | TEXT | Variáveis disponíveis (JSON) | NULLABLE |
| `isActive` | INT | Status ativo/inativo | DEFAULT 1 |
| `createdBy` | INT | ID do usuário criador | NOT NULL, FOREIGN KEY → users.id |
| `createdAt` | TIMESTAMP | Data de criação | DEFAULT NOW() |
| `updatedAt` | TIMESTAMP | Data de atualização | DEFAULT NOW(), ON UPDATE NOW() |

**Tipos de Notificações:**
- `attendance_confirmation` - Confirmação de presença
- `daily_report` - Relatório diário
- `alert` - Alerta urgente
- `reminder` - Lembrete
- `custom` - Template customizado

**Exemplo:**
```json
{
  "id": 1,
  "name": "Confirmação de Presença",
  "description": "Enviado ao final do dia confirmando presença",
  "notificationType": "attendance_confirmation",
  "content": "Olá {{contactName}}! {{studentName}} compareceu normalmente à aula em {{schoolName}} hoje.",
  "variables": "{\"contactName\": \"string\", \"studentName\": \"string\", \"schoolName\": \"string\"}",
  "isActive": 1,
  "createdBy": 1,
  "createdAt": "2026-02-27T01:30:00.000Z",
  "updatedAt": "2026-02-27T01:30:00.000Z"
}
```

---

### 4. **message_logs** - Histórico de Mensagens

Registra todas as mensagens SMS e WhatsApp enviadas para auditoria e rastreamento.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|-----------|
| `id` | INT | Identificador único | PRIMARY KEY, AUTO_INCREMENT |
| `messageType` | ENUM | Tipo de mensagem | 'sms' \| 'whatsapp' |
| `templateId` | INT | ID do template usado | NULLABLE, FOREIGN KEY → sms_templates.id ou whatsapp_templates.id |
| `recipientPhone` | VARCHAR(20) | Número de telefone do destinatário | NOT NULL |
| `content` | TEXT | Conteúdo da mensagem enviada | NOT NULL |
| `status` | ENUM | Status da entrega | 'pending' \| 'sent' \| 'delivered' \| 'failed', DEFAULT 'pending' |
| `twilioSid` | VARCHAR(255) | ID da mensagem no Twilio | NULLABLE |
| `errorMessage` | TEXT | Mensagem de erro (se houver) | NULLABLE |
| `sentBy` | INT | ID do usuário que enviou | NOT NULL, FOREIGN KEY → users.id |
| `sentAt` | TIMESTAMP | Data/hora de envio | DEFAULT NOW() |
| `deliveredAt` | TIMESTAMP | Data/hora de entrega | NULLABLE |

**Status de Entrega:**
- `pending` - Aguardando envio
- `sent` - Enviado ao Twilio
- `delivered` - Entregue ao destinatário
- `failed` - Falha no envio

**Exemplo:**
```json
{
  "id": 1,
  "messageType": "sms",
  "templateId": 1,
  "recipientPhone": "+5511999999999",
  "content": "Alerta: João saiu da escola às 14:30. Local: Portaria",
  "status": "delivered",
  "twilioSid": "SM1234567890abcdef",
  "errorMessage": null,
  "sentBy": 1,
  "sentAt": "2026-02-27T14:30:00.000Z",
  "deliveredAt": "2026-02-27T14:30:05.000Z"
}
```

---

### 5. **contact_submissions** - Submissões de Contato

Armazena submissões do formulário de contato do site.

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|-----------|
| `id` | INT | Identificador único | PRIMARY KEY, AUTO_INCREMENT |
| `name` | VARCHAR(255) | Nome do contato | NOT NULL |
| `email` | VARCHAR(320) | Email do contato | NOT NULL |
| `phone` | VARCHAR(20) | Telefone do contato | NULLABLE |
| `schoolName` | VARCHAR(255) | Nome da escola | NULLABLE |
| `subject` | VARCHAR(255) | Assunto da mensagem | NOT NULL |
| `message` | TEXT | Conteúdo da mensagem | NOT NULL |
| `status` | ENUM | Status do contato | 'new' \| 'read' \| 'responded' \| 'archived', DEFAULT 'new' |
| `respondedBy` | INT | ID do admin que respondeu | NULLABLE, FOREIGN KEY → users.id |
| `responseMessage` | TEXT | Resposta do admin | NULLABLE |
| `createdAt` | TIMESTAMP | Data de submissão | DEFAULT NOW() |
| `respondedAt` | TIMESTAMP | Data de resposta | NULLABLE |

**Status:**
- `new` - Novo contato, não lido
- `read` - Contato lido
- `responded` - Resposta enviada
- `archived` - Arquivado

**Exemplo:**
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@escola.com.br",
  "phone": "+5511999999999",
  "schoolName": "Escola ABC",
  "subject": "Dúvida sobre implementação",
  "message": "Gostaria de saber mais sobre como implementar o sistema na minha escola.",
  "status": "responded",
  "respondedBy": 1,
  "responseMessage": "Obrigado pelo contato! Entraremos em breve com mais informações.",
  "createdAt": "2026-02-27T10:00:00.000Z",
  "respondedAt": "2026-02-27T11:30:00.000Z"
}
```

---

## 🔗 Relacionamentos

```
users (1) ──→ (N) sms_templates (createdBy)
users (1) ──→ (N) whatsapp_templates (createdBy)
users (1) ──→ (N) message_logs (sentBy)
users (1) ──→ (N) contact_submissions (respondedBy)
```

---

## 📊 Estatísticas do Banco

| Tabela | Registros Esperados | Tamanho Estimado |
|--------|-------------------|------------------|
| users | 10-100 | 50 KB |
| sms_templates | 10-50 | 100 KB |
| whatsapp_templates | 10-50 | 100 KB |
| message_logs | 1000-10000 | 5-50 MB |
| contact_submissions | 100-1000 | 500 KB - 5 MB |

---

## 🔐 Segurança

### Boas Práticas Implementadas:

1. **Autenticação OAuth** - Todos os usuários autenticados via Manus OAuth
2. **Controle de Acesso** - Tabelas `sms_templates`, `whatsapp_templates` e `contact_submissions` requerem autenticação
3. **Auditoria** - `message_logs` registra quem enviou cada mensagem
4. **LGPD Compliance** - Dados de contato armazenados com consentimento
5. **Criptografia** - Dados sensíveis (telefone) podem ser criptografados

### Recomendações:

- Implementar backup automático diário
- Usar SSL/TLS para conexões ao banco
- Implementar rate limiting para APIs
- Adicionar índices em campos frequentemente consultados

---

## 🚀 Migrações

As migrações são gerenciadas via **Drizzle Kit**:

```bash
# Gerar migrações
pnpm db:push

# Visualizar histórico
drizzle-kit studio
```

---

## 📝 Queries Comuns

### Listar todos os contatos novos:
```sql
SELECT * FROM contact_submissions 
WHERE status = 'new' 
ORDER BY createdAt DESC;
```

### Contar mensagens enviadas por dia:
```sql
SELECT DATE(sentAt) as dia, COUNT(*) as total 
FROM message_logs 
WHERE status = 'delivered' 
GROUP BY DATE(sentAt);
```

### Listar templates ativos:
```sql
SELECT * FROM sms_templates 
WHERE isActive = 1 
ORDER BY createdAt DESC;
```

### Histórico de respostas de um usuário:
```sql
SELECT cs.*, u.name as respondedByName 
FROM contact_submissions cs 
LEFT JOIN users u ON cs.respondedBy = u.id 
WHERE cs.respondedBy = ? 
ORDER BY cs.respondedAt DESC;
```

---

## 📞 Suporte

Para dúvidas sobre o banco de dados, consulte:
- Documentação Drizzle: https://orm.drizzle.team/
- Documentação Twilio: https://www.twilio.com/docs/
- Documentação MySQL: https://dev.mysql.com/doc/

---

**Última atualização:** 27 de Fevereiro de 2026
**Versão:** 1.0.0
