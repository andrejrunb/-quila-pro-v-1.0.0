---
title: LGPD Compliance & Privacidade
tags: [legal, security, biometry]
---

# LGPD Compliance & Privacidade

A proteção de dados é o pilar central do Áquila Pro. Seguimos rigorosamente as diretrizes da Lei Geral de Proteção de Dados (LGPD).

## 🛡️ Medidas de Segurança

### Processamento de Biometria

- Os dados biométricos (face templates) são processados **localmente**.
- Não enviamos vetores de face brutos para a nuvem sem consentimento explícito.
- [[40_Legal_LGPD/Data_Handling|Protocolos de Expurgos de Dados]] para visitantes e ex-alunos.

### Gestão Financeira Soberana (PIX)
- **Privacidade Financeira**: Dados de faturamento PIX (Brcode) são gerados localmente. A chave PIX institucional e o TxID são os únicos dados compartilhados com o Banco Central via PSP.
- **Link Determinístico**: O vínculo entre o RA do aluno e o código de pagamento é armazenado em tabela criptografada no SQLite local.

### Inteligência Pedagógica (Omnissearch)
- **Transcrição de Lousa**: Imagens de lousa são processadas para geração de metadados pedagógicos (Flashcards/Resumos). A imagem original é expurgada após o processamento (Zero-Storage Policy).
- **Busca Multimodal**: A indexação de eventos de segurança e acadêmicos é restrita a usuários com perfil Admin ou Coordenação (RBAC).

### Transparência (Privacy by Design)

- Logs de acesso auditáveis.
- [[30_UI_UX/Accessibility_Audit|Interfaces Acessíveis]] para consulta de dados por titulares.
- Criptografia em repouso para o banco de dados SQLite.

## 📑 Documentação Jurídica

- Termo de Consentimento para Uso de Imagem.
- Política de Retenção de Dados.
- Relatório de Impacto à Proteção de Dados (RIPD).

---
Vincular a: [[00_Index|Intelligence Center]]
