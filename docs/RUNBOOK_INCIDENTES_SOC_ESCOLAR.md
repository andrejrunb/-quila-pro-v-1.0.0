> **BLOQUEIO DE SEGURANÇA:** este arquivo é um rascunho, não um runbook operacional validado. A restauração SQLite e o restore drill estão suspensos; não execute `restore_edge.cjs` nem siga instruções que aleguem RTO. Preserve banco, WAL, SHM e backups e acione o procedimento aprovado de incidente.

Here's a thinking process:

1.  **Analyze User Input:**
   - **Goal:** Generate a Runbook Operational de Incidentes in Markdown format
   - **File/Path:** `docs/RUNBOOK_INCIDENTES_SOC_ESCOLAR.md`
   - **Context:** Áquila Pro v2.1, for TI and DPO (Data Protection Officer)
   - **Topics to Cover (5 specific items):**
     1. Resolution of messages in DEAD_LETTER and AMBIGUOUS in NotificationOutboxService (WhatsApp Meta)
     2. Response to WebSocket 1008 / Cooldown on Port 9000
     3. SQLite recovery (BLOCKED; RTO not verified)
     4. Auto-throttling thermal > 75°C
     5. Revocation of LGPD consent Art. 14/18

2.  **Identify the Persona/Style:**
   - The system prompt defines me as the security guardian/DPO technical agent for Áquila Pro v2.1
   - Output must be direct, concise, and faithful to the contracts/architecture described
   - Must follow the established technical details (SQLite modes, AES-256, HMAC, etc.)

3.  **Structure the Markdown Document:**
   I need to create a well-structured Markdown file that covers all 5 topics operationally. I'll follow a standard runbook format: Overview, Prerequisites, Step-by-Step Procedures, Verification, Escalation, etc. But keep it concise and aligned with the provided architecture.

   Let's outline sections:
   - Header/Metadata
   - 1. DEAD_LETTER & AMBIGUOUS NotificationOutboxService Resolution
   - 2. WebSocket 1008 / Cooldown Recovery (Port 9000)
   - 3. SQLite recovery (BLOCKED; RTO not verified)
   - 4. Auto-throttling Thermal > 75°C
   - 5. LGPD Consent Revocation (Art. 14/18)
   - Appendices/Quick References

   I need to make sure the technical details match the prompt:
   - NotificationOutboxService: idempotency_key, provider_message_id, statuses PENDING/PROCESSING/SENT/FAILED/DEAD_LETTER/AMBIGUOUS, backoff 10*2^retry_count s, reconcileProviderStatus() via Meta Cloud API whatsapp_meta
   - WebSocket: Port 9000, HMAC-SHA256 auth, rate limiting by role/category, 1008 code, cooldown 60s, blocking progression
   - SQLite: WAL mode, VACUUM INTO, AES-256-GCM and manifest SHA-256; recovery remains blocked and RTO is unverified
   - Thermal: CPU/NPU > 75°C -> vision workers reduce 30FPS to 10FPS
   - LGPD: Art. 14, 16, 18, BIOMETRIC_CONSENT_REVOKED, zero_bypass_audits SHA-256, template 512-D expunge

   Now, I'll draft the content carefully, ensuring each procedure is operational, step-by-step, and references the correct services/classes/functions as per the architecture.

   Let's start drafting the Markdown in my mind, then output it.

   Structure:
   ```
   # 🛡️ Áquila Pro v2.1 — Runbook Operacional de Incidentes SOC Escolar
   ...
   ## 1. Mensagens DEAD_LETTER e AMBIGUOUS no NotificationOutboxService (WhatsApp Meta)
   ...
   ## 2. Bloqueio 1008 / Cooldown no WebSocket Porta 9000
   ...
   ## 3. Recuperação de corrupção SQLite — BLOQUEADA; RTO não verificado
   ...
   ## 4. Auto-throttling Térmico > 75°C
   ...
   ## 5. Revogação de Consentimento LGPD Art. 14/18
   ...
   ```

   I'll fill each with precise, actionable steps, referencing the exact services, modes, and thresholds from the prompt. I'll make sure not to hallucinate beyond the given context, and keep it tight.

   Check each section against the prompt requirements:
   1. DEAD_LETTER/AMBIG
