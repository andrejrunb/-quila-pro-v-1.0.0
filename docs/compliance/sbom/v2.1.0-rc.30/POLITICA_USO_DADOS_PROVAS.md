# Política de Uso de Dados de Provas — Áquila Pro

**Versão:** 1.0  
**Data de Publicação:** 30 de Outubro de 2026  
**Aplicável a:** `v2.1.0-rc.30` e releases posteriores  
**Escopo:** Ingestão, armazenamento, processamento por IA, correção OMR, reutilização, compartilhamento e descarte de provas, questões, gabaritos, respostas e imagens de cartões-resposta.  
**Fundamentos Legais e Normativos:** Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018), Lei de Direitos Autorais (Lei nº 9.610/98), Estatuto da Criança e do Adolescente (ECA - Lei nº 8.069/90) e termos de uso das fontes de conteúdo pedagógico.

---

## 1. Princípios Fundamentais

1. **Finalidade Limitada:** Os dados de provas são utilizados exclusivamente para aplicação, correção, feedback pedagógico, acompanhamento de aprendizagem e gestão autorizada pela instituição escolar conveniada.
2. **Minimização de Dados:** Coleta-se apenas o estritamente necessário para a finalidade declarada; é vedado reter a imagem integral do cartão-resposta quando for tecnicamente viável extrair e reter unicamente as marcações ópticas estruturadas.
3. **Soberania Local por Padrão (Edge-First):** Provas, respostas, matrizes OMR e resultados permanecem fisicamente no ambiente local da escola, salvo sincronização expressamente autorizada, autenticada e cifrada ponta a ponta (TLS 1.3 / AES-256-GCM).
4. **Human-in-the-Loop (HITL) Obrigatório:** Nenhuma questão, gabarito ou correção gerada por inteligência artificial é aplicada em sala de aula ou publicada sem a validação humana formal do professor titular ou coordenação pedagógica.
5. **Rastreabilidade Criptográfica:** Toda ingestão, alteração, processamento por IA, correção, exportação e exclusão gera evento imutável gravado no livro-razão local (`zero_bypass_audits`) com hash SHA-256.
6. **Separação Estrita de Direitos:** A licença de software (BSL 1.1) não autoriza a apropriação ou redistribuição de conteúdos protegidos de terceiros. Provas, enunciados e materiais didáticos exigem registro próprio de origem, autoria e licença.

---

## 2. Classificação dos Dados Pedagógicos

| Classe | Exemplos | Sensibilidade | Regra Padrão de Tratamento |
| :--- | :--- | :---: | :--- |
| **Dado de Prova** | Enunciado, alternativas, gabarito oficial, rubrica, competência BNCC, nível de dificuldade TRI | Média | Circulação restrita aos perfis pedagógicos autorizados da escola. |
| **Resposta do Aluno** | Marcações OMR, respostas digitais, tempo de resposta, histórico de tentativas | Alta | Acesso restrito ao professor da turma, coordenação pedagógica e responsável legal do estudante. |
| **Imagem do Cartão-Resposta** | Foto ou scan do cartão OMR, recortes de bolhas de marcação | Alta | Reter apenas pelo período necessário para validação; descarte da imagem original após consolidação, salvo contestação formal. |
| **Resultado Pedagógico** | Nota bruta, taxa de acertos, escore TRI, proficiência por habilidade | Alta | Agregado e anonimizado por padrão em relatórios executivos de gestão. |
| **Conteúdo de Terceiros** | Itens do ENEM, INEP, vestibulares (FUVEST, UNICAMP), PISA, OBA, OBMEP, editoras privadas | Variável | Depende de registro individual de origem, autoria e permissão contratual expressa. |
| **Conteúdo Autoral Áquila** | Questões originais, templates paramétricos, matrizes de maestria, algoritmos de correção | Proprietária | Uso interno da plataforma e licenciamento conforme contrato de software. |
| **Dados de Treinamento de IA** | Pares pergunta-resposta, explicações socráticas, anotações de correção | Alta | Expressamente proibido sem consentimento institucional formal e prévia anonimização. |

---

## 3. Ciclo de Vida da Avaliação

```
CRIAÇÃO ──> VALIDAÇÃO ──> APLICAÇÃO ──> LEITURA/CORREÇÃO ──> RESULTADO ──> RETENÇÃO/DESCARTE
```

### 3.1 Criação
- Avaliações elaboradas diretamente por professores são de titularidade da escola ou do docente, conforme o respectivo vínculo contratual.
- Questões importadas de fontes externas exigem cadastro prévio no registro de direitos com: fonte, URL de origem, licença, permissão de uso comercial e permissão para processamento por IA.
- Questões geradas ou adaptadas por IA entram compulsoriamente no estado **`RASCUNHO_IA`**.
- O sistema bloqueia a impressão, aplicação e geração de cartão-resposta OMR enquanto qualquer item permanecer no estado `RASCUNHO_IA`.

