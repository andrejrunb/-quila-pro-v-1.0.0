# Áquila Elo: Especificação de Produto e Arquitetura (v1.0)

**Visão Geral do Produto**: Uma plataforma oficial de mensajeria institucional integrada ao ecossistema Áquila OS, eliminando o uso de WhatsApp/Telegram para fins escolares. Foco em trilha de auditoria, privacidade (LGPD) e eficiência pedagógica.

---

## 1. Personas e Histórias de Usuário

### 👨‍👩‍👧‍👦 Pais / Responsáveis
*   **História 1**: "Como Pai, quero receber apenas comunicados pertinentes ao meu filho para não me perder em grupos com 300 mensagens irrelevantes."
*   **História 2**: "Como Responsável, quero autorizar uma excursão clicando em um botão com validade jurídica."
*   **Permissões**: Ver filhos vinculados, responder threads autorizadas, solicitar atendimento (tickets).

### 👩‍🏫 Professores
*   **História 1**: "Como Professor, quero informar a lição de casa em 30 segundos usando um template pronto."
*   **História 2**: "Como Professor, quero que minhas mensagens sejam entregues apenas em horário comercial (Saúde Digital)."
*   **Permissões**: Envio massivo por turma/segmento, criação de enquetes, anexo de evidências pedagógicas.

---

## 2. Modelo de Canais e Organização

### 2.1 Estrutura de Espaços
1.  **Espaço Escola (Broadcast)**: Somente leitura. Avisos críticos, feriados, segurança.
2.  **Espaço Segmento (Coordenação)**: Comunicação curricular específica.
3.  **Espaço Turma (Interact)**: Threads moderadas. O professor posta o comunicado; pais podem comentar apenas *naquela* mensagem (evita mensagens de "bom dia" soltas).
4.  **Espaço Individual (1:1)**: Atendimento direto via sistema de Triagem (Tickets).

---

## 3. Funcionalidades de Mensagem (UX & Negócio)

### 3.1 Mensagens Estruturadas (Templates)
*   **Card de Prova**: [Disciplina] [Data] [Conteúdo]. Gera lembrete automático no calendário do aluno e pai.
*   **Autorização de Passeio**: Botão "AUTORIZAR". Captura: GPS do dispositivo, Timestamp e ID do Responsável.
*   **Alerta Emergencial**: Cor de fundo vermelha, ignora "Modo Silêncio", persistente até ser lido.

### 3.2 Engajamento e Auditoria
*   **Status Dinâmico**: Enviado -> Entregue -> Lido -> **Confirmado** (para templates que exigem ação).
*   **Analytics**: O gestor vê: "Aviso de Reunião: 85% de leitura em 2 horas. 15 famílias não leram (enviar SMS de backup)."

---

## 4. Segurança e Privacidade (LGPD)

*   **Identidade Zero-Leak**: Pais não veem o telefone dos professores ou de outros pais.
*   **Retenção**: Mensagens mantidas por 5 anos (obrigação legal escolar).
*   **Auditoria**: Log de quem visualizou cada anexo e quando.
*   **RBAC**: Coordenadores financeiros não têm acesso a conversas pedagógicas.

---

## 5. Mapa de Telas (UX)

1.  **Dashboard de Entrada**: Lista de conversas fixadas e "Alertas Pendentes".
2.  **Feed de Turma**: Linha do tempo de comunicados estruturados.
3.  **Calendário Unificado**: Eventos, provas e lembretes integrados às mensagens.
4.  **Central de Atendimento**: Meus pedidos de conversa com a escola.
5.  **Painel de Gestão (Web)**: Analytics de engajamento e disparos massivos.

---

## 6. Backlog de Epics (MVP)

*   **EPIC 1: Infraestrutura de Mensageria**
    *   *Story*: Como Admin, quero importar dados do SIS para criar canais de turma automaticamente.
*   **EPIC 2: Canais Moderados**
    *   *Story*: Como Escola, quero restringir quem pode postar comunicados em cada canal.
*   **EPIC 3: Templates e Autorizações**
    *   *Story*: Como Pai, quero autorizar eventos do calendário via biometria do celular.
*   **EPIC 4: Saúde Digital**
    *   *Story*: Como Professor, quero silenciar notificações fora do horário de aula.

---

**Resumo Executivo**:
O **Áquila Elo** transformará a comunicação escolar de um "caos informal" para um "fluxo estruturado e auditável". Reduziremos em 70% o ruído de mensagens e daremos 100% de segurança jurídica para autorizações e avisos críticos, tudo integrado em tempo real ao cérebro do Áquila OS.
