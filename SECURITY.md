# Política de Segurança — Áquila Pro

## 🛡️ Versões Suportadas

Apenas as versões mais recentes da branch principal (`main`) e tags oficiais de Release Candidate recebem atualizações de segurança ativas.

| Versão | Suportada |
| :--- | :---: |
| v2.1.x | ✅ Sim |
| < v2.1.0 | ❌ Não |

---

## 🔒 Princípios de Segurança & Privacidade (LGPD)

1. **Dados de Menores (LGPD Art. 14):**
   - Nenhum dado biométrico não criptografado, identificador real ou fotografia de menores de idade deve ser versionado ou exposto fora da infraestrutura edge soberana local da instituição escolar.
   - Embeddings faciais utilizam vetores 512-D com hash unidirecional.

2. **Criptografia em Repouso e Trânsito:**
   - Bancos de dados locais SQLite utilizam modo WAL e isolamento estrito.
   - Comunicação perimetral obriga TLS 1.3 e sessões autenticadas via tokens criptograficamente assinados com HMAC-SHA256 (`aquila_session`).

3. **Electron Hardening:**
   - `webSecurity: true` mandatória em todas as janelas `BrowserWindow`.
   - `sandbox: true` ativo.
   - Content-Security-Policy (CSP) restritivo sem `unsafe-eval`.
   - Comunicação segura isolada via `contextBridge`.

4. **APIs e Procedimentos Remotos:**
   - Procedimentos tRPC requerem autenticação (`protectedProcedure`) ou permissão de coordenador/administrador (`adminProcedure`).
   - Bloqueio imediato de tentativas de acesso sem credenciais válidas.

---

## 🚨 Relato de Vulnerabilidades

Caso identifique uma falha de segurança, vulnerabilidade de privacidade ou vazamento potencial de credenciais:

1. **NÃO crie uma Issue pública.**
2. Envie os detalhes técnicos, prova de conceito (PoC) e impacto para a equipe de segurança:
   - **E-mail:** `security@aquilapro.dev`
   - **Chave PGP / Comunicação Segura:** Disponível mediante solicitação.
3. Inclua:
   - Descrição clara da vulnerabilidade.
   - Passos reproduzíveis.
   - Componente afetado (`apps/electron`, `apps/web`, `apps/mobile`, `packages/api`).
4. Nos comprometemos a responder em até **48 horas úteis** com plano de triagem e mitigação.
