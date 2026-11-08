# Matriz de Veracidade Técnica, Portais e Diretrizes de Marketing — Áquila Pro

Documento normativo homologado e atualizado em 08 de novembro de 2026 (Pós-Auditoria do Enxame Multi-IA).
Base de auditoria: `main` (commit `c847f724` + Kernel OMR Determinístico Local + Dossiê ANPD/CNE 2026).

---

## 1. Princípio Fundamental de Veracidade (Anti-Hallucination Marketing)

O posicionamento comercial do Áquila Pro é estritamente condicionado ao que está implementado, testado e auditável no código-fonte. Ficam banidas do site, apresentações e materiais de divulgação afirmações que não tenham correspondência técnica concreta ou amparo regulatório verificado.

---

## 2. Matriz Oficial de Divulgação (O que pode vs. O que não pode)

| Capacidade | O que o Código Executa | Diretriz para o Site / Marketing |
| :--- | :--- | :--- |
| **Chamada & Diário Digital** | Persistência local no SQLite WAL via `AttendanceCall` e `TeacherDailyReport`. | **Pode divulgar livremente.** |
| **Correção de Provas (OMR)** | Processamento óptico neural via Colab GPU + Kernel OMR Determinístico Local em Python/OpenCV (`kernel_omr.py` com binarização de Sauvola + Homografia $3\times 3$ + densidade circular $\tau \ge 0.35$). Nenhum gerador sequencial fictício (`A, B, C, D, E`) existe no código. | **Divulgar como "Correção Assistida por Visão Computacional (Híbrida: Kernel Óptico Local OpenCV + Nuvem GPU)".** Em provas oficiais reais, exigir revisão docente antes da publicação da nota (Parecer CNE/CP nº 15/2026). |
| **"100% Local / Sem Nuvem"** | Servidor Edge guarda banco e biometria; serviços como Colab, WhatsApp Meta API e Stripe Connect usam nuvem. | **Substituir por: "Soberania de Dados: prontuários, notas e dados sensíveis ficam no servidor local da escola; pagamentos (Stripe Connect) e mensageria (WhatsApp Meta API) trafegam apenas os metadados estritamente necessários em nuvens homologadas."** |
| **Cobrança & PIX / Stripe** | Geração de payload e QR Code no padrão EMV do Banco Central; plano Stripe Connect processa dados de pagamento na nuvem da Stripe. | **Divulgar claramente qual dado vai para o Stripe (apenas cobrança/pagamento financeiro) e qual dado permanece local (prontuário pedagógico e frequência).** |
| **Assinatura Digital ICP-Brasil** | Apenas rotulação de string no gateway mobile. Sem biblioteca de certificados X.509 / PKCS#11. | **PROIBIDO divulgar ICP-Brasil.** Citar "Recibos digitais com hash de integridade SHA-256". |
| **RFID na Portaria** | Inexistente no código; portaria opera via Crachá QR dinâmico e chamada manual como padrão. | **PROIBIDO divulgar RFID.** Divulgar "Controle de Acesso por Crachá QR Dinâmico (Padrão Primário)". |
| **WhatsApp Oficial** | Integração via Meta Cloud API oficial (`WhatsAppIntegration.ts`). | **Divulgar como "Módulo de Comunicação WhatsApp via API Oficial da Meta (requer credenciais institucionais da escola)".** |
| **Biometria Facial de Menores (ANPD Caso Paraná 2026)** | **DESATIVADA POR PADRÃO (`BIOMETRIC_ATTENDANCE_ENABLED=false`)** em estrita observância ao **Despacho Decisório nº 2/2026/SFI e Nota Técnica nº 4/2026 da ANPD (Processo 00261.007049/2024-06)**. O caminho primário e padrão da escola é **Crachá QR / Cartão / Chamada Manual sem penalidade**. | **PROIBIDO divulgar biometria facial de menores como recurso ativo por padrão ou afirmar que "processamento local + consentimento" bastam sozinhos.** Divulgar: "Frequência por Crachá QR e Chamada Digital por padrão; módulo biométrico bloqueado de fábrica, ativável apenas mediante RIPD institucional aprovado pela mantenedora e opt-in granular não condicionante (LGPD Art. 11 e 14)." |
| **IA Pedagógica & Supervisão Docente (CNE 2026)** | Mentor Socrático Albus (`ALBUS_SOCRATIC_SYSTEM_PROMPT`), andaimes PEI/AEE (DOK 1–4) e bloqueio HITL de itens `RASCUNHO_IA`. | **Conformidade com o Parecer CNE/CP nº 15/2026 (aprovado em 01/09/2026, aguardando homologação MEC) e Lei nº 15.211/2025 (ECA Digital):** Centralidade docente, supervisão humana obrigatória e direito de contestação de resultados automatizados. |
| **Alerta de Infrequência Escolar (LDB Atualizada)** | Monitoramento preventivo de faltas escolares para busca ativa. | **Citar o dispositivo legal correto: Art. 12, inciso VIII, alínea "a" da LDB (Lei nº 9.394/1996, atualizado pela Lei nº 15.231/2025)** — notificação ao Conselho Tutelar para faltas acima de **30%** do percentual permitido. (Jamais citar o inciso VII para essa obrigação). |
| **Criptografia & Auditoria** | AES-256-GCM com chave de máquina local (`.aquila_machine_key`), SQLite WAL e `zero_bypass_audits` com SHA-256. | **Pode divulgar com rigor técnico:** "Criptografia AES-256-GCM em repouso e trilha de auditoria imutável". |
| **Indicadores do Cockpit** | Dados pré-definidos de interface (R$ 450K, 98% adimplência, NPS 89). | **PROIBIDO divulgar como métricas de clientes reais.** Apresentar apenas como "Demonstração de Cockpit Executivo". |
| **Validação de Testes** | 20/20 casos de bancada e 10/10 critérios LangGraph aprovados em bancada. | **Divulgar estritamente como "Testes internos automatizados de bancada", NUNCA como "resultado validado em escola real".** |

---

## 3. Respostas às 3 Decisões Estratégicas do Site

### Pergunta 1: Onde o site deve ficar hospedado?
- **Decisão Técnica Recomendada:** **Manter o site em `apps/web` no monorepo (ou espelhá-lo para `aquila-pro-website` via deploy automatizado) com hospedagem na Vercel / Cloudflare Pages.**
  - **Motivo:** O diretório `apps/web/src/app` já possui as 8 rotas prontas (`produto`, `solucoes`, `seguranca-lgpd`, `precos`, `casos`, `contato`, `blog`) e compartilha os contratos com `@aquila/api`.

### Pergunta 2: Qual o público-alvo prioritário?
- **Decisão Comercial Recomendada:** **Escolas particulares (K-12 / Educação Básica) como foco primário (80%), com abertura para Redes e Grupos de Ensino no plano corporativo (20%).**

### Pergunta 3: Mostramos preços ou só "Falar com Consultor"?
- **Decisão Comercial Recomendada:** **Não exibir valores fixos em reais (R$). Exibir os 3 Tiers com matriz comparativa transparente (incluindo o que é processado localmente vs. nuvem financeira) e CTA "Solicitar Demonstração / Falar com um Especialista".**
