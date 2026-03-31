# Arquitetura do Sistema Áquila Pro

## Visão Geral

O Sistema Áquila Pro é uma aplicação web full-stack construída com **React 19 + TypeScript + Express + tRPC + MySQL**, oferecendo uma plataforma completa para gerenciamento de segurança e engajamento escolar com reconhecimento facial, controle de presença automatizado e conformidade LGPD.

---

## Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                   │
│  - UI Components (shadcn/ui)                            │
│  - Pages & Routing (wouter)                             │
│  - State Management (TanStack Query)                    │
│  - Styling (Tailwind CSS 4)                             │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  tRPC API Layer                          │
│  - Type-safe RPC procedures                             │
│  - Authentication middleware                            │
│  - Data validation (Zod)                                │
│  - Error handling                                       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│               Backend (Express + Node.js)               │
│  - HTTP server                                          │
│  - OAuth integration (Manus)                            │
│  - Parent Portal auth (JWT + bcrypt)                    │
│  - API routes                                           │
│  - Business logic                                       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│            Data Access Layer (Drizzle ORM)              │
│  - Query builders                                       │
│  - Schema definitions                                   │
│  - Migrations                                           │
│  - Type safety                                          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Database (MySQL/TiDB)                      │
│  - Persistent storage                                   │
│  - Transactions                                         │
│  - Indexes & optimization                              │
└─────────────────────────────────────────────────────────┘
```

---

## Estrutura de Diretórios

```
aquila-pro-website/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/                   # Páginas principais
│   │   │   ├── Home.tsx             # Homepage / Landing Page
│   │   │   ├── Sobre.tsx            # Sobre o sistema
│   │   │   ├── Funcionalidades.tsx  # Funcionalidades detalhadas
│   │   │   ├── Demo.tsx             # Demonstração interativa
│   │   │   ├── Precos.tsx           # Planos e preços
│   │   │   ├── Vendas.tsx           # Landing de vendas + formulário de orçamento
│   │   │   ├── Contato.tsx          # Formulário de contato
│   │   │   ├── Arquitetura.tsx      # Documentação técnica
│   │   │   ├── Seguranca.tsx        # Segurança & LGPD
│   │   │   ├── Implantacao.tsx      # Guia de implantação
│   │   │   ├── API.tsx              # Documentação de API
│   │   │   ├── PortalPais.tsx       # Landing do Portal dos Pais
│   │   │   ├── MobileApp.tsx        # App móvel para coordenadores
│   │   │   ├── portal/
│   │   │   │   ├── PortalLogin.tsx      # Login do Portal dos Pais
│   │   │   │   ├── PortalCadastro.tsx   # Cadastro com LGPD
│   │   │   │   ├── PortalDashboard.tsx  # Dashboard autenticado
│   │   │   │   ├── PortalResetSenha.tsx # Recuperação de senha
│   │   │   │   ├── PortalLGPD.tsx       # Gerenciamento de consentimentos
│   │   │   │   └── TermoLGPD.tsx        # Termo LGPD com assinatura digital
│   │   │   └── admin/
│   │   │       ├── QuotesAdmin.tsx          # CRM de orçamentos
│   │   │       ├── ContactsAdmin.tsx        # Gerenciar contatos
│   │   │       ├── ExecutiveDashboard.tsx   # Dashboard executivo
│   │   │       ├── AnalyticsDashboard.tsx   # Analytics com BI
│   │   │       ├── CoordinationDashboard.tsx # Coordenação
│   │   │       ├── StudentPortfolio.tsx     # Portfólio do aluno
│   │   │       └── LgpdCompliance.tsx       # Conformidade LGPD
│   │   ├── components/              # Componentes reutilizáveis
│   │   │   ├── Navigation.tsx       # Menu de navegação
│   │   │   ├── Footer.tsx           # Rodapé
│   │   │   ├── OptimizedImage.tsx   # Imagem otimizada
│   │   │   └── ui/                  # shadcn/ui components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils/                   # Utilitários
│   │   ├── lib/trpc.ts              # Cliente tRPC
│   │   ├── App.tsx                  # Componente raiz + rotas
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Estilos globais
│   └── public/                      # Assets estáticos
│
├── server/                          # Backend Node.js
│   ├── _core/                       # Framework (não editar)
│   │   ├── index.ts                 # Servidor Express
│   │   ├── context.ts               # Contexto tRPC
│   │   ├── trpc.ts                  # Configuração tRPC
│   │   ├── oauth.ts                 # Autenticação OAuth
│   │   ├── llm.ts                   # Integração LLM
│   │   ├── notification.ts          # Notificações
│   │   ├── voiceTranscription.ts    # Transcrição de áudio
│   │   └── imageGeneration.ts       # Geração de imagens
│   ├── routers/                     # Routers de funcionalidades
│   │   ├── parent-portal.ts         # Autenticação e dados dos pais
│   │   ├── quotes.ts               # Orçamentos (CRM)
│   │   ├── periods.ts              # Períodos letivos
│   │   ├── schedules.ts            # Grades horárias
│   │   ├── events.ts               # Eventos escolares
│   │   ├── tracking.ts             # Rastreamento de alunos
│   │   ├── analysis.ts             # Análise comportamental
│   │   ├── alerts.ts               # Alertas de segurança
│   │   ├── notifications.ts        # Notificações
│   │   ├── portfolio.ts            # Portfólio do aluno
│   │   ├── dataRetention.ts        # Retenção de dados
│   │   ├── lgpd_rights.ts          # Direitos LGPD
│   │   ├── photo_upload.ts         # Upload de fotos
│   │   └── python_integration.ts   # Integração Python/IA
│   ├── integrations/
│   │   ├── sendgrid.ts             # Email via SendGrid
│   │   ├── twilio.ts               # SMS/WhatsApp via Twilio
│   │   ├── openai.ts               # Funções OpenAI
│   │   ├── routes.ts               # Rotas de integrações
│   │   ├── templates-routes.ts     # Templates de mensagem
│   │   └── contact-routes.ts       # Contatos
│   ├── routers.ts                   # Roteador principal tRPC
│   ├── db.ts                        # Configuração Drizzle
│   └── storage.ts                   # S3 helpers
│
├── drizzle/                         # Banco de dados
│   ├── schema.ts                    # Definição de tabelas
│   ├── migrations/                  # Histórico de migrações
│   └── relations.ts                 # Relacionamentos
│
├── shared/                          # Código compartilhado
│   ├── const.ts                     # Constantes
│   └── types.ts                     # Tipos compartilhados
│
├── electron/                        # Aplicativo Desktop
│   ├── main.ts                      # Janela principal
│   ├── preload.ts                   # Bridge IPC
│   └── electron-builder.yml         # Configuração de build
│
├── ARCHITECTURE.md                  # Este arquivo
├── DATABASE.md                      # Documentação do BD
├── AQUILA_CORE_DIRECTIVES.md        # Diretrizes do sistema
├── MULTI_AGENT_CONFIGURATION.md     # Configuração multi-agentes
└── todo.md                          # Rastreamento de tarefas
```

---

## Módulos do Sistema

### 1. Site Institucional (Público)

Páginas de marketing e informação sobre o sistema Áquila Pro, incluindo funcionalidades, preços, demonstração interativa, casos de sucesso, FAQ, arquitetura técnica, segurança e implantação.

### 2. Portal dos Pais

Sistema completo de autenticação independente para pais/responsáveis com as seguintes funcionalidades:

| Funcionalidade | Descrição | Rota |
|---|---|---|
| Login | Autenticação com email/senha + bcrypt | `/portal-pais/login` |
| Cadastro | Registro com validação + Termo LGPD | `/portal-pais/cadastro` |
| Dashboard | Visão geral, filhos, notificações, configurações | `/portal-pais/dashboard` |
| Reset de Senha | Recuperação via token por email (expira em 1h) | `/portal-pais/reset-senha` |
| Termo LGPD | Documento com 10 seções + 6 consentimentos + assinatura digital | `/portal-pais/termo-lgpd` |
| Gerenciamento LGPD | Revogar/conceder consentimentos, solicitar direitos | `/portal-pais/lgpd` |

### 3. Painel Administrativo

Ferramentas de gestão para administradores do sistema:

| Painel | Descrição | Rota |
|---|---|---|
| CRM de Orçamentos | Gerenciar solicitações, status, notas, filtros | `/admin/orcamentos` |
| Contatos | Gerenciar contatos recebidos | `/admin/contatos` |
| Dashboard Executivo | KPIs e métricas de alto nível | `/admin/executive` |
| Analytics | BI com gráficos e relatórios | `/admin/analytics` |
| Coordenação | Dashboard de coordenação escolar | `/admin/coordination` |
| Conformidade LGPD | Auditoria de consentimentos e solicitações | `/admin/lgpd-compliance` |
| Templates | Gerenciar templates de mensagens | `/admin/templates` |

### 4. Integrações Externas

| Serviço | Uso | Arquivo |
|---|---|---|
| SendGrid | Emails transacionais (orçamentos, reset de senha, confirmações) | `server/integrations/sendgrid.ts` |
| Twilio | SMS e WhatsApp para alertas | `server/integrations/twilio.ts` |
| OpenAI | Análise de alertas, chatbot, detecção de anomalias | `server/_core/llm.ts` |
| Manus OAuth | Autenticação de admins | `server/_core/oauth.ts` |
| S3 | Armazenamento de arquivos e imagens | `server/storage.ts` |

---

## Fluxos de Dados

### Autenticação Admin (Manus OAuth)

```
Admin → Frontend (Login Button)
  ↓