### 3.2 Validação
- O professor titular confere o enunciado, alternativas, gabarito, fundamentação pedagógica e adequação à faixa etária da turma, assinando a revisão (**`REVISADO_PROFESSOR`**).
- A coordenação pedagógica pode exigir aprovação complementar (**`APROVADO_COORDENACAO`**) para avaliações formais, simulados institucionais ou exames de alto impacto.
- Toda transição de estado registra metadados de auditoria: `reviewedBy`, `reviewedAt`, `approvedBy`, `approvedAt`, versão da questão e hash SHA-256 do conteúdo.
- Qualquer edição posterior no enunciado ou nas alternativas revoga a aprovação e reverte o item para `RASCUNHO_IA`.

### 3.3 Aplicação
- As avaliações podem ser aplicadas em formato impresso (caderno A4 diagramado em duas colunas), digital em ambiente offline local ou folha de respostas física OMR.
- É vedado exigir o uso de dispositivo móvel pessoal do aluno como condição exclusiva de participação.
- Em ambientes desconectados, os dados trafegam exclusivamente na malha local do servidor Edge até autorização de sincronização.

### 3.4 Leitura e Correção
- A leitura óptica (OMR) produz: identificador do cartão, vetor de marcações detectadas, índice de confiança média, flags de suspeita de rasura e resultado estruturado.
- Questões com confiança inferior a **0.85**, marcações duplas ou suspeita de rasura são encaminhadas para a **fila de revisão humana docente**.
- A imagem digitalizada do cartão-resposta é mantida apenas durante a janela regulamentar de contestação e auditoria pedagógica da escola, sendo descartada de forma segura ao término do prazo.

### 3.5 Resultado
- Estudantes e responsáveis legais acessam notas, feedbacks e resoluções comentadas exclusivamente por meio de perfis autenticados.
- Relatórios destinados à direção geral e à mantenedora operam sobre dados agregados por turma, série ou competência curricular.
- A visualização nominal de desempenhos é restrita ao corpo docente e coordenação com justificativa pedagógica legítima.

---

## 4. Diretrizes de Uso por Inteligência Artificial

### 4.1 Casos de Uso Autorizados
A inteligência artificial opera como ferramenta auxiliar subordinada ao professor titular, sendo permitido:
- Estruturar rascunhos de enunciados e alternativas a partir de temas ou bancos autorizados;
- Sugerir melhorias de clareza textual e adequação vocabular à matriz BNCC;
- Elaborar propostas de resolução passo a passo e dicas socráticas progressivas;
- Sintetizar o desempenho agregado e a distribuição estatística de erros da turma;
- Mapear lacunas conceituais e sugerir trilhas formativas individualizadas sob supervisão docente.

### 4.2 Casos de Uso Expressamente Proibidos
É estritamente vedado, sob qualquer pretexto:
- Utilizar provas aplicadas, respostas individuais ou desempenhos nominais para alimentar, pré-treinar ou realizar *fine-tuning* de modelos de IA;
- Incluir avaliações de alunos em datasets SFT públicos, bases de dados RAG compartilhadas ou repositórios externos;
- Transmitir dados a provedores externos de IA sem contrato de proteção de dados, base legal válida e prévia desidentificação;
- Construir perfis comportamentais, psicométricos invasivos ou preditivos desvinculados do acompanhamento pedagógico autorizado;
- Reproduzir conteúdos didáticos de terceiros protegidos por direitos autorais em novos materiais comerciais;
- Processar bancos de questões ou provas de concorrentes e escolas terceiras sem licença expressa.

### 4.3 Regra de Contenção de Processamento Remoto
Quando o processamento exigir modelos remotos em cluster GPU (ex: NVIDIA NIM ou Colab A100), o sistema aplica:
1. Expurgamento total de identificadores diretos (nome, CPF, matrícula ou turma do estudante);
2. Envio estrito do payload mínimo necessário para a operação linguística;
3. Registro imutável de telemetria: provedor, modelo, versão, finalidade e hash do payload;
4. Bloqueio absoluto do envio de fotografias de cartões-resposta, imagens biométricas ou dados sensíveis de menores;
5. Exigência contratual de não-retenção e proibição de treinamento pelo fornecedor do modelo (*Zero Data Retention SLA*);
6. Disponibilidade compulsória de modo de fallback local com processamento determinístico offline.

---

## 5. Direitos Autorais e Proveniência de Conteúdo

