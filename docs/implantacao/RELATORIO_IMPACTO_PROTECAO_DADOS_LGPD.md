# Áquila Pro — Relatório de Impacto à Proteção de Dados Pessoais (RIPD / DPIA)
## Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)

---

## 📋 1. Identificação do Controlador e do Encarregado (DPO)

* **Controlador dos Dados:** Instituição de Ensino Contratante (Escola / Colégio).
* **Operador dos Dados:** Áquila Pro Sistemas Soberanos de Educação LTDA.
* **Canal do Encarregado pelo Tratamento de Dados (DPO / EPD):**
  - E-mail institucional: `dpo@aquilapro.com.br` / `privacidade@aquilapro.com.br`
  - Endereço de protocolo: Encarregado de Proteção de Dados — Equipe de Governança e Compliance Áquila Pro.

---

## 🎯 2. Escopo, Finalidade e Bases Legais do Tratamento

| Categoria de Dado | Finalidade Estrita | Base Legal (LGPD) | Período de Retenção |
| :--- | :--- | :--- | :--- |
| **Biometria Facial (Vetor 512-dim)** | Controle automatizado de frequência e liberação de portaria/catraca de segurança. | **Art. 11, II, "g"** (Garantia de prevenção à fraude e segurança do titular) c/c **Art. 14, §1º** (Consentimento específico e em destaque dado por pelo menos um dos pais/responsável legal). | Durante a vigência do contrato de matrícula. Expurgo em 30 dias após desligamento/formatura. |
| **Fotos Faciais Brutas** | Coleta transitória em borda (*Edge*) para conversão em vetor matemático. | **Art. 11, II, "g"** | **Destruição imediata em memória RAM** após a vetorização. Zero armazenamento em disco ou nuvem. |
| **Registros de Frequência** | Cumprimento de dever legal de registro escolar e radar de evasão (LDB Art. 12). | **Art. 7º, II** (Cumprimento de obrigação legal ou regulatória pelo controlador). | 5 anos (histórico acadêmico regulatório MEC). |
| **Telemetria de Comunicação** | Notificação aos responsáveis sobre entrada/saída e faltas escolares. | **Art. 7º, V** (Execução de contrato de prestação de serviços educacionais). | 1 ano fiscal. |

---

## 🛡️ 3. Medidas Técnicas e de Segurança da Informação

1. **Irreversibilidade Criptográfica do Vetor:**
   A extração biométrica (Face Recognition) converte a geometria facial em um vetor de ponto flutuante de 512 dimensões. É matematicamente impossível reconstruir o rosto ou a imagem da criança a partir das coordenadas do vetor (função *one-way*).
2. **Processamento 100% de Borda (*Edge Sovereign Computing*):**
   A inferência das câmeras ocorre localmente no servidor da escola (`192.168.18.x`). Nenhum fluxo de vídeo sai da rede local para a nuvem.
3. **Isolamento de Tenants (Multi-Tenancy):**
   Todas as tabelas do ecossistema vinculam registros a `institution_id` (ID da escola), com isolamento estrito via banco e integridade referencial.
4. **Política de Expurgo Criptográfico Auditável (Art. 16 da LGPD):**
   Quando um aluno conclui os estudos ou é transferido, a tabela `biometric_purge_logs` grava o hash SHA-256 de comprovação de exclusão e o campo `face_encoding` é zerado permanentemente.

---

## ⚖️ 4. Registro de Operações de Tratamento (ROPA — Art. 37)

* **Operação:** Vetorização e Reconhecimento de Portaria
* **Titulares:** Alunos menores de idade (Ensino Fundamental e Médio).
* **Medidas de Mitigação de Risco:**
  - Criptografia em repouso AES-256 no banco local.
  - Termo de consentimento assinado pelo responsável no ato da matrícula.
  - Alternativa analógica sem biometria: o responsável tem o direito legal de recusar a biometria, optando por crachá RFID ou chamada manual tradicional pelo professor, sem qualquer prejuízo pedagógico.

---

*Documento homologado pelo Córtex de Governança e Compliance do Áquila Pro — Outubro/2026.*
