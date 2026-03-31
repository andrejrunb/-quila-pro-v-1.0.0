# Walkthrough: Autonomous Response & Data Hardening (v1609)

Esta fase transforma o Áquila Pro em um sistema reativo, capaz de tomar decisões de trancamento físico sem intervenção humana em casos críticos.

## 1. Motor de Resposta Autônoma
Implementamos o **[AutonomousActionService.ts](file:///c:/aquila/aquilapro_electron/src/services/AutonomousActionService.ts)**, que monitora os sinais de rádio do RuView em tempo real. Se um sinal for detectado em uma zona de risco (como a entrada principal) durante um alerta, o sistema executa a ação de defesa.

## 2. Editor de Políticas de Defesa
A nova interface **[ActionPolicyEditor.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/ActionPolicyEditor.tsx)** permite que a coordenação escolar defina as regras do jogo:
- **Gatilhos**: Por evento de IA (arma detectada) ou proximidade de rádio.
- **Ações**: LOCK (trancar porta específica), ALARM (disparar sirene) ou LOCKDOWN (bloquear tudo).
- **Failsafe**: Botão de cancelamento rápido e logs auditados de cada decisão tomada pela IA.

## 3. IoT Fast-Path & Hardening
- **Lockdown Granular**: O [IoTMainService](file:///c:/aquila/aquilapro_electron/src/services/IoTMainService.ts) agora suporta o bloqueio de grupos específicos de dispositivos (ex: "Trancar Apenas Entradas").
- **AES-256 Protection**: Todas as informações sensíveis de alunos no [Database.ts](file:///c:/aquila/aquilapro_electron/src/database/Database.ts) agora são criptografadas em repouso (Encryption at Rest) usando AES-256.

---
**Status Final**: v1609 Integrado ao [UnifiedCommand](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx). Próximo: Detecção Passiva de Queda (v1611).
