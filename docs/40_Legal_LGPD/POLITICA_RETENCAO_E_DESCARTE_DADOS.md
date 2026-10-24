# 📜 Áquila Pro — Política de Retenção e Descarte Seguro de Dados
### Governança do Ciclo de Vida de Dados Pessoais (LGPD Art. 15 e 16)
#### Versão 2.1 — Outubro de 2026 | Documento Soberano de Compliance

---

## 🏛️ 1. Objetivo & Âmbito de Aplicação

Esta política estabelece os prazos legais e operacionais para retenção, guarda e expurgo definitivo de dados pessoais tratados pelo ecossistema **Áquila Pro** no âmbito da instituição de ensino contratante, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), a Lei de Diretrizes e Bases da Educação (Lei nº 9.394/1996 - LDB), o Marco Civil da Internet (Lei nº 12.965/2014) e as diretrizes do Conselho Nacional de Arquivos (CONARQ / Portaria MEC nº 315/2018).

---

## ⏳ 2. Tabela de Temporalidade e Retenção por Categoria de Dado

| Categoria | Tipos de Registro | Base Legal Principal | Prazo de Retenção | Destinação Final |
| :--- | :--- | :--- | :--- | :--- |
| **Biometria Facial (Sensível)** | Embeddings 512-D (`face_embeddings`), hashes faciais | LGPD Art. 11, II, "g" c/c Art. 14 | **Vigência da matrícula + 30 dias** após encerramento de vínculo | **Eliminação irreversível** com emissão de recibo de purge SHA-256 |
| **Imagens de Câmeras (CFTV)** | Feeds RTSP temporários, gravações de segurança | LGPD Art. 7º, IX (Legítimo interesse / segurança) | **Até 30 dias corridos** | **Sobrescrita cíclica automática** em buffer local |
| **Registros Acadêmicos** | Notas, diários de classe, atas de conselho, histórico escolar | LDB Art. 12 / Portaria MEC 315/2018 | **100 anos / Guarda Permanente** | Arquivo digital permanente com carimbo de tempo |
| **Controle de Frequência** | Registros diários de presença, justificativas de falta | LDB Art. 12, VII / Lei 13.803/2019 | **5 anos após conclusão escolar** | Expurgo ou anonimização para estatísticas BNCC |
| **Dados Financeiros & PIX** | Cobranças, faturas, liquidações PIX, comprovantes | Código Civil Art. 206 / CTN Art. 174 | **5 anos fiscais** | Expurgo contábil após prazo decadencial |
| **Logs de Acesso e Auditoria** | Tabela `zero_bypass_audits`, logs de autenticação | Marco Civil da Internet Art. 15 | **6 meses a 1 ano** | Arquivamento compactado offline |
| **Comunicações com Família** | Mensagens, avisos escolares, ocorrências disciplinares | Código de Defesa do Consumidor Art. 27 | **3 anos** | Expurgo automatizado |

---

## 🗑️ 3. Procedimento Operacional de Expurgo Seguro (Right to Erasure - Art. 18 LGPD)

Quando um titular ou seu responsável legal solicita a revogação de consentimento ou quando decorre o prazo de retenção:

1. **Protocolo de Solicitação:** A solicitação é registrada formalmente via portal da família ou secretaria escolar.
2. **Execução Técnica Imediata:**
   ```sql
   -- Expurgo dos vetores faciais biométricos
   DELETE FROM face_embeddings WHERE student_id = :studentId;
   
   -- Limpeza de referências de fotos brutas
   UPDATE students 
   SET photoPath = NULL, photoHash = NULL, metadata = json_set(metadata, '$.biometricConsent', 'REVOKED')
   WHERE id = :studentId;
   ```
3. **Registro Auditável de Expurgo (Zero-Bypass):**
   ```sql
   INSERT INTO zero_bypass_audits (userId, action, details, metadata)
   VALUES (:operatorId, 'BIOMETRIC_PURGE_EXECUTED', 'Expurgo definitivo de biometria facial concluído.', json_object('studentId', :studentId, 'timestamp', datetime('now')));
   ```
4. **Comprovante de Exclusão:** Um recibo assinado digitalmente com hash SHA-256 é emitido para o responsável legal, comprovando a eliminação irreversível da matriz biométrica.

---

## 🚫 4. Garantia de Alternativa Analógica (Não-Obrigatoriedade)

O fornecimento de dados biométricos faciais é estritamente **opcional e voluntário**:
* Responsáveis que optarem por não autorizar a biometria têm assegurado o uso de crachá de proximidade RFID ou verificação visual manual na portaria.
* É vedada qualquer discriminação, embaraço ou perda de direitos acadêmicos decorrente da não adesão ao reconhecimento facial.

---
*Aprovado pelo Encarregado pelo Tratamento de Dados (DPO) e Diretoria Executiva Áquila Pro.*
