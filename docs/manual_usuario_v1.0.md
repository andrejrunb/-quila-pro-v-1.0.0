# 📖 Manual do Usuário — Áquila Pro v1.0

**Sistema de Segurança Escolar com Inteligência Artificial**

---

## Índice

1. [Introdução](#1-introducao)
2. [Instalação e Primeiro Acesso](#2-instalacao)
3. [Dashboard Principal](#3-dashboard)
4. [Cadastro de Alunos](#4-alunos)
5. [Câmeras e Monitoramento](#5-cameras)
6. [Alertas e Notificações WhatsApp](#6-whatsapp)
7. [Ranking & Análise Pedagógica](#7-ranking)
8. [Relatórios e Exportação](#8-relatorios)
9. [LGPD e Privacidade](#9-lgpd)
10. [Configurações do Sistema](#10-configuracoes)
11. [Perguntas Frequentes](#11-faq)
12. [Suporte Técnico](#12-suporte)

---

## 1. Introdução

O **Áquila Pro** é um sistema de segurança escolar de próxima geração que combina:

- **Reconhecimento Facial por IA** — identifica alunos, professores e visitantes em menos de 2 segundos
- **Alertas em Tempo Real** — notifica responsáveis via WhatsApp a cada entrada e saída
- **Compliance LGPD** — Privacy Blur automático e gestão completa de consentimento
- **Analytics Pedagógico** — dashboard de frequência, risco de reprovação e absenteísmo preditivo

### 1.1 Requisitos Mínimos

| Componente | Mínimo | Recomendado |
|---|---|---|
| SO | Windows 10 64-bit | Windows 11 64-bit |
| RAM | 8 GB | 16 GB |
| Armazenamento | 20 GB livre | 50 GB SSD |
| GPU | Integrada (Intel/AMD) | NVIDIA GTX 1060+ |
| Câmeras | 1 USB/IP | 4+ câmeras IP |
| Conexão | 10 Mbps | 50 Mbps |

---

## 2. Instalação e Primeiro Acesso

### 2.1 Instalação

1. Baixe o arquivo `AquilaPro-Setup-v1.0.exe` enviado pelo suporte
2. Execute o instalador como **Administrador**
3. Aceite os termos de uso e o aviso de privacidade
4. Escolha o diretório de instalação (padrão: `C:\Program Files\Aquila Pro`)
5. Aguarde a instalação (aprox. 5 minutos)
6. Clique em **Finalizar** — o sistema abrirá automaticamente

### 2.2 Primeiro Acesso

Ao abrir pela primeira vez, o **Assistente de Configuração** guiará você:

1. **Informações da Escola** — Nome, CNPJ, endereço
2. **Criação do Admin** — Escolha login e senha segura (mínimo 12 caracteres)
3. **Configuração de Câmeras** — Adicione pelo menos 1 câmera
4. **WhatsApp** — Conecte sua conta ou sessão Business
5. **LGPD** — Leia e aceite o termo de privacidade obrigatório

### 2.3 Login Diário

- Acesse com seu **usuário** e **senha**
- Administradores precisam de um **código 2FA** gerado pelo Google Authenticator
- Em caso de esquecimento de senha, contate o suporte técnico

---

## 3. Dashboard Principal

O Dashboard exibe em tempo real:

| Elemento | Descrição |
|---|---|
| **Alunos Presentes** | Contador atualizado a cada identificação |
| **Últimas Identificações** | Feed das últimas 10 entradas/saídas |
| **Status das Câmeras** | Verde = online, Vermelho = offline |
| **Alertas Ativos** | Notificações pendentes de revisão |
| **Gráfico de Frequência** | Presença por hora do dia (últimas 48h) |

### 3.1 Navegação

Use a **barra lateral esquerda** para acessar os módulos:
- 🏠 Dashboard
- 👥 Alunos
- 📹 Câmeras
- 🔔 Alertas
- 📊 Relatórios
- 🏆 Ranking
- ⚙️ Configurações

---

## 4. Cadastro de Alunos

### 4.1 Adicionar Aluno

1. Acesse **Alunos → Novo Aluno**
2. Preencha: Nome completo, Matrícula, Turma, Série
3. Adicione o contato do responsável (telefone WhatsApp)
4. **Foto para reconhecimento**: clique em "Capturar da Câmera" ou importe arquivo JPG/PNG
5. O sistema processará a foto e extrairá o vetor facial em segundos
6. Clique em **Salvar**

> ⚠️ **LGPD**: A foto é processada localmente e o vetor facial nunca sai do servidor da escola.

### 4.2 Importação em Lote

Para importar vários alunos de uma vez:
1. Acesse **Alunos → Importar CSV**
2. Baixe o modelo de planilha
3. Preencha com os dados dos alunos
4. Importe o arquivo — o sistema processará automaticamente

### 4.3 Editar / Inativar Aluno

- Clique no nome do aluno na lista
- Use os botões **Editar** ou **Inativar**
- Alunos inativos não são mais identificados nas câmeras

---

## 5. Câmeras e Monitoramento

### 5.1 Adicionar Câmera

1. **Configurações → Câmeras → Nova Câmera**
2. Escolha o tipo: **USB**, **IP (RTSP)** ou **ONVIF**
3. Para câmeras IP, informe: `rtsp://usuario:senha@ip:porta/stream`
4. Defina a **Posição** (Portaria Principal, Entrada Lateral, etc.)
5. Defina o **Tipo de Evento** detectado (Entrada, Saída, Monitoramento)
6. Clique em **Testar Conexão** antes de salvar

### 5.2 Visualização ao Vivo

- Acesse **Câmeras → Visualização**
- Escolha entre 1, 4, 9 ou 16 câmeras simultâneas
- Os retângulos de reconhecimento aparecem em **verde** (identificado) ou **vermelho** (desconhecido)

### 5.3 Privacy Blur

O Privacy Blur é **automático e obrigatório** para todos os rostos não cadastrados:
- Ativado por padrão (não pode ser desativado — é exigência LGPD)
- Configurações → Câmeras → Intensidade do Blur (Baixa / Média / Alta)

---

## 6. Alertas e Notificações WhatsApp

### 6.1 Configurar WhatsApp

1. **Configurações → WhatsApp → Conectar**
2. Escaneie o QR Code com o WhatsApp do celular da escola
3. Aguarde a confirmação de conexão (ícone verde)

### 6.2 Tipos de Alerta

| Alerta | Trigger | Destinatário |
|---|---|---|
| ✅ **Entrada confirmada** | Aluno identificado na entrada | Responsável |
| 🚪 **Saída confirmada** | Aluno identificado na saída | Responsável |
| ⚠️ **Atraso** | Entrada após 07h45 | Responsável + Coordenação |
| 🔴 **Pessoa desconhecida** | Rosto não cadastrado | Equipe de segurança |
| 📵 **Câmera offline** | Sem sinal por 5min | Administrador |

### 6.3 Personalizar Mensagens

Acesse **Configurações → WhatsApp → Modelos** para personalizar os textos usando variáveis:
- `{{nome}}` — Nome do aluno
- `{{hora}}` — Hora da identificação
- `{{portaria}}` — Local da câmera

---

## 7. Ranking & Análise Pedagógica

O módulo de **Ranking** oferece insights pedagógicos para coordenadores e diretores.

### 7.1 Acessar o Ranking

Menu lateral → **Ranking** (🏆)

### 7.2 Painéis Disponíveis

| Painel | Métrica | Uso |
|---|---|---|
| 🌟 **Estrelas de Assiduidade** | Top 5 alunos com mais presenças | Reconhecimento positivo |
| ⏰ **Monitoramento de Atrasos** | Top 5 com mais atrasos | Intervenção precoce |
| 🔴 **Risco de Reprovação** | Alunos próximos do limite de faltas (25%) | Ação pedagógica urgente |

### 7.3 Exportar Relatório

Clique no ícone de download (↓) no canto superior direito para exportar o ranking em **CSV**.

---

## 8. Relatórios e Exportação

### 8.1 Relatório de Frequência

**Relatórios → Frequência**
- Filtrar por: Período, Turma, Aluno
- Formatos: PDF, Excel (.xlsx), CSV
- Geração em menos de 10 segundos

### 8.2 Relatório de Visitantes

**Relatórios → Visitantes**
- Lista de entradas de pessoas não cadastradas
- Inclui timestamp e câmera (foto borrada — LGPD)

### 8.3 Agendamento Automático

Configure relatórios automáticos mensais:
**Configurações → Relatórios → Agendamento**
- Escolha o dia do mês
- Informe o e-mail de destino
- O PDF será enviado automaticamente

---

## 9. LGPD e Privacidade

O Áquila Pro foi projetado com **Privacy by Design** em conformidade com a LGPD (Lei 13.709/2018).

### 9.1 Base Legal

O tratamento de dados biométricos no Áquila Pro é baseado em:
- **Art. 11, I** — Consentimento específico e destacado do titular
- **Art. 11, II, g** — Tutela da saúde e segurança

### 9.2 Gestão de Consentimento

**Configurações → LGPD → Gerenciar Consentimentos**
- Visualize quem deu e quem revogou consentimento
- Gere relatório de conformidade
- O sistema bloqueia automaticamente a identificação de alunos sem consentimento

### 9.3 Direito ao Esquecimento

Para atender a solicitação de exclusão de dados (Art. 18, VI):
1. **Alunos → Selecionar aluno → Excluir Dados Biométricos**
2. Confirme a exclusão — o processo é irreversível
3. O sistema gera um comprovante de exclusão para arquivo

### 9.4 Política de Retenção

- Logs de acesso: **90 dias** (configurável)
- Fotos de captura: **30 dias** (configurável)
- Dados de frequência: **5 anos** (exigência legal educacional)

---

## 10. Configurações do Sistema

| Seção | Configurações disponíveis |
|---|---|
| **Geral** | Nome da escola, fuso horário, idioma |
| **Usuários** | Criar, editar, definir roles (Admin, Diretor, Professor) |
| **Câmeras** | Adicionar/remover câmeras, testes de conexão |
| **WhatsApp** | Conectar/desconectar, modelos de mensagem, rate limit |
| **LGPD** | Termos, consentimentos, política de retenção |
| **Relatórios** | Agendamento, formatos, destinatários |
| **Segurança** | Senha, 2FA, sessões ativas |
| **Conectividade** | Sincronização cloud (plano Pro/Enterprise) |
| **Dados** | Backup, purga manual, exportação LGPD |

---

## 11. Perguntas Frequentes

**O sistema funciona sem internet?**
Sim. O reconhecimento facial é processado 100% localmente. A internet é usada apenas para envio de WhatsApp e sincronização cloud (opcional).

**Quantas câmeras posso usar?**
Depende do plano: Essencial (2), Pro (8), Enterprise (ilimitadas). Câmeras adicionais podem ser adquiridas separadamente.

**O que acontece se a câmera ficar offline?**
O sistema emite um alerta imediato para o administrador e registra o tempo de inatividade.

**Os dados ficam armazenados na nuvem?**
Não. Todos os dados biométricos ficam no servidor local da escola. A sincronização cloud (opcional) envia **apenas dados agregados e anonimizados**.

**Como atualizo o sistema?**
O Áquila Pro atualiza-se automaticamente. Um ícone aparece na barra superior quando há nova versão disponível.

---

## 12. Suporte Técnico

| Canal | Horário | Tempo de resposta |
|---|---|---|
| 📱 **WhatsApp** | Seg-Sex 8h-18h | < 2 horas |
| 📧 **E-mail** | 24/7 | < 24 horas |
| 📞 **Telefone** | Seg-Sex 9h-17h | Imediato |

**WhatsApp:** [+55 61 99962-3099](https://wa.me/5561999623099)
**E-mail:** suporte@aquilapro.com.br

---

*Manual do Usuário Áquila Pro v1.0 — Março 2026*
*© 2026 Áquila Pro. Todos os direitos reservados.*
