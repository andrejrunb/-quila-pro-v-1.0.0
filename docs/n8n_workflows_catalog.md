# 🔧 n8n Workflows — Catálogo Curado para o Áquila Pro

> Resultado da varredura completa de [n8n.io/workflows](https://n8n.io/workflows/) com foco em automações aplicáveis à gestão escolar, comunicação com pais, IA pedagógica e operações administrativas.

---

## 🏆 TOP 10 — Workflows de Maior Impacto Imediato

Estes são os workflows que devem ser implementados **primeiro** por terem impacto direto no MVP do Áquila Pro:

| # | Workflow | Impacto no Áquila Pro | Integração |
|:--|:---------|:---------------------|:-----------|
| 1 | **WhatsApp AI Chatbot com RAG & Memória** | Helpdesk 24/7 para pais e alunos | WhatsApp + OpenAI + Supabase |
| 2 | **Alerta Automático de Frequência** | Notifica pais quando aluno falta | PostgreSQL + WhatsApp + Cron |
| 3 | **Lembrete de Mensalidade** | Cobranças escaláveis (D-5, D-0, D+3) | PostgreSQL + WhatsApp + Email |
| 4 | **Gerador de Boletins em PDF** | Report cards automáticos | Google Sheets + Gotenberg + Gmail |
| 5 | **Bot de Consulta ao Banco via WhatsApp** | Pais consultam notas/faltas por WhatsApp | WhatsApp + PostgreSQL |
| 6 | **Tutor IA Virtual com Memória** | Assistente de estudos para alunos | OpenAI + LangChain + Supabase |
| 7 | **Dispatcher Multi-Canal de Emergência** | Alertas urgentes (WhatsApp+Telegram+Email) | Multi-channel + Switch Node |
| 8 | **Backup Automático do Banco** | Compliance LGPD + segurança de dados | PostgreSQL + S3/Drive + Cron |
| 9 | **Digest Semanal de Progresso** | Boletim semanal personalizado para pais | PostgreSQL + Gmail + HTML |
| 10 | **Onboarding Automatizado de Funcionários** | RH da escola | Google Workspace + Email |

---

## 📲 1. WhatsApp Automations

### 1.1 Mensagens em Massa via Google Sheets
- **Descrição**: Lê contatos de planilha, envia mensagens templated e atualiza status
- **URL**: [n8n.io/workflows/1954](https://n8n.io/workflows/1954-send-bulk-whatsapp-messages-from-google-sheets/)
- **Integrações**: WhatsApp Business API, Google Sheets
- **🎯 No Áquila**: Envio massivo de avisos de reunião, eventos e alertas de emergência para pais

### 1.2 AI Chatbot WhatsApp com RAG & Memória ⭐
- **Descrição**: Bot conversacional com memória vetorial que responde perguntas baseado em documentos indexados
- **URL**: [n8n.io/workflows/2268](https://n8n.io/workflows/2268-ai-whatsapp-chatbot-with-memory/)
- **Integrações**: WhatsApp Business API, OpenAI/Gemini, Supabase Vector, Pinecone
- **🎯 No Áquila**: Helpdesk 24/7 para dúvidas sobre calendário, matrícula, mensalidades e boletins

### 1.3 WhatsApp → Slack (Escalação Humana)
- **Descrição**: Redireciona mensagens complexas do WhatsApp para canais Slack da equipe administrativa
- **URL**: [n8n.io/workflows/2115](https://n8n.io/workflows/2115-whatsapp-to-slack-customer-support/)
- **Integrações**: WhatsApp Business API, Slack API
- **🎯 No Áquila**: Secretaria escolar atende pais via Slack quando o bot não resolve

### 1.4 Bot de Consulta ao Banco PostgreSQL via WhatsApp ⭐
- **Descrição**: Parseia comandos em linguagem natural para consultar PostgreSQL e retornar resultados formatados
- **URL**: [n8n.io/workflows/2042](https://n8n.io/workflows/2042-whatsapp-postgresql-database-bot/)
- **Integrações**: WhatsApp Business API, PostgreSQL
- **🎯 No Áquila**: Pais consultam notas, faltas e saldo de mensalidade diretamente pelo WhatsApp

---

## 🔔 2. Notificações Automáticas

### 2.1 Alerta de Frequência (Absence Notification) ⭐
- **Descrição**: Cron às 9:30 escaneia o banco de frequência, identifica ausentes e notifica pais automaticamente
- **URL**: [n8n.io/workflows/1744](https://n8n.io/workflows/1744-automated-attendance-notifications/)
- **Integrações**: PostgreSQL, WhatsApp, Gmail, Cron Trigger
- **🎯 No Áquila**: Notificação imediata quando aluno falta sem justificativa

### 2.2 Dispatcher Multi-Canal de Emergência ⭐
- **Descrição**: Broadcasts simultâneos via WhatsApp + Telegram + Email com retry automático
- **URL**: [n8n.io/workflows/1892](https://n8n.io/workflows/1892-multi-channel-notification-dispatcher/)
- **Integrações**: WhatsApp, Telegram, Gmail, Switch Node
- **🎯 No Áquila**: Alertas de segurança, fechamento por clima, mudanças urgentes de horário

### 2.3 Lembrete de Mensalidade Escalonado ⭐
- **Descrição**: Escaneia tabela financeira e envia lembretes progressivos (D-5, D-0, D+3 de vencimento)
- **URL**: [n8n.io/workflows/1620](https://n8n.io/workflows/1620-scheduled-database-due-date-reminders/)
- **Integrações**: PostgreSQL, WhatsApp, SendGrid, Schedule
- **🎯 No Áquila**: Cobrança automatizada de mensalidades com escalação para inadimplentes

---

## 🤖 3. Chatbots de IA

### 3.1 Tutor Virtual IA com Memória ⭐
- **Descrição**: Tutor conversacional que ajuda alunos com dúvidas acadêmicas, revisão e preparação para provas
- **URL**: [n8n.io/workflows/2310](https://n8n.io/workflows/2310-ai-tutor-chatbot-with-langchain/)
- **Integrações**: OpenAI GPT-4o, LangChain, Supabase, Webhook
- **🎯 No Áquila**: Assistente de estudos 24/7 integrado ao portal do aluno

### 3.2 Bot de Admissão Multi-Etapas
- **Descrição**: Guia famílias pelo processo de matrícula com routing de intent e handoff humano
- **URL**: [n8n.io/workflows/2180](https://n8n.io/workflows/2180-session-based-support-chatbot/)
- **Integrações**: WhatsApp/Telegram, OpenAI, PostgreSQL
- **🎯 No Áquila**: Captação automatizada de novos alunos com orientação sobre planos e visitas

### 3.3 RAG Bot para Regimento e Grade Curricular ⭐
- **Descrição**: Indexa PDFs (regimento, handbook, grade) em vector store e responde perguntas com citações
- **URL**: [n8n.io/workflows/2245](https://n8n.io/workflows/2245-rag-document-qa-chatbot/)
- **Integrações**: Pinecone/Supabase Vector, OpenAI Embeddings
- **🎯 No Áquila**: Pais e alunos consultam regras, critérios de avaliação e calendário via chat

---

## 📊 4. Google Sheets

### 4.1 Sync Gradebook → Banco de Dados
- **Descrição**: Trigger em updates do Sheets sincroniza notas/frequência com PostgreSQL em tempo real
- **URL**: [n8n.io/workflows/1512](https://n8n.io/workflows/1512-google-sheets-to-database-sync/)
- **Integrações**: Google Sheets Trigger, PostgreSQL
- **🎯 No Áquila**: Professores lançam notas no Sheets e o banco centralizado atualiza automaticamente

### 4.2 Gerador de Boletins e Certificados em PDF ⭐
- **Descrição**: Puxa métricas de alunos da planilha, gera PDFs com templates HTML e envia por email
- **URL**: [n8n.io/workflows/1430](https://n8n.io/workflows/1430-generate-pdf-reports-from-google-sheets/)
- **Integrações**: Google Sheets, Gotenberg/PDF.co, Gmail, Google Drive
- **🎯 No Áquila**: Geração automática mensal de boletins e certificados de participação

### 4.3 Pipeline de Formulários (Matrícula/Autorização)
- **Descrição**: Captura submissões de formulários, grava na planilha e envia email de confirmação
- **URL**: [n8n.io/workflows/1388](https://n8n.io/workflows/1388-form-to-google-sheets-and-email/)
- **Integrações**: Google Forms/Typeform, Google Sheets, Gmail
- **🎯 No Áquila**: Autorizações para excursões, eventos e termos de consentimento LGPD

---

## 🗃️ 5. Banco de Dados

### 5.1 Backup Automático (LGPD Compliance) ⭐
- **Descrição**: Dump diário do banco, compressão, upload para S3/Drive e email de verificação
- **URL**: [n8n.io/workflows/1290](https://n8n.io/workflows/1290-database-backup-to-s3-and-email/)
- **Integrações**: PostgreSQL, AWS S3/Google Drive, SMTP, Cron
- **🎯 No Áquila**: Backup soberano automatizado para compliance LGPD e auditoria

### 5.2 Relatório Executivo IA do Banco ⭐
- **Descrição**: Executa queries analíticas, passa para LLM gerar insights em linguagem natural e envia report
- **URL**: [n8n.io/workflows/2104](https://n8n.io/workflows/2104-sql-database-to-ai-executive-summary/)
- **Integrações**: PostgreSQL, OpenAI/Gemini, Email/PDF/Slack
- **🎯 No Áquila**: Relatório semanal para diretores com tendências de frequência, receita e desempenho

### 5.3 Webhook de Pagamento → Banco
- **Descrição**: Recebe webhooks de gateways (Stripe/Asaas/Pix), atualiza registro e emite recibo
- **URL**: [n8n.io/workflows/1675](https://n8n.io/workflows/1675-webhook-to-database-sync/)
- **Integrações**: Webhook, PostgreSQL, SendGrid/Gmail
- **🎯 No Áquila**: Processamento de pagamentos PIX: atualiza status para "PAGO" e envia comprovante

---

## 📱 6. Telegram

### 6.1 Bot de Avisos para Professores
- **Descrição**: Broadcasts direcionados para grupos de Telegram da equipe docente
- **URL**: [n8n.io/workflows/1850](https://n8n.io/workflows/1850-telegram-broadcast-bot-channel/)
- **🎯 No Áquila**: Avisos de reuniões, escalas de plantão e bulletins administrativos

### 6.2 Bot Analisador de PDFs de Dever de Casa
- **Descrição**: Recebe PDFs via Telegram, extrai texto, avalia com IA e responde com feedback
- **URL**: [n8n.io/workflows/2290](https://n8n.io/workflows/2290-telegram-pdf-ai-analyzer-bot/)
- **🎯 No Áquila**: Canal de submissão de trabalhos com feedback instantâneo por IA

### 6.3 Menu Interativo Self-Service para Alunos
- **Descrição**: Bot com botões inline para consultar horários, notas, cardápio e biblioteca
- **URL**: [n8n.io/workflows/1722](https://n8n.io/workflows/1722-telegram-interactive-menu-bot/)
- **🎯 No Áquila**: Portal mobile leve para alunos consultarem informações no celular

---

## 📧 7. Email

### 7.1 Pipeline de Faturamento e Cobrança
- **Descrição**: Gera faturas HTML, anexa PDF e envia com follow-ups escalonados
- **URL**: [n8n.io/workflows/1560](https://n8n.io/workflows/1560-automated-invoice-and-payment-reminders-email/)
- **🎯 No Áquila**: Faturamento mensal de mensalidades com cobranças automáticas

### 7.2 Parser de Emails → Sistema de Tickets
- **Descrição**: Monitora caixa de entrada, parseia mensagens e cria tickets de suporte no banco
- **URL**: [n8n.io/workflows/1489](https://n8n.io/workflows/1489-inbound-email-parsing-to-database-ticket/)
- **🎯 No Áquila**: Sistema de tickets para reclamações e pedidos de pais via email

### 7.3 Digest Semanal de Progresso para Pais ⭐
- **Descrição**: Compila métricas individuais por aluno e envia emails HTML personalizados
- **URL**: [n8n.io/workflows/1633](https://n8n.io/workflows/1633-personalized-weekly-email-digest/)
- **🎯 No Áquila**: Boletim semanal personalizado: frequência, notas recentes, próximas provas

---

## 📄 8. Processamento de PDF

### 8.1 Gerador de Boletins e Históricos Oficiais
- **Descrição**: JSON → HTML template → PDF de alta fidelidade com headers e marca d'água
- **URL**: [n8n.io/workflows/1770](https://n8n.io/workflows/1770-html-to-pdf-report-generator/)
- **🎯 No Áquila**: Boletins, diplomas e históricos escolares com identidade visual da escola

### 8.2 OCR de Documentos de Matrícula
- **Descrição**: Ingere PDFs escaneados, extrai campos via OCR/IA e grava no banco
- **URL**: [n8n.io/workflows/2012](https://n8n.io/workflows/2012-pdf-ocr-data-extraction-to-database/)
- **🎯 No Áquila**: Digitalização automática de certidões de nascimento, vacinas e transferências

### 8.3 Splitter de PDFs em Lote
- **Descrição**: Divide PDF consolidado por aluno e envia individualmente para cada pai
- **URL**: [n8n.io/workflows/1834](https://n8n.io/workflows/1834-batch-pdf-split-and-email-dispatch/)
- **🎯 No Áquila**: Dividir boletins gerados em lote e despachar individualmente

---

## ⚙️ 9. DevOps & Monitoramento

### 9.1 Monitor Docker via Telegram ⭐
- **Descrição**: Heartbeat de containers Docker com análise de logs por IA e restart remoto via Telegram
- **Integrações**: Docker Engine API, Telegram, OpenAI
- **🎯 No Áquila**: Monitoramento dos containers Evolution API, Postgres e n8n

### 9.2 Kubernetes com GPT-4o (Conversacional)
- **Descrição**: Linguagem natural para gerenciar clusters K8s via MCP
- **🎯 No Áquila**: Futuro — gerenciamento de microserviços em escala

### 9.3 Error Handler Global para n8n
- **Descrição**: Intercepta falhas em todos os workflows, loga e alerta com throttling
- **🎯 No Áquila**: Governança de todos os workflows com alertas controlados

---

## 👥 10. RH Escolar

### 10.1 Onboarding Automático de Funcionários
- **Descrição**: Cria tarefas IT, pastas no Drive, envia docs de boas-vindas e apresenta no Slack
- **🎯 No Áquila**: Integração de novos professores e funcionários

### 10.2 Pipeline de Recrutamento com Scoring IA
- **Descrição**: Coleta candidaturas, parseia CVs, avalia fit por IA e agenda entrevistas
- **🎯 No Áquila**: Contratação de professores com triagem automatizada

### 10.3 Bot Telegram CHRO Multi-Agente
- **Descrição**: Sistema multi-agente para recrutamento, políticas, frequência e folha via Telegram
- **🎯 No Áquila**: Self-service de RH para equipe docente e administrativa
