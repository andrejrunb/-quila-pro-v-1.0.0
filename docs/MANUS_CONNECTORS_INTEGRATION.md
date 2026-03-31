# 🔌 Conectores Manus Recomendados - Áquila Pro

## Visão Geral

Este documento lista os conectores Manus que fazem sentido para integrar no Sistema Áquila Pro, com casos de uso específicos e exemplos de implementação.

---

## ✅ Conectores Recomendados (ALTA PRIORIDADE)

### 1. **SendGrid / Mailgun** - Envio de Emails

**Status:** ⭐⭐⭐⭐⭐ ALTAMENTE RECOMENDADO

**Por quê?**
- Formulário de contato precisa enviar confirmação por email
- Alertas de segurança devem ser notificados por email
- Relatórios diários podem ser enviados por email
- Notificações de resposta de contato

**Casos de Uso:**

```typescript
// 1. Confirmação de Contato
await sendEmail({
  to: "joao@escola.com.br",
  subject: "Recebemos seu contato - Áquila Pro",
  template: "contact_confirmation",
  data: {
    name: "João Silva",
    subject: "Dúvida sobre implementação",
    ticketId: "TKT-001"
  }
});

// 2. Alerta de Segurança
await sendEmail({
  to: "admin@escola.com.br",
  subject: "🚨 ALERTA: Saída não autorizada detectada",
  template: "security_alert",
  data: {
    studentName: "Carlos Silva",
    timestamp: "14:30",
    location: "Portaria",
    cameraId: "CAM-001"
  }
});

// 3. Relatório Diário
await sendEmail({
  to: "admin@escola.com.br",
  subject: "Relatório Diário - Áquila Pro",
  template: "daily_report",
  data: {
    totalStudents: 450,
    presentStudents: 445,
    absentStudents: 5,
    alerts: 3,
    date: "2026-02-27"
  }
});

// 4. Resposta de Contato
await sendEmail({
  to: "joao@escola.com.br",
  subject: "Resposta: Dúvida sobre implementação",
  template: "contact_response",
  data: {
    name: "João Silva",
    response: "Obrigado pelo contato! Entraremos em breve...",
    respondedBy: "André Jr"
  }
});
```

**Implementação:**

```typescript
// server/integrations/email.ts
import { sendEmail } from "@manus/sendgrid-connector";

export async function sendContactConfirmation(contact: ContactSubmission) {
  return await sendEmail({
    to: contact.email,
    subject: "Recebemos seu contato - Áquila Pro",
    htmlContent: `
      <h2>Olá ${contact.name}!</h2>
      <p>Recebemos sua mensagem sobre: <strong>${contact.subject}</strong></p>
      <p>Entraremos em contato em breve.</p>
      <p>Ticket: #${contact.id}</p>
    `
  });
}

export async function sendSecurityAlert(alert: SecurityAlert) {
  return await sendEmail({
    to: alert.schoolEmail,
    subject: `🚨 ALERTA: ${alert.title}`,
    htmlContent: `
      <h2>Alerta de Segurança</h2>
      <p><strong>Aluno:</strong> ${alert.studentName}</p>
      <p><strong>Hora:</strong> ${alert.timestamp}</p>
      <p><strong>Local:</strong> ${alert.location}</p>
      <p><strong>Câmera:</strong> ${alert.cameraId}</p>
    `
  });
}
```

**Banco de Dados:**

```sql
CREATE TABLE email_logs (
  id INT PRIMARY KEY,
  recipient_email VARCHAR(320),
  subject VARCHAR(255),
  email_type ENUM('contact_confirmation', 'security_alert', 'daily_report', 'contact_response'),
  status ENUM('pending', 'sent', 'failed'),
  sent_at TIMESTAMP,
  error_message TEXT
);
```

---

### 2. **Google Sheets / Airtable** - Exportação de Dados

**Status:** ⭐⭐⭐⭐ MUITO RECOMENDADO

**Por quê?**
- Exportar contatos para análise em planilha
- Compartilhar relatórios com stakeholders
- Integração com ferramentas de BI
- Backup automático de dados

**Casos de Uso:**

