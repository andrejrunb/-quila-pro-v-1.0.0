---
name: LGPD Compliance Guard
description: Garante que novas funcionalidades de coleta de dados respeitem a soberania e privacidade da LGPD.
---

# Instruções de Uso

Ativar sempre que criar novas tabelas no SQLite ou novos fluxos de captura de imagem/voz.

## Princípios Áquila Pro
1. **Anonimização na Borda**: Vetores biométricos devem ser gerados no Edge e a imagem original descartada imediatamente.
2. **Consentimento**: Verificar se o `RBAC_Permissions_Matrix` permite o acesso ao dado solicitado.
3. **Criptografia**: Dados sensíveis em repouso devem usar AES-256 (via hardware no Áquila Edge).

## Verificações
- Auditar o arquivo `c:\aquila\.aquila_brain\40_Legal_LGPD\LGPD_Compliance.md`.
