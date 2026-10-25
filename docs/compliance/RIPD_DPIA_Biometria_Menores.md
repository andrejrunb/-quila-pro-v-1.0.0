# 🏛️ Relatório de Impacto à Proteção de Dados Pessoais (RIPD / DPIA)
## Tratamento de Dados Pessoais e Biometria de Menores no Áquila Pro
**Versão:** 1.1.0 — Piloto Escolar Controlado  
**Data:** 25 de Outubro de 2026  
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
| **Identificação Cadastral** | Nome completo, turma, matrícula e contato do responsável | Registro escolar e comunicação oficial | Duração da matrícula + prazo legal de arquivo | SQLite local protegido por criptografia AES-256-GCM |
| **Matriz Biométrica Facial** | Vetor numérico convolucional (One-Way Embedding de 512 dimensões) | Validação de acesso físico na portaria | Ano letivo corrente ou até revogação formal de consentimento | **Zero fotos brutas em nuvem**. O vetor é projetado para dificultar a reconstrução direta da imagem facial, sem eliminar integralmente o risco residual de reidentificação por comparação de embeddings. |
| **Registros de Presença** | Timestamp de passagem, ID do terminal e checksum SHA-256 | Comprovação de presença em sala de aula (LDB Art. 12, VII) | Ano letivo corrente | Trilha forense gravada na tabela `zero_bypass_audits` |
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
| **Reidentificação por comparação de vetores** | Médio | Embeddings protegidos em repouso por chave AES-256-GCM / DPAPI. Acesso estritamente restrito por RBAC local. | **Baixo** |
| **Acesso não autorizado ao banco edge** | Alto | Banco SQLite em modo WAL com criptografia em repouso. Acesso restrito a administradores autenticados com credenciais fortes e auditoria. | **Baixo** |
| **Falsos positivos na portaria** | Médio | Limiar de confiança calibrado ($\ge 0.82$). Em caso de não reconhecimento, o sistema orienta validação assistida por funcionário humano (*Human-in-the-Loop*). | **Baixo** |
| **Adulteração de presenças ou notas** | Alto | Trilha de auditoria imutável gravada com integridade verificada por encadeamento de hashes SHA-256 no serviço `zeroBypassAuditService`. | **Mínimo** |

---

### 5. Atendimento aos Direitos do Titular (Art. 18)

- **Confirmação e Acesso:** Painel do responsável permite visualização instantânea de todos os dados cadastrais e acessos.
- **Correção:** Retificação imediata mediante validação documental da secretaria.
- **Portabilidade:** Exportação estruturada em JSON com checksum criptográfico SHA-256 para comprovação de integridade no destino.
- **Eliminação:** Purga de dados sensíveis mantendo apenas registros obrigatórios por lei educacional.