Frontend → Manus OAuth Portal
  ↓
Manus OAuth → Callback /api/oauth/callback
  ↓
Backend → Create/Update User in DB
  ↓
Backend → Set Session Cookie (httpOnly, secure)
  ↓
Frontend → Redirect to Admin Panel
```

### Autenticação Portal dos Pais (JWT + bcrypt)

```
Pai → Frontend (Login Form)
  ↓
Frontend → tRPC: parentPortal.login
  ↓
Backend → Validate email/password (bcrypt)
  ↓
Backend → Generate JWT Token (1h expiry)
  ↓
Frontend → Store token in localStorage
  ↓
Frontend → Redirect to Dashboard
```

### Solicitação de Orçamento

```
Visitante → Formulário de Orçamento (Vendas.tsx)
  ↓
Frontend → tRPC: quotes.submit
  ↓
Backend → Validate Data (Zod)
  ↓
Backend → Save to Database (quoteRequests)
  ↓
Backend → Notify Owner (notification API)
  ↓
Backend → Send Email to Owner (SendGrid - detalhado)
  ↓
Backend → Send Confirmation Email to Client (SendGrid)
  ↓
Frontend → Show Success Message
```

### Recuperação de Senha

```
Pai → Formulário "Esqueci minha senha"
  ↓
Frontend → tRPC: parentPortal.requestPasswordReset
  ↓
Backend → Generate reset token (crypto.randomBytes)
  ↓
Backend → Save token + expiry in DB
  ↓
Backend → Send email with reset link (SendGrid)
  ↓
Pai → Click link in email
  ↓
Frontend → Form to enter new password
  ↓
Frontend → tRPC: parentPortal.resetPassword
  ↓
Backend → Validate token + expiry
  ↓
Backend → Hash new password (bcrypt)
  ↓
Backend → Update DB + clear token
```

### Gerenciamento de Consentimentos LGPD

```
Pai → Portal LGPD (/portal-pais/lgpd)
  ↓
Frontend → Display current consents
  ↓
Pai → Click "Revogar" or "Conceder"
  ↓
Frontend → Confirm action
  ↓
Backend → Update consent in DB
  ↓
Backend → Log audit trail
  ↓
Frontend → Update UI + Toast notification
```

---

## Segurança

### Autenticação

- **OAuth Manus**: Admins autenticados via Manus OAuth
- **Portal dos Pais**: JWT + bcrypt com tokens de 1h
- **Session Cookies**: httpOnly, secure, sameSite
- **Password Reset**: Tokens criptográficos com expiração de 1h

### Autorização

- **Role-based Access Control (RBAC)**:
  - `admin` - Acesso total (CRM, contatos, dashboards, LGPD)
  - `user` - Acesso limitado (dados públicos)
  - `parent` - Portal dos Pais (dados dos filhos, consentimentos)

### Conformidade LGPD

O sistema implementa conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018):

| Requisito | Implementação |
|---|---|
| Consentimento informado | Termo LGPD com 10 seções jurídicas + 6 consentimentos granulares |
| Assinatura digital | Hash SHA-256 do consentimento com timestamp |
| Direito de acesso | Endpoint para solicitar cópia dos dados |
| Direito de correção | Endpoint para solicitar correção |
| Direito de exclusão | Endpoint para solicitar exclusão com prazo de 30 dias |
| Direito de portabilidade | Exportação em JSON/CSV |
| Revogação de consentimento | Interface para revogar consentimentos individuais |
| Base legal documentada | Cada consentimento referencia o artigo da LGPD aplicável |
| DPO (Encarregado) | Contato do DPO disponível na interface |

### Validação de Dados

- **Zod Schemas**: Validação de entrada em todos os endpoints
- **TypeScript**: Tipos corretos em toda a stack
- **Drizzle ORM**: Prevenção de SQL injection
- **Input sanitization**: Dados sanitizados antes de persistência

---

## Integrações Externas

### SendGrid (Email)

Utilizado para emails transacionais com templates HTML profissionais:

- Notificação de novos orçamentos para o proprietário
- Confirmação de orçamento para o cliente
- Reset de senha do Portal dos Pais
- Alertas de segurança

### Twilio (SMS/WhatsApp)

Utilizado para notificações em tempo real:

- Alertas de entrada/saída de alunos
- Notificações de segurança
- Confirmações de contato

### OpenAI (LLM)

Utilizado para análise inteligente:

- Análise de alertas de segurança
- Detecção de anomalias comportamentais
- Chatbot de suporte
- Geração de resumos

---

## Performance

### Otimizações Implementadas

1. **Lazy Loading de Imagens** - Intersection Observer + WebP + blur placeholders
2. **Service Worker** - Cache offline + precaching de assets
3. **Code Splitting** - Vite dynamic imports + route-based splitting
4. **Database** - Índices em campos frequentes + paginação

### Métricas Alvo

| Métrica | Alvo | Status |
|---|---|---|
| Lighthouse Performance | > 90 | Em validação |
| First Contentful Paint | < 1.5s | Em validação |
| Largest Contentful Paint | < 2.5s | Em validação |
| Time to Interactive | < 3.5s | Em validação |
| Latência de reconhecimento | < 500ms | Planejado |
| FPS do sistema de câmeras | > 15 | Planejado |
| Precisão de reconhecimento | > 99% | Planejado |

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | Latest |
| Backend | Express | 4.x |
| RPC | tRPC | 11.x |
| ORM | Drizzle | 0.44.x |
| Database | MySQL/TiDB | 8.0+ |
| Language | TypeScript | 5.9.x |
| Build | Vite | 7.x |
| Testing | Vitest | 2.x |
| Email | SendGrid | API v3 |
| SMS | Twilio | API |
| AI | OpenAI | GPT-4 |
| Desktop | Electron | 34.x |

---

## Decisões Técnicas

### Por que tRPC em vez de REST?

O tRPC oferece type-safety end-to-end sem necessidade de gerar schemas OpenAPI ou manter contratos separados. Como o frontend e backend compartilham o mesmo repositório TypeScript, o tRPC elimina uma classe inteira de bugs de integração.

### Por que autenticação separada para o Portal dos Pais?

Os pais não possuem conta Manus OAuth. O sistema implementa autenticação própria com JWT + bcrypt para permitir que pais se cadastrem e acessem dados dos filhos de forma independente, sem depender de um provedor OAuth externo.

### Por que consentimentos LGPD granulares?

A LGPD exige que o consentimento seja "livre, informado e inequívoco" (Art. 5, XII). Consentimentos granulares permitem que pais autorizem apenas os tipos de processamento com os quais concordam, respeitando o princípio da necessidade (Art. 6, III).

### Por que SendGrid para emails transacionais?

O SendGrid oferece alta deliverability, templates HTML, tracking de abertura e conformidade com regulamentações anti-spam, essencial para emails de recuperação de senha e notificações de orçamento.

---

## Desenvolvimento

### Comandos

```bash
# Instalar dependências
pnpm install

# Iniciar dev server
pnpm dev

# Build para produção
pnpm build

# Executar testes
pnpm test

# Push de schema para o banco
pnpm db:push
```

### Convenções de Código

- **Componentes**: PascalCase (`Home.tsx`, `PortalLogin.tsx`)
- **Funções**: camelCase (`handleSubmit`, `formatDate`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_ATTEMPTS`)
- **Tipos**: PascalCase (`User`, `QuoteRequest`)
- **Routers**: kebab-case (`parent-portal.ts`, `quotes.ts`)

---

**Última atualização:** 04 de Março de 2026
**Versão:** 2.0.0
**Mantido por:** Equipe Áquila Pro
