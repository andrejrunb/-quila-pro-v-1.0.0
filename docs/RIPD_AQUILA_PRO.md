# Relatório de Impacto à Proteção de Dados Pessoais (RIPD / DPIA) — Áquila Pro

**Versão:** 2.2.0 (Homologação Pós-Auditoria ANPD / CNE 2026)  
**Fundamentação Legal:**  
- **Lei nº 13.709/2018 (LGPD):** Arts. 5º, XVII, 6º, 11, 14, 16, 38 e 46.  
- **ANPD — Processo nº 00261.007049/2024-06 (Caso Paraná):** Nota Técnica nº 4/2026/FIS/CGF/ANPD e Despacho Decisório nº 2/2026/SFI (agosto de 2026).  
- **Lei nº 15.211/2025 (ECA Digital):** Proteção integral de crianças e adolescentes em ambientes digitais.  
- **Lei nº 9.394/1996 (LDB), Art. 12, VIII, "a" (atualizado pela Lei nº 15.231/2025):** Notificação de infrequência escolar superior a 30% ao Conselho Tutelar.  
- **Parecer CNE/CP nº 15/2026 (aprovado em 01/09/2026):** Diretrizes para uso de Inteligência Artificial na Educação Básica com supervisão humana obrigatória.

---

## 1. Identificação dos Agentes de Tratamento e Encarregado (DPO)

| Papel na LGPD | Entidade Responsável | Escopo de Atuação |
| :--- | :--- | :--- |
| **Controlador (Art. 5º, VI)** | Instituição de Ensino / Mantenedora Escolar Contratante | Define a finalidade do registro acadêmico, frequência escolar e políticas disciplinares. |
| **Operador / Fornecedor Tecnológico (Art. 5º, VII)** | Ecossistema Áquila Pro (Licenciamento de Software On-Premise) | Fornece o núcleo de software instalado localmente no servidor da escola (`SQLite WAL`). |
| **Encarregado / DPO (Art. 41)** | Nomeado formalmente pela Instituição de Ensino | Responsável por assinar este RIPD antes de qualquer ativação de módulo sensível e atender titulares (Art. 18). |

---

## 2. Descrição dos Fluxos de Dados e Fronteira Perimetral (Local vs. Nuvem)

### 2.1 Dados Mantidos 100% no Servidor Local da Escola (`aquila.db` em modo WAL)
- **Dados Cadastrais e Acadêmicos:** Nome completo, matrícula, série/turma, notas bimestrais, diário de classe e histórico de presença diária.
- **Dados Pedagógicos Inclusivos (PEI/AEE):** Adaptações curriculares DOK 1–4, protegidas por controle de acesso estrito baseado em função (RBAC) e criptografia em repouso (`AES-256-GCM`).
- **Trilha Forense de Auditoria:** Tabela `zero_bypass_audits` encadeada por hash `SHA-256` com higienização automática de PII (`[REDACTED_BY_LGPD_GUARD]`).

### 2.2 Conectores de Nuvem Opcionais (`AQUILA_ENABLE_CLOUD_CONNECTORS=false` por padrão)
- **Módulo Financeiro (Stripe Connect / PIX EMV):** Quando contratado pela escola, trafega exclusivamente os metadados financeiros do **responsável legal/financeiro** (valor da mensalidade, identificador de fatura e status de liquidação). **Nenhum dado pedagógico, de saúde, frequência ou disciplinar do estudante menor de idade é enviado à Stripe.**
- **Mensageria Oficial (WhatsApp Meta Cloud API):** Trafega exclusivamente comunicados institucionais autorizados utilizando as credenciais oficiais da própria escola.

---

## 3. Quarentena Biométrica de Fábrica e Cumprimento do Precedente ANPD (Caso Paraná 2026)

Em observância estrita ao **Despacho Decisório nº 2/2026/SFI e à Nota Técnica nº 4/2026/FIS/CGF/ANPD (Processo nº 00261.007049/2024-06)**, o Áquila Pro implementa em código (`LGPDService.ts` e `ZeroBypassAuditService.ts`) as seguintes salvaguardas técnicas obrigatórias:

1. **Caminho Padrão Primário Não-Biométrico (`QR_CARD_OR_NOMINAL_CALL`):**
   - A frequência escolar e o acesso à portaria operam por padrão via **Crachá QR Dinâmico** e **Chamada Nominal Assistida pelo Professor**.
   - É tecnicamente proibido impor qualquer restrição, fila diferenciada, perda de funcionalidade ou ônus aos estudantes e famílias que utilizem o caminho padrão não-biométrico.
