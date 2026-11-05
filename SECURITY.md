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
   - Embeddings faciais utilizam vetores 512-D acompanhados de hash unidirecional SHA-256 (`face_embedding_hash`) e, quando persistidos localmente em borda mediante consentimento explícito (`biometric_consent_logs`), o campo `face_encoding` armazena exclusivamente o ciphertext cifrado em repouso com AES-256-GCM / Windows DPAPI (a chave criptográfica de borda nunca sai do servidor local). No perfil do piloto H-01, a coleta biométrica permanece em quarentena (desativada por padrão).

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

5. **Isolamento Offline-First e Conectores Externos (LGPD Art. 14 e Soberania Local):**
   - O Áquila Pro opera em modo estritamente *Offline-First* por padrão no perfil do piloto H-01.
   - Conectores opcionais de nuvem (`@supabase/supabase-js`, `googleapis`) permanecem desativados e bloqueados por padrão (`AQUILA_ENABLE_CLOUD_CONNECTORS=false`), garantindo que nenhum dado escolar deixe o servidor local sem ativação explícita e registro no RIPD/DPIA institucional.

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