Nenhum item pedagógico é incorporado ao acervo ativo da plataforma sem cadastro no registro de direitos ([`content-rights-register.json`](file:///c:/aquila/content-rights-register.json)):

```json
{
  "contentId": "CNT-EXAMS-INEP-ENEM",
  "title": "Avaliações Oficiais INEP / ENEM (Provas e Gabaritos 2010-2024)",
  "source": "INEP",
  "sourceUrl": "https://www.gov.br/inep",
  "license": "Uso institucional conforme termos da fonte",
  "commercialUse": false,
  "aiTrainingAllowed": false,
  "aiProcessingAllowed": true,
  "retentionPolicy": "Até exclusão pela escola",
  "contentHash": "D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5",
  "approvedBy": "coordenacao@escola.br",
  "approvedAt": "2026-10-30T15:00:00-03:00"
}
```

### Regras Aplicáveis por Origem de Conteúdo

| Origem do Conteúdo | Uso no Áquila Pro | Treinamento de IA | Distribuição Comercial |
| :--- | :--- | :--- | :--- |
| **Autoria Própria da Escola** | Permitido no ambiente da instituição contratante | Permitido unicamente com autorização expressa da escola | Conforme contrato de licenciamento |
| **Autoria Própria Equipe Áquila** | Permitido | Permitido | Conforme termos da BSL 1.1 |
| **OpenStax & PhET (CC-BY 4.0)** | Permitido com preservação integral de atribuição e links | Avaliado individualmente por item | Permitido com créditos obrigatórios |
| **ENEM, INEP e Vestibulares** | Permitido mediante validação prévia de autoria e termos de cada edição | Proibido por padrão | Proibido sem anuência expressa |
| **PISA, TIMSS e NAEP** | Tier 2 (Quarentena) até homologação de termos internacionais | Proibido por padrão | Proibido |
| **Olimpíadas (OBA, OBMEP - CC-BY-NC-SA)** | Tier 2 (Quarentena) em produtos comerciais | Proibido por padrão | Proibido sem licença comercial prévia |
| **Editoras Comerciais Privadas** | Quarentena Estrita; permitidos apenas metadados de catálogo PNLD | Proibido | Proibido |
| **H5P Módulos Upstream GPL v3** | Quarentena; excluídos do pacote comercial (utilizar clean-room TS) | Não aplicável | Bloqueado para instalador BSL 1.1 |

---

## 6. Matriz de Acesso e Permissões por Perfil

| Perfil de Usuário | Conteúdo da Prova | Resposta Individual | Imagem OMR | Resultado Agregado | Treinamento de IA |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Aluno** | Visualiza prova aplicada | Visualiza as próprias | Bloqueado | Visualiza o próprio | Bloqueado |
| **Responsável Legal** | Conforme política da escola | Visualiza do dependente | Bloqueado | Visualiza do dependente | Bloqueado |
| **Professor Titular** | Cria, edita e aplica | Visualiza da sua turma | Visualiza para revisão HITL | Visualiza da sua turma | Solicitação sujeita a DPO |
| **Coordenação Pedagógica** | Aprova e publica itens | Visualiza da escola | Visualiza em auditoria | Visualiza da escola | Autoriza junto ao DPO |
| **Direção Geral** | Visualiza | Acesso restrito auditado | Bloqueado por padrão | Visualiza agregado | Autoriza junto ao DPO |
| **Mantenedora / Rede** | Bloqueado por padrão | Bloqueado | Bloqueado | Visualiza agregado | Bloqueado |
| **Suporte Técnico Áquila** | Bloqueado por padrão | Bloqueado | Bloqueado (exceto incidente aprovado) | Bloqueado | Bloqueado |

---

## 7. Retenção e Descarte Seguro de Dados

| Categoria do Dado | Período de Retenção Padrão | Procedimento de Descarte |
| :--- | :--- | :--- |
| **Questão Autoral Aprovada** | Enquanto a instituição mantiver o acervo pedagógico ativo | Exclusão física ou exportação mediante solicitação autorizada |
| **Prova Aplicada** | Ciclo letivo corrente + prazo regulamentar de guarda escolar | Anonimização estatística ou exclusão do banco de dados |
| **Resposta Individual** | Ciclo letivo corrente + janela de recurso/contestação de notas | Desvinculação cadastral e exclusão de identificadores |
| **Imagem do Cartão OMR** | Até homologação do resultado ou término do prazo recursal | Sobregravação segura e exclusão do armazenamento temporário |
| **Logs de Processamento IA** | Período estritamente necessário para conformidade e auditoria | Anonimização e expurgo da trilha não essencial |
| **Dados de Estudante Desligado** | Conforme política de retenção escolar e exigências legais do MEC | Anonimização irreversível ou expurgo com termo de baixa |

Toda exclusão gera registro imutável com data, operador, motivo e hash SHA-256 do item removido, preservando a higidez da trilha de auditoria sem reter os dados pessoais expurgados.

---

## 8. Trilha de Auditoria e Requisitos Técnicos de Log

Toda mutação de estado relevante grava um evento assinado na tabela `zero_bypass_audits`, estruturado com:
- `eventType`: Identificador do evento (`EXAM_INGESTED`, `AI_DRAFT_GENERATED`, `TEACHER_REVIEWED`, `OMR_SCANNED`, etc.);
- `schoolId`: Código identificador da unidade escolar;
- `userId`: Identificação do operador autenticado;
- `studentId`: Pseudônimo criptográfico do estudante (sem exposição de CPF ou biometria crua);
- `examId` e `questionId`: Identificadores dos recursos pedagógicos;
- `aiModel`: Nome e versão do modelo de IA (ou `rules-engine-local`);
- `dataCategories`: Classes de dados acessadas ou modificadas;
- `legalBasis`: Enquadramento legal sob a LGPD (ex: Cumprimento de Obrigação Legal, Execução de Contrato);
- `purpose`: Finalidade pedagógica legítima declarada;
- `contentHash`: Hash SHA-256 do estado anterior e posterior do registro;
- `timestamp`: Carimbo de data/hora ISO 8601 em fuso UTC;
- `result`: Veredito da operação (`SUCCESS`, `BLOCKED`, `FLAGGED_HITL`);
- `humanApproval`: Identificador e assinatura do docente ou gestor responsável.

---

## 9. Plano de Resposta a Incidentes de Segurança e Privacidade

Diante de qualquer suspeita de acesso indevido, vazamento de gabaritos, transmissão irregular a provedores de nuvem ou ingestão de conteúdo protegido sem licença:
1. **Contenção Imediata:** Bloqueio do fluxo funcional afetado e revogação das sessões ativas;
2. **Preservação Forense:** Isolamento dos registros de log do SQLite WAL e geração de imagem de integridade;
3. **Notificação Interna:** Comunicação formal ao Encarregado pelo Tratamento de Dados (DPO) e à Direção Escolar em até 4 horas;
4. **Avaliação Regulatória:** Análise de gravidade para comunicação aos titulares e à Autoridade Nacional de Proteção de Dados (ANPD), nos termos do Art. 48 da LGPD;
5. **Remediação de Causa-Raiz:** Aplicação de patch técnico, refatoração de regras de acesso ou expurgo de datasets contaminados;
6. **Relatório Pós-Incidente:** Emissão de parecer circunstanciado com cronograma de mitigação e prestação de contas aos órgãos colegiados da escola.

---

## 10. Termo de Adesão e Aceite Institucional Obrigatório

A habilitação dos módulos do Super Professor IA, importação de provas históricas, correção óptica OMR e geração de narrativas executivas depende da aceitação expressa deste instrumento pela instituição de ensino contratante:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TERMO DE ADESÃO INSTITUCIONAL — POLÍTICA DE USO DE DADOS DE PROVAS                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Instituição de Ensino: _______________________________________________________________ │
│ CNPJ / Código INEP: __________________________________________________________________ │
│ Representante Legal: _________________________________________________________________ │
│ Encarregado de Dados (DPO): __________________________________________________________ │
│                                                                                        │
│ Declaro que a instituição tomou conhecimento integral da Política de Uso de Dados de   │
│ Provas do Áquila Pro (Versão 1.0), comprometendo-se a manter a supervisão docente HITL, │
│ respeitar a quarentena de conteúdos didáticos sob direitos autorais e assegurar a       │
│ finalidade exclusivamente pedagógica no tratamento de dados de estudantes menores.     │
│                                                                                        │
│ Módulos Habilitados:                                                                   │
│ [ ] Super Professor IA (Elaboração Assistida)    [ ] Correção Óptica OMR Local         │
│ [ ] Banco de Questões Interno da Escola          [ ] Consultor Executivo SuiteAnalytics│
│                                                                                        │
│ Hash do Documento Aprovado:                                                            │
│ 7F8E9D0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E                      │
│                                                                                        │
│ Data do Aceite: _____ / _____ / 2026                                                   │
│ Assinatura do Representante: _________________________________________________________ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---
*Assinado digitalmente: Comitê de Governança de Dados, Jurídico & Segurança da Informação Áquila Pro*  
*Vinculado ao Release Candidate v2.1.0-rc.32 (Baseline `v2.1.0-rc.30`)*