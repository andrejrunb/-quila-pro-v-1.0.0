# Diretrizes Nacionais CNE/MEC para Inteligência Artificial — Áquila Pro (Parecer CNE/CP nº 15/2026)

**Status Normativo:** Homologado pelo Ministério da Educação (Despacho de **10 de novembro de 2026**, publicado no Diário Oficial da União em **11 de novembro de 2026**, Edição 212, Seção 1, Página 141).  
**Origem:** Parecer CNE/CP nº 15/2026 (aprovado em 1º de setembro de 2026 pelo Conselho Pleno do Conselho Nacional de Educação — CNE).  
**Abrangência:** Educação Básica ao Ensino Superior, redes pública e privada.  
**Articulação Legal no Áquila Pro:** Lei nº 13.709/2018 (LGPD, Arts. 5º, 6º, 11, 14, 16, 38 e 46), Lei nº 15.211/2025 (ECA Digital), Lei nº 9.394/1996 (LDB Art. 12, VIII, "a", redação da Lei nº 15.231/2025) e Precedente ANPD — Caso Paraná (Processo nº 00261.007049/2024-06, Nota Técnica nº 4/2026 e Despacho Decisório nº 2/2026/SFI).

---

## 1. Princípios Fundamentais & Regência Docente

1. **Centralidade Humana e Autonomia Docente:** A IA no Áquila Pro opera exclusivamente como instrumento complementar de apoio pedagógico e gerencial. É expressamente vedado substituir o professor, sua autoridade pedagógica, a mediação humana ou o vínculo educativo.
2. **Proibição de Decisão Exclusivamente Automatizada:** Nenhuma decisão relevante sobre a trajetória escolar (aprovação, reprovação, certificação, mérito avaliativo, retenção ou sanção disciplinar) pode ocorrer de forma puramente automatizada.
3. **Transparência, Explicabilidade e Direito à Contestação:** Toda análise gerada por IA ou visão computacional (pré-correção OMR, pré-diagnóstico de redação, alerta de evasão ou trilha adaptativa) deve informar sua natureza auxiliar e garantir canal formal de revisão humana e contestação pelo estudante, família ou responsável.
4. **Soberania Local e Vedação Comercial / Treinamento Externo:** Dados educacionais, avaliações e produções intelectuais de alunos e professores permanecem sob controle institucional (`SQLite WAL` local). É proibido utilizar dados escolares para publicidade direcionada, perfilização mercadológica ou treinamento de modelos de IA de terceiros sem autorização legal específica.
5. **Formação Continuada e Letramento Crítico:** Os portais e guias pedagógicos do Áquila Pro apoiam o letramento digital crítico docente exigido para as licenciaturas e formação continuada.

---

## 2. Classificação em 4 Níveis de Risco (Aplicada ao Áquila Pro)

| Nível de Risco (CNE/CP nº 15/2026) | Critério Normativo | Módulos do Áquila Pro Enquadrados | Salvaguardas Obrigatórias em Código & Governança |
| :--- | :--- | :--- | :--- |
| **1. Baixo Risco** | Apoio administrativo/logístico, acessibilidade e organização sem manipulação de dados sensíveis nem perfilamento. | `TimetableSolverService`, diário digital nominal, impressão de crachá QR, organização de materiais e calendário escolar. | Trilha de auditoria padrão, acessibilidade e minimização de dados (LGPD Art. 6º). |
| **2. Risco Moderado** | Apoio ao ensino-aprendizagem ou gestão com recomendações reversíveis e supervisão humana constante. | Tutor Socrático Albus (`ALBUS_SOCRATIC_SYSTEM_PROMPT`), trilhas BNCC (`PedagogicalScaffoldingEngine`), flashcards SRS, playlists curadas e Wordwall gamificado (`Aureus`, sem lootboxes). | Mediação docente, respeito estrito à restrição etária (bloqueio autônomo na Ed. Infantil e 1º–5º ano EF) e proibição de impacto automático em nota. |
| **3. Alto Risco** | Impacto relevante na trajetória escolar, suporte crítico a avaliações, triagem/predição ou processamento de dados comportamentais/acadêmicos em escala. | Pré-correção OMR (`kernel_omr.py` + `OmrCorrectionService`), pré-análise de redações (`SovereignEssayService`), busca ativa preditiva (`DropoutRiskEngine`), simulados TRI / proctoring e biometria opcional sob RIPD. | Bloqueio `RASCUNHO_IA` / validação docente HITL obrigatória antes da publicação, auditoria prévia, transparência algorítmica, `ZeroBypassAuditService` (SHA-256) e direito formal de contestação. |
| **4. Risco Excessivo / Incompatível (PROIBIDO)** | Práticas incompatíveis com os direitos fundamentais, desenvolvimento infantojuvenil e ética educacional. | Qualquer inferência/reconhecimento automatizado de emoções (`MicroExpressionAnalyzer`, `AffectiveAnalyticsService`, `EmotionBridgeService`), vigilância biométrica contínua, *social scoring*, notas autônomas sem docente, punição por detector de IA e uso autônomo por crianças pequenas. | **Vedação imediata em código (`CNE_15_2026_PROHIBITED_*`)**: módulos afetivos neutralizados/bloqueados, biometria desativada de fábrica (`BIOMETRIC_ATTENDANCE_ENABLED=false`) e trava etária ativa. |

---

## 3. Vedações Imediatas (Vigência Imediata após Publicação no DOU)

O Áquila Pro proíbe terminantemente, por arquitetura e diretriz operacional:

1. **Reconhecimento ou Inferência Automatizada de Emoções:** Vedado inferir humor, sentimentos, ansiedade, tédio ou atenção emocional de estudantes por câmeras, microexpressões ou áudio (`MicroExpressionAnalyzer`, `AffectiveAnalyticsService`, `EmotionBridgeService` e telemetria emocional bloqueados conforme Parecer CNE/CP nº 15/2026).
2. **Vigilância Biométrica Contínua & Exploração de Vulnerabilidades:** O caminho primário e padrão é **Crachá QR Dinâmico e Chamada Nominal**. Câmeras biométricas permanecem desativadas de fábrica (`BIOMETRIC_ATTENDANCE_ENABLED=false`) e só podem operar mediante RIPD assinado e consentimento parental granular não condicionante (ANPD Caso Paraná + CNE 15/2026).
3. **Sistemas de Pontuação Social (*Social Scoring*):** Proibido atribuir pontuação social, ranqueamento punitivo ou classificação comportamental automatizada de estudantes.
4. **Notas/Conceitos Exclusivamente Automatizados em Avaliações Autorais:** `OmrCorrectionService`, `SovereignEssayService` e `TeacherHitlQueue` operam estritamente como **pré-diagnóstico / `RASCUNHO_IA`**. A atribuição e homologação da nota oficial cabem exclusivamente ao professor humano.
5. **Punições Baseadas Unicamente em Detectores de IA:** É expressamente proibido aplicar advertência, anulação de prova, reprovação ou sanção disciplinar com base exclusiva em softwares ou escores detectores de texto/conteúdo gerado por IA.
6. **Publicidade Direcionada, Comercialização ou Retreinamento Externo:** Dados educacionais de estudantes e docentes jamais podem alimentar publicidade, monetização comercial ou treinamento de modelos externos de terceiros.

---

## 4. Restrições por Faixa Etária & Etapa de Ensino

| Etapa Escolar | Política no Áquila Pro (`evaluateStageAiPolicy`) | Modo Permitido |
| :--- | :--- | :--- |
| **Educação Infantil** | **Vedado uso direto pelos estudantes.** IA autorizada exclusivamente para o docente (planejamento pedagógico e acessibilidade sob mediação humana direta). | `BLOCKED_INFANTIL_DOCENTE_ONLY` |
| **Anos Iniciais do Ensino Fundamental (1º ao 5º ano EF)** | **Vedado acesso autônomo ou não supervisionado de crianças** a chatbots e ferramentas generativas (como Tutor IA autônomo). Recursos tecnológicos só podem ocorrer em atividades estritamente planejadas, supervisionadas e conduzidas diretamente pelo professor. | `SUPERVISED_TEACHER_MEDIATED_ONLY` |
| **Anos Finais (6º ao 9º ano EF), Ensino Médio e Superior** | Uso pedagógico estruturado (ex.: Tutor Socrático Albus e laboratórios diagnósticos) sob mediação docente, com foco em pensamento crítico e letramento digital. | `TEACHER_MEDIATED_SOCRATIC` |

---

## 5. Governança Institucional, Contratos e Prazos de Adequação

- **Vigência das Proibições (Risco Excessivo):** Aplicação **imediata** a partir da publicação oficial no DOU (11 de novembro de 2026).
- **Prazo Institucional de 12 Meses:** As instituições contratantes e mantenedoras têm o prazo de **12 meses** contados da publicação da norma para adequar:
  1. Políticas internas de IA, Regimento Escolar, Projeto Político-Pedagógico (PPP/PPC/PDI);
  2. Programas de formação docente em letramento crítico e ético em IA;
  3. **Revisão Obrigatória de Contratos com Fornecedores/EdTechs:** Todo contrato externo integrado ao Áquila Pro deve conter cláusulas de governança, transparência algorítmica, responsabilização solidária/clara, direito à auditoria, bloqueio de treinamento externo com dados da escola e conformidade integral à LGPD, ao ECA Digital e ao Parecer CNE/CP nº 15/2026.

---

## 6. Checklist Técnico de Conformidade Verificável no Código

- [x] **Mapeamento de Sala sem Crash (`SeatingIntelligence.tsx`):** Estado `isProjectedSeating` e função `toggleProjection` corrigidos para evitar erro em tempo de execução.
- [x] **Bloqueio de Inferência Emocional (`MicroExpressionAnalyzer.ts`, `AffectiveAnalyticsService.ts`, `EmotionBridgeService.ts`, `FaceRecognition.ts`, `handlers.ts`):** Inferência afetiva automatizada bloqueada por diretriz imediata CNE/CP nº 15/2026.
- [x] **Bloqueio Etário de Tutor IA (`studentGradeScope.ts` & `apps/web/src/app/portal/aluno/page.tsx`):** Educação Infantil e 1º–5º ano EF impedidos de acessar chatbot autônomo.
- [x] **Supervisão Docente HITL (`OmrCorrectionService.ts`, `SovereignEssayService.ts`, `TeacherHitlQueue.tsx`):** Pré-correções marcadas como pendentes de validação docente humana, com canal explícito de contestação.
- [x] **Quarentena Biométrica ANPD (`LGPDService.ts`):** `BIOMETRIC_ATTENDANCE_ENABLED=false` por padrão de fábrica e caminho primário via Crachá QR / Chamada Nominal.
