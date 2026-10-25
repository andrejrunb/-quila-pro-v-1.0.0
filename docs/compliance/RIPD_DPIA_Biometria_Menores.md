# 🏛️ Relatório de Impacto à Proteção de Dados Pessoais (RIPD / DPIA)
## Tratamento de Dados Pessoais e Biometria de Menores no Áquila Pro
**Versão:** 1.0.0 — Baseline de Piloto Escolar  
**Data:** 25 de Outubro de 2026  
**Enquadramento Legal:** Lei Federal 13.709/2018 (LGPD), especialmente Artigos 7º, 11, 14 e 16; Lei 8.069/1990 (Estatuto da Criança e do Adolescente - ECA).

---

### 1. Identificação do Agente de Tratamento e Objeto
- **Controlador dos Dados:** A Instituição de Ensino contratante (Colégio / Rede Escolar).
- **Operador Técnico:** O software Áquila Pro (operando em arquitetura *Local Edge On-Premise*).
- **Finalidade Legítima:** Gestão de segurança escolar no perímetro de acesso, controle de presença e frequência obrigatória (LDB Art. 12, VII), e prevenção de evasão escolar no melhor interesse da criança e do adolescente (LGPD Art. 14, §1º).

---

### 2. Natureza dos Dados e Princípio da Minimização (Art. 6º, III)

| Categoria | Dado Coletado | Finalidade Específica | Período de Retenção | Salvaguarda Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **Identificação Cadastral** | Nome completo, turma, matrícula e contato do responsável | Registro escolar e comunicação de faltas/alertas | Duração do vínculo de matrícula + 5 anos | SQLite local protegido por criptografia AES-256-GCM |
| **Matriz Biométrica Facial** | Vetor matemático unidirecional (*One-Way Embedding* de 512 dimensões) | Validação de entrada na catraca/portaria | Ano letivo corrente ou até revogação de consentimento | **Proibido armazenamento de imagem fotográfica bruta na nuvem**. Embedding não permite reconstrução reversa da face do estudante. |
| **Registros de Presença** | Timestamp de passagem, ID da catraca e checksum SHA-256 | Comprovação de presença em sala de aula | Ano letivo corrente | Trilha de auditoria em tabela `zero_bypass_audits` |
| **Imagens de CFTV (Perímetro)** | Frames de vídeo em circuito fechado | Prevenção de intrusão e segurança física escolar | Purga automática após 15 a 30 dias | Armazenamento exclusivamente local no servidor edge da escola |

---

### 3. Matriz de Consentimento Livre, Específico e Destacado (LGPD Art. 14, §1º)

1. **Consentimento dos Pais/Responsáveis Legais:**
   - O processamento biométrico de menores é **estritamente facultativo**.
   - Para famílias que optarem pela não utilização de biometria facial, a instituição fornece alternativa equivalente de acesso (cartão RFID de aproximação, crachá com QR Code dinâmico ou digitação de código numérico).
2. **Revogabilidade e Portabilidade:**
   - O consentimento pode ser revogado a qualquer momento pelo portal do responsável ou via requerimento à secretaria.
   - Em caso de revogação ou desligamento, o vetor biométrico é purgado de forma definitiva do banco edge em até 24 horas úteis, gerando registro com carimbo de data/hora no log de auditoria.

---

### 4. Análise de Riscos e Salvaguardas Implementadas

| Risco Identificado | Nível Inicial | Medidas Preventivas e Mitigações | Nível Residual |
| :--- | :---: | :--- | :---: |
| **Vazamento de imagens de menores** | Alto | **Zero imagens em nuvem pública.** Todo o processamento de visão ocorre na borda (Edge NPU/CPU local). Nenhum frame bruto de estudante sai da rede cabeada local da escola. | **Baixo** |
| **Reconstrução reversa da face** | Médio | Utilização de modelo de embedding convolucional de 512 dimensões. Trata-se de uma função matemática não-inversível (one-way mapping). | **Mínimo** |
| **Acesso não autorizado ao banco edge** | Alto | Banco SQLite em modo WAL com criptografia AES-256-GCM ou Windows DPAPI. Acesso restrito por RBAC (apenas administradores escolares autenticados). | **Baixo** |
| **Falsos positivos na portaria** | Médio | Limiar de confiança de matching calibrado ($\ge 0.82$). Em caso de não reconhecimento, o sistema orienta validação assistida por funcionário humano (Human-in-the-Loop). | **Baixo** |
| **Alteração de notas ou faltas** | Alto | Trilha de auditoria imutável gravada com integridade verificada por encadeamento de hashes SHA-256 no serviço `zeroBypassAuditService`. | **Mínimo** |

---

### 5. Direitos do Titular (Art. 18) e Canal do DPO (Encarregado)

O Áquila Pro disponibiliza interfaces administrativas para o atendimento imediato aos direitos dos titulares:
- **Confirmação e Acesso:** Relatório impresso ou digital de todos os dados e acessos registrados em nome do estudante.
- **Correção:** Retificação instantânea de cadastros incorretos ou desatualizados.
- **Eliminação:** Rotina de exclusão com purga física dos dados sensíveis e manutenção apenas dos registros legalmente exigidos pela legislação educacional (LDB/MEC).
- **Contato do DPO:** Cada escola deve configurar o e-mail oficial do seu Encarregado de Proteção de Dados no painel administrativo (`Configurações -> Governança & LGPD`).

---
*Aprovado para a Fase de Homologação e Piloto Escolar Controlado.*
