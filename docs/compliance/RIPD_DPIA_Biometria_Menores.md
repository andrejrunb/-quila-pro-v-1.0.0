# 🏛️ Relatório de Impacto à Proteção de Dados Pessoais (RIPD / DPIA)
## Tratamento de Dados Pessoais e Biometria de Menores no Áquila Pro
**Versão:** 2.1.0 — Piloto Escolar Controlado (H-01)  
**Data:** 04 de Novembro de 2026  
**Enquadramento Legal:** Lei Federal 13.709/2018 (LGPD), especialmente Artigos 7º, 11, 14 e 16; Lei 8.069/1990 (Estatuto da Criança e do Adolescente - ECA).  
**Status de Validação:** Documento técnico submetido a parecer consultivo de DPO e jurista especialista antes do piloto.

---

### 1. Papéis de Governança (LGPD Art. 5º, VI e VII)
- **Controlador dos Dados:** A Instituição de Ensino contratante (Colégio / Rede Escolar), a quem competem as decisões sobre o tratamento de dados pessoais de estudantes e responsáveis.
- **Operador Técnico:** O software Áquila Pro (operando em arquitetura *Local Edge On-Premise*), tratando os dados unicamente conforme as instruções lícitas do Controlador.
- **Encarregado (DPO):** E-mail oficial do DPO da instituição configurado nas configurações de governança do sistema (`dpo@colegio.edu.br`).

---

### 2. Natureza dos Dados e Minimização (Art. 6º, III)

| Categoria | Dado Coletado | Finalidade Específica | Período de Retenção | Salvaguarda Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **Identificação Cadastral** | Nome completo, turma, matrícula e contato do responsável | Registro escolar e comunicação oficial | Duração da matrícula + prazo legal de arquivo | SQLite local protegido por criptografia AES-256-GCM / DPAPI |
| **Matriz Biométrica Facial** | Hash unidirecional (`face_embedding_hash`, SHA-256) e vetor convolucional 512-D (`face_encoding`, em quarentena no H-01) | Validação de acesso físico na portaria (escopo H-02+) | Ano letivo corrente ou até revogação formal de consentimento | **Zero fotos brutas em nuvem**. `face_embedding_hash` armazena resumo unidirecional e `face_encoding` permanece cifrado em repouso (AES-256-GCM/DPAPI) e desativado no piloto H-01. |
| **Registros de Presença** | Timestamp de passagem, ID do terminal e checksum SHA-256 | Comprovação de presença em sala de aula (LDB Art. 12, VII) | Ano letivo corrente | Trilha forense gravada na tabela `zero_bypass_audits` / `audit_logs` |
| **Imagens de CFTV (Perímetro)** | Gravação de circuito interno | Segurança física patrimonial e prevenção de invasão | Purga automática após 15 a 30 dias | Armazenamento exclusivamente local no servidor edge da escola |

---

### 3. Matriz de Consentimento Livre, Específico e Destacado (LGPD Art. 14, §1º)

1. **Consentimento dos Pais/Responsáveis Legais:**
   - O processamento biométrico de menores é **estritamente facultativo**.
   - Para famílias que optarem pela não utilização de biometria facial, a instituição fornece **alternativa equivalente de acesso** (cartão RFID de aproximação, crachá com QR Code dinâmico ou digitação de código numérico), sem qualquer distinção ou constrangimento ao estudante.
2. **Revogabilidade e Portabilidade (Art. 18):**
   - O consentimento pode ser revogado a qualquer momento pelo portal do responsável ou via requerimento à secretaria.
   - Em caso de revogação ou desligamento, o vetor biométrico é purgado de forma definitiva do banco edge em até 24 horas úteis, gerando registro com carimbo de data/hora no log de auditoria.
   - **Evidência de Teste Operacional:** Os direitos de consentimento, revogação, purga biométrica e portabilidade foram validados formalmente na suíte de testes [`scripts/test_lgpd_rights.ts`](../../scripts/test_lgpd_rights.ts) (**5/5 testes aprovados**).

---

### 4. Análise de Riscos e Salvaguardas Implementadas

| Risco Identificado | Nível Inicial | Medidas Preventivas e Mitigações | Nível Residual |
| :--- | :---: | :--- | :---: |
| **Vazamento de imagens de menores** | Alto | **Zero imagens em nuvem pública.** Todo o processamento de visão ocorre na borda (Edge NPU/CPU local). Nenhum frame de estudante sai da rede cabeada local da escola. | **Controlado** |
| **Reidentificação por comparação de vetores** | Médio | Embeddings protegidos em repouso por chave AES-256-GCM / DPAPI e indexados via hash SHA-256 (`face_embedding_hash`). Acesso estritamente restrito por RBAC local. | **Baixo** |
| **Acesso não autorizado ao banco edge** | Alto | Banco SQLite em modo WAL com criptografia em repouso. Acesso restrito a administradores autenticados com credenciais fortes e auditoria. | **Baixo** |
| **Falsos positivos na portaria** | Médio | Limiar de confiança calibrado ($\ge 0.82$). Em caso de não reconhecimento, o sistema orienta validação assistida por funcionário humano (*Human-in-the-Loop*). | **Baixo** |
| **Adulteração de presenças ou notas** | Alto | Trilha de auditoria imutável gravada com integridade verificada por encadeamento de hashes SHA-256 no serviço `zeroBypassAuditService`. | **Mínimo** |

---

### 5. Isolamento Offline-First de Conectores Externos e Expurgo Automático (Art. 16)

- **Isolamento de Conectores Cloud (`AQUILA_ENABLE_CLOUD_CONNECTORS=false`):** No perfil operacional do Piloto H-01, os conectores opcionais `@supabase/supabase-js` (`apps/electron/src/lib/supabase.ts`) e `googleapis` (`apps/electron/src/main/services/GoogleWorkspaceBridge.ts`) encontram-se desabilitados por padrão (`AQUILA_ENABLE_CLOUD_CONNECTORS=false`), operando em modo `offline-isolated` sem realizar chamadas de rede externas. Caso habilitados por opt-in institucional em fases futuras (H-02+), apenas metadados pedagógicos anonimizados ou relatórios agregados trafegam sob TLS 1.3; dados biométricos (`face_encoding`) jamais são sincronizados.
- **Rotina Automatizada de Expurgo (LGPD Art. 16):** A procedure administrativa `automation.runLgpdRetentionPurge` executa o expurgo periódico de templates biométricos revogados e sessões expiradas após o período legal de retenção, gravando certificado de eliminação com hash SHA-256 na trilha de auditoria.
- **Observabilidade Offline Estruturada (DPO):** A procedure `automation.exportOfflineObservability` exporta manifesto JSON assinado com SHA-256 contendo exclusivamente métricas técnicas de saúde, latência e integridade (`piiIncluded: false`), sem dados pessoais de estudantes.

---

### 6. Atendimento aos Direitos do Titular (Art. 18)

- **Confirmação e Acesso:** Painel do responsável permite visualização instantânea de todos os dados cadastrais e acessos, com Onboarding de 3 passos sobre proteção e revogação.
- **Correção:** Retificação imediata mediante validação documental da secretaria.
- **Portabilidade:** Exportação estruturada em JSON com checksum criptográfico SHA-256 para comprovação de integridade no destino.
- **Eliminação:** Purga de dados sensíveis mantendo apenas registros obrigatórios por lei educacional (LDB Art. 12, VII).