```typescript
// 1. Exportar Contatos para Google Sheets
await exportToGoogleSheets({
  spreadsheetId: "1a2b3c4d5e6f7g8h9i0j",
  sheetName: "Contatos",
  data: contacts.map(c => ({
    Nome: c.name,
    Email: c.email,
    Telefone: c.phone,
    Escola: c.schoolName,
    Assunto: c.subject,
    Status: c.status,
    Data: c.createdAt
  }))
});

// 2. Exportar Relatório de Presença
await exportToGoogleSheets({
  spreadsheetId: "1a2b3c4d5e6f7g8h9i0j",
  sheetName: "Presença",
  data: attendanceData.map(a => ({
    Aluno: a.studentName,
    Data: a.date,
    Presente: a.isPresent ? "Sim" : "Não",
    Hora: a.timestamp,
    Câmera: a.cameraId
  }))
});

// 3. Exportar Alertas
await exportToGoogleSheets({
  spreadsheetId: "1a2b3c4d5e6f7g8h9i0j",
  sheetName: "Alertas",
  data: alerts.map(a => ({
    Tipo: a.type,
    Aluno: a.studentName,
    Data: a.timestamp,
    Local: a.location,
    Prioridade: a.priority,
    Status: a.status
  }))
});
```

**Implementação:**

```typescript
// server/integrations/sheets.ts
import { GoogleSheetsConnector } from "@manus/google-sheets-connector";

const sheetsConnector = new GoogleSheetsConnector({
  apiKey: process.env.GOOGLE_SHEETS_API_KEY,
  spreadsheetId: process.env.GOOGLE_SHEETS_ID
});

export async function exportContactsToSheets(contacts: ContactSubmission[]) {
  const rows = contacts.map(c => [
    c.name,
    c.email,
    c.phone,
    c.schoolName,
    c.subject,
    c.status,
    c.createdAt.toISOString()
  ]);

  return await sheetsConnector.appendRows("Contatos", rows);
}

export async function exportDailyReport(date: Date) {
  const report = await generateDailyReport(date);
  
  return await sheetsConnector.appendRows("Relatórios", [
    [
      date.toISOString(),
      report.totalStudents,
      report.presentStudents,
      report.absentStudents,
      report.alertsCount,
      report.averageAttendance
    ]
  ]);
}
```

---

### 3. **Slack** - Notificações em Tempo Real

**Status:** ⭐⭐⭐⭐ MUITO RECOMENDADO

**Por quê?**
- Alertas de segurança em tempo real
- Notificações de novos contatos
- Avisos de sistema (erros, manutenção)
- Comunicação com equipe admin

**Casos de Uso:**

```typescript
// 1. Alerta de Segurança Urgente
await sendSlackAlert({
  channel: "#security-alerts",
  severity: "critical",
  title: "🚨 Saída Não Autorizada Detectada",
  message: `
    **Aluno:** Carlos Silva
    **Hora:** 14:30
    **Local:** Portaria
    **Câmera:** CAM-001
    **Ação:** Verifique imediatamente
  `,
  color: "#FF0000"
});

// 2. Novo Contato Recebido
await sendSlackAlert({
  channel: "#new-contacts",
  severity: "info",
  title: "📧 Novo Contato Recebido",
  message: `
    **Nome:** João Silva
    **Email:** joao@escola.com.br
    **Assunto:** Dúvida sobre implementação
    **Escola:** Escola ABC
  `,
  color: "#0099FF"
});

// 3. Resumo Diário
await sendSlackAlert({
  channel: "#daily-summary",
  severity: "info",
  title: "📊 Resumo do Dia",
  message: `
    **Alunos Presentes:** 445/450 (98.9%)
    **Alertas:** 3
    **Contatos:** 2
    **Câmeras Ativas:** 12/12
  `,
  color: "#00AA00"
});
```

**Implementação:**

```typescript
// server/integrations/slack.ts
import { SlackConnector } from "@manus/slack-connector";

const slackConnector = new SlackConnector({
  webhookUrl: process.env.SLACK_WEBHOOK_URL
});

export async function notifySecurityAlert(alert: SecurityAlert) {
  return await slackConnector.sendMessage({
    channel: "#security-alerts",
    text: `🚨 ALERTA: ${alert.title}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🚨 Alerta de Segurança" }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Aluno:*\n${alert.studentName}` },
          { type: "mrkdwn", text: `*Hora:*\n${alert.timestamp}` },
          { type: "mrkdwn", text: `*Local:*\n${alert.location}` },
          { type: "mrkdwn", text: `*Câmera:*\n${alert.cameraId}` }
        ]
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Ver Detalhes" },
            url: `https://aquilapro.com/alerts/${alert.id}`
          }
        ]
      }
    ]
  });
}

export async function notifyNewContact(contact: ContactSubmission) {
  return await slackConnector.sendMessage({
    channel: "#new-contacts",
    text: `📧 Novo contato de ${contact.name}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Novo Contato*\n${contact.name} (${contact.email})\n${contact.subject}`
        }
      }
    ]
  });
}
```

---

### 4. **Twilio** - SMS/WhatsApp (JÁ INTEGRADO)

**Status:** ⭐⭐⭐⭐⭐ JÁ IMPLEMENTADO

**Já está em uso para:**
- Alertas de segurança via SMS
- Notificações de presença via WhatsApp
- Confirmação de contato via SMS
- Relatórios diários via WhatsApp

---

### 5. **OpenAI** - IA e Processamento (JÁ INTEGRADO)

**Status:** ⭐⭐⭐⭐⭐ JÁ IMPLEMENTADO

**Já está em uso para:**
- Análise de alertas com IA
- Geração de resumos
- Chatbot inteligente
- Detecção de anomalias

---

## ⚠️ Conectores Recomendados (MÉDIA PRIORIDADE)

### 6. **Stripe / PagSeguro** - Pagamentos

**Status:** ⭐⭐⭐ RECOMENDADO

**Por quê?**
- Cobrar por planos de assinatura
- Pagamento de implementação
- Suporte premium

**Casos de Uso:**

```typescript
// 1. Criar Plano de Assinatura
const subscription = await stripeConnector.createSubscription({
  customerId: school.id,
  planId: "plan_essencial",
  price: 299.90,
  interval: "month"
});

// 2. Processar Pagamento
const payment = await stripeConnector.createPayment({
  amount: 5000, // $50.00
  currency: "BRL",
  description: "Implementação do Áquila Pro",
  customerId: school.id
});

// 3. Webhook de Pagamento Confirmado
app.post("/webhooks/stripe", async (req, res) => {
  const event = req.body;
  
  if (event.type === "payment_intent.succeeded") {
    const schoolId = event.data.object.metadata.schoolId;
    await activateSchoolSubscription(schoolId);
  }
});
```

---

### 7. **Calendly / Google Calendar** - Agendamento

**Status:** ⭐⭐⭐ RECOMENDADO

**Por quê?**
- Agendar demonstrações do sistema
- Agendar treinamentos
- Agendar reuniões de implementação

**Casos de Uso:**

```typescript
// 1. Criar Evento de Demonstração
await calendarConnector.createEvent({
  title: "Demonstração Áquila Pro",
  description: "Demonstração do sistema para Escola ABC",
  startTime: "2026-03-15T14:00:00",
  duration: 60,
  attendees: ["joao@escola.com.br", "admin@aquilapro.com"],
  meetingUrl: "https://meet.google.com/xyz"
});

// 2. Enviar Convite
await calendarConnector.sendInvite({
  email: "joao@escola.com.br",
  eventId: "event_123"
});
```

---

### 8. **GitHub** - Versionamento

**Status:** ⭐⭐⭐ RECOMENDADO

**Por quê?**
- Backup automático do código
- Histórico de alterações
- Colaboração entre desenvolvedores
- CI/CD integrado

**Já está em uso:**
- Repositório sincronizado com Manus

---

## 🤔 Conectores NÃO Recomendados (BAIXA PRIORIDADE)

### ❌ Zapier / Make
**Por quê não?** - Manus já oferece integrações nativas, Zapier seria redundante

### ❌ Salesforce
**Por quê não?** - Áquila Pro é específico para educação, não precisa de CRM genérico

### ❌ HubSpot
**Por quê não?** - Mesmo motivo que Salesforce

### ❌ Jira / Asana
**Por quê não?** - Pode ser útil para gerenciamento interno, mas não essencial

---

## 📊 Matriz de Priorização

| Conector | Prioridade | Impacto | Esforço | ROI | Status |
|----------|-----------|--------|--------|-----|--------|
| SendGrid | ALTA | Alto | Baixo | Alto | ✅ Recomendado |
| Google Sheets | ALTA | Alto | Médio | Alto | ✅ Recomendado |
| Slack | ALTA | Alto | Baixo | Alto | ✅ Recomendado |
| Stripe | MÉDIA | Alto | Médio | Médio | ⚠️ Futuro |
| Calendly | MÉDIA | Médio | Baixo | Médio | ⚠️ Futuro |
| GitHub | MÉDIA | Alto | Baixo | Alto | ✅ Já integrado |
| Twilio | ALTA | Alto | Baixo | Alto | ✅ Já integrado |
| OpenAI | ALTA | Alto | Médio | Alto | ✅ Já integrado |

---

## 🚀 Plano de Implementação

### Fase 1: Imediato (Próximas 2 semanas)
```
1. SendGrid - Confirmação de contatos e alertas por email
2. Google Sheets - Exportação de dados
3. Slack - Notificações em tempo real
```

### Fase 2: Curto Prazo (1-2 meses)
```
1. Stripe - Sistema de pagamentos
2. Calendly - Agendamento de demos
```

### Fase 3: Médio Prazo (2-3 meses)
```
1. Integração com sistemas escolares (API)
2. Integração com plataformas de LMS
```

---

## 💻 Exemplo de Implementação Completa

### Cenário: Novo Contato Recebido

```
1. Usuário preenche formulário de contato
   ↓
2. Backend valida e salva no banco
   ↓
3. SendGrid envia confirmação por email ao usuário
   ↓
4. Slack notifica admin em #new-contacts
   ↓
5. Google Sheets atualiza planilha de contatos
   ↓
6. Twilio envia SMS ao admin (opcional)
   ↓
7. Sistema aguarda resposta do admin
   ↓
8. Admin responde no painel
   ↓
9. SendGrid envia resposta por email ao usuário
   ↓
10. Slack notifica que contato foi respondido
```

**Código:**

```typescript
// server/integrations/contact-workflow.ts
export async function handleNewContact(contact: ContactSubmission) {
  try {
    // 1. Salvar no banco (já feito)
    
    // 2. Enviar confirmação por email
    await sendEmail({
      to: contact.email,
      template: "contact_confirmation",
      data: { name: contact.name, ticketId: contact.id }
    });
    
    // 3. Notificar no Slack
    await notifySlack({
      channel: "#new-contacts",
      message: `Novo contato de ${contact.name}`
    });
    
    // 4. Atualizar Google Sheets
    await exportToGoogleSheets({
      sheetName: "Contatos",
      data: [[contact.name, contact.email, contact.subject, contact.createdAt]]
    });
    
    // 5. Enviar SMS ao admin (opcional)
    if (contact.priority === "HIGH") {
      await sendSMS({
        to: process.env.ADMIN_PHONE,
        message: `Novo contato urgente: ${contact.subject}`
      });
    }
    
    return { success: true, ticketId: contact.id };
  } catch (error) {
    console.error("Erro ao processar contato:", error);
    throw error;
  }
}
```

---

## 🔐 Configuração de Secrets

```bash
# .env
SENDGRID_API_KEY=sg_...
GOOGLE_SHEETS_API_KEY=...
GOOGLE_SHEETS_ID=1a2b3c4d5e6f7g8h9i0j
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
CALENDLY_API_KEY=...
```

---

## 📝 Próximos Passos

1. ✅ Implementar SendGrid para emails
2. ✅ Implementar Google Sheets para exportação
3. ✅ Implementar Slack para notificações
4. ⏳ Implementar Stripe para pagamentos
5. ⏳ Implementar Calendly para agendamentos

---

**Última atualização:** 27 de Fevereiro de 2026
**Versão:** 1.0.0