2. **Desativação de Fábrica (`BIOMETRIC_ATTENDANCE_ENABLED=false`):**
   - O módulo de visão computacional biométrica vem **desativado por padrão**.
   - O método `ZeroBypassAuditService.assertBiometricAttendanceAllowed()` bloqueia em tempo de execução qualquer tentativa de captura biométrica se não houver simultaneamente:
     - Flag institucional explícita (`BIOMETRIC_ATTENDANCE_ENABLED=true`);
     - Hash criptográfico deste **RIPD Institucional aprovado e assinado pelo DPO da escola** (`ripdDocumentHash` registrado com ação `RIPD_INSTITUCIONAL_APROVADO`);
     - Consentimento parental específico, destacado, granular e livremente revogável (LGPD Art. 14, § 1º).
3. **Proibição de Imagens Brutas e Armazenamento Unidirecional:**
   - Caso habilitado após aprovação do RIPD, nenhuma foto ou vídeo bruto de menor é armazenado para fins de chamada; utiliza-se apenas representação vetorial 512-D cifrada com `AES-256-GCM` / Windows DPAPI local, com expurgo imediato (`hardDeleteStudentBiometrics`) mediante simples clique de revogação no Portal da Família.

---

## 4. Supervisão Humana Docente e Proteção Contra Perfilamento (CNE 15/2026 & ECA Digital)

1. **Centralidade Docente e Bloqueio `RASCUNHO_IA` (Parecer CNE/CP nº 15/2026):**
   - O `OmrCorrectionService.createTemplate()` bloqueia tecnicamente a publicação de qualquer avaliação que contenha itens com status `RASCUNHO_IA` não revisados por um professor humano.
   - O estudante e sua família possuem direito garantido de revisão e contestação manual de qualquer leitura óptica de cartão-resposta (OMR).
2. **Design Ético Livre de Mecânicas Predatórias (Lei nº 15.211/2025 — ECA Digital):**
   - O motor de jogos interativos (`WordwallGameEngine`) e a Câmara de Cosméticos (`StudentCosmeticsChamber`) utilizam exclusivamente a moeda de mérito acadêmico `Aureus`, conquistada por resolução de atividades curriculares BNCC, com **zero microtransações financeiras, zero caixas de recompensa aleatória (*lootboxes*) e zero perfilamento comportamental comercial**.

---

## 5. Matriz de Riscos e Medidas de Mitigação

| Risco Identificado | Probabilidade | Impacto | Medida Técnica / Organizacional Implementada | Status |
| :--- | :---: | :---: | :--- | :---: |
| Coleta biométrica de menor sem necessidade/proporcionalidade (Caso Paraná ANPD) | Baixa | Crítico | Desativação de fábrica (`BIOMETRIC_ATTENDANCE_ENABLED=false`) + trava `assertBiometricAttendanceAllowed` exigindo RIPD assinado + Crachá QR como padrão. | **Mitigado em Código** |
| Publicação de nota ou questão gerada por IA sem revisão docente | Baixa | Alto | Trava `RASCUNHO_IA` em `OmrCorrectionService.ts` + Kernel OMR determinístico local (`kernel_omr.py`) auditável por questão. | **Mitigado em Código** |
| Corrupção do banco local SQLite em queda de energia na escola | Média | Alto | Modo `PRAGMA journal_mode=WAL` + script transacional `scripts/restore_edge.ps1` com verificação de Magic Header, `PRAGMA integrity_check` e rollback atômico. | **Mitigado em Código** |
| Retenção excessiva de registros após encerramento do vínculo escolar | Baixa | Médio | `LGPDPolicyEngine` e `LGPDService.runDataPurge()` com expurgo programado e recibo `SHA-256` em `zero_bypass_audits`. | **Mitigado em Código** |

---

## 6. Termo de Aprovação Institucional (Preenchimento Obrigatório pela Escola antes do Go-Live)

- **Instituição de Ensino / Mantenedora:** `____________________________________________________`
- **CNPJ:** `_____________________________`
- **Encarregado pelo Tratamento de Dados (DPO):** `__________________________________________`
- **Decisão Institucional sobre Frequência Escolar:**
  - `[ X ]` Operar exclusivamente via **Crachá QR Dinâmico e Chamada Nominal Docente** (Configuração Padrão Recomendada — Biometria Desativada).
  - `[   ]` Habilitar módulo biométrico opcional mediante adendo específico de necessidade/proporcionalidade e coleta de consentimento granular não condicionante.
- **Data e Assinatura Digital / Hash SHA-256:** `_______________________________________________`
