# Matriz de Veracidade Técnica, Portais e Diretrizes de Marketing — Áquila Pro

Documento normativo homologado em 07 de novembro de 2026.
Base de auditoria: `main` (commit `c022ee55`).

---

## 1. Princípio Fundamental de Veracidade (Anti-Hallucination Marketing)

O posicionamento comercial do Áquila Pro é estritamente condicionado ao que está implementado, testado e auditável no código-fonte. Ficam banidas do site, apresentações e materiais de divulgação afirmações que não tenham correspondência técnica concreta.

---

## 2. Matriz Oficial de Divulgação (O que pode vs. O que não pode)

| Capacidade | O que o Código Executa | Diretriz para o Site / Marketing |
| :--- | :--- | :--- |
| **Chamada & Diário Digital** | Persistência local no SQLite WAL via `AttendanceCall` e `TeacherDailyReport`. | **Pode divulgar livremente.** |
| **Correção de Provas (OMR)** | Processamento óptico neural via Colab GPU. Fallback offline bloqueado fora de testes (`OmrCorrectionService:118-132`). | **Divulgar apenas como "Correção Assistida por IA em Nuvem Segura". PROIBIDO divulgar "OMR Offline"** até integração de modelo de visão local no Edge. |
| **"100% Local / Sem Nuvem"** | Servidor Edge guarda banco e biometria; serviços como Colab, WhatsApp Meta API e Stripe usam nuvem. | **Substituir por: "Soberania de Dados: prontuários, notas e biometria ficam 100% no servidor local da escola; integrações financeiras e mensageria utilizam nuvens seguras homologadas."** |
| **Cobrança & PIX** | Geração de payload e QR Code no padrão EMV do Banco Central. Sem baixa automática bancária local direta. | **Divulgar: "Geração de QR Code PIX no padrão Banco Central". PROIBIDO prometer "Baixa automática via Open Finance/PSP"** sem conector bancário ativo. |
| **Assinatura Digital ICP-Brasil** | Apenas rotulação de string no gateway mobile. Sem biblioteca de certificados X.509 / PKCS#11. | **PROIBIDO divulgar ICP-Brasil.** Citar "Recibos digitais com hash de integridade SHA-256". |
| **RFID na Portaria** | Inexistente no código; portaria opera via Crachá QR dinâmico e leitor facial. | **PROIBIDO divulgar RFID.** Divulgar "Controle de Acesso por Crachá QR e Reconhecimento Facial Consentido". |
| **WhatsApp Oficial** | Integração via Meta Cloud API oficial (`WhatsAppIntegration.ts`). | **Divulgar como "Módulo de Comunicação WhatsApp via API Oficial da Meta (requer credenciais institucionais da escola)".** |
| **Biometria Facial de Menores** | Worker dedicado Python/Node com embeddings 512-D e consentimento por responsável. | **Divulgar com ênfase em conformidade: "Biometria Facial Opt-in com Matriz de Consentimento Parental Estrita (LGPD Art. 14)". Sempre oferecer alternativa não biométrica.** |
| **Criptografia & Auditoria** | AES-256-GCM com chave de máquina local (`.aquila_machine_key`), SQLite WAL e `zero_bypass_audits` com SHA-256. | **Pode divulgar com rigor técnico:** "Criptografia AES-256-GCM em repouso e trilha de auditoria imutável". |
| **Indicadores do Cockpit** | Dados pré-definidos de interface (R$ 450K, 98% adimplência, NPS 89). | **PROIBIDO divulgar como métricas de clientes reais.** Apresentar apenas como "Demonstração de Cockpit Executivo". |
| **Validação de Testes** | 20/20 casos de bancada e 10/10 critérios LangGraph aprovados em bancada. | **Divulgar estritamente como "Bateria de 20 casos de testes automatizados de bancada e resiliência interna", NUNCA como "testado em escola real".** |

---

## 3. Respostas às 3 Decisões Estratégicas do Site

### Pergunta 1: Onde o site deve ficar hospedado?
- **Decisão Técnica Recomendada:** **Manter o site em `apps/web` no monorepo e configurar deploy automático na Vercel ou Cloudflare Pages.**
  - **Motivo:** O diretório `apps/web/src/app` já possui todas as 8 rotas prontas (`produto`, `solucoes`, `seguranca-lgpd`, `precos`, `casos`, `contato`, `blog`). Ele compartilha os types com `@aquila/api`.
  - Usar um repositório isolado (`aquila-pro-website`) só se justificaria se uma equipe de marketing externa sem acesso ao código do Electron fosse editá-lo. Como o desenvolvimento é unificado, manter em `apps/web` evita drift de código e duplicação de esforço.

### Pergunta 2: Qual o público-alvo prioritário?
- **Decisão Comercial Recomendada:** **Escolas particulares (K-12 / Educação Básica) como foco primário (80%), com abertura para Redes e Grupos de Ensino no plano corporativo (20%).**
  - **Motivo:** O ciclo de decisão em escolas particulares é ágil (diretor/mantenedor decide em 15–30 dias). A dor de perder conexão de internet durante a aula ou sofrer notificações do Procon/Ministério Público por vazamento de dados de menores (LGPD Art. 14) é aguda e imediata.
  - Redes de ensino públicas têm licitações lentas (6–18 meses), devendo ser abordadas em um segundo momento via plano Elite.

### Pergunta 3: Mostramos preços ou só "Falar com Consultor"?
- **Decisão Comercial Recomendada:** **Não exibir valores em reais (R$). Exibir os 3 Tiers com matriz comparativa e CTA "Solicitar Demonstração / Falar com um Especialista".**
  - **Motivo:** Em vendas B2B escolares, o ticket depende do número de alunos, turnos e módulos contratados (ex: se inclui ou não módulo financeiro/Stripe). Preços fixos públicos espantam colégios grandes e desvalorizam o produto perante diretores que exigem onboarding consultivo e contrato personalizado.
