# Walkthrough: Phase 1200 — Áquila Swarm (Multi-Agentes)

Nesta fase, implementamos o **Áquila Swarm**, uma arquitetura multi-agente que permite ao sistema não apenas detectar eventos, mas agir de forma autônoma e coordenada.

## O que foi construído?

### 1. SwarmManager (Orquestrador)
O `SwarmManager` atua como o sistema nervoso central, recebendo eventos do hardware e do motor de IA e distribuindo-os para os agentes interessados.
- **Arquivo**: [SwarmManager.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/SwarmManager.ts)
- **Recurso**: Shared Blackboard (quadro compartilhado) para contexto global.

### 2. Agentes Especializados
- **SecurityAgent (Guardião)**: Monitora ameaças. Se detectar rostos desconhecidos repetidamente ou alertas de sensores, pode ativar o LOCKDOWN automaticamente.
  - [SecurityAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/SecurityAgent.ts)
- **PedagogicalAgent (Mentor)**: Focado no sucesso do aluno. Automatiza registros de presença e gera resumos de engajamento baseados no fluxo de entrada.
  - [PedagogicalAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/PedagogicalAgent.ts)

### 3. Configuração Declarativa (YAML)
Permite ajustar a "personalidade" e os limiares (thresholds) de cada agente sem tocar no código.
- **Arquivo**: [agents.yaml](file:///c:/aquila/aquilapro_electron/src/config/agents.yaml)

## Como verificamos?

Executamos uma suíte de testes unitários que validou os seguintes cenários:
1. **Percepção e Memória**: Os agentes recebem eventos e mantêm um histórico de decisões.
2. **Ciclo de Decisão (PTA)**: O `SecurityAgent` atingiu o nível de ameaça crítico e disparou um comando de lockdown após 5 detecções falhas.
3. **Automação Pedagógica**: O `PedagogicalAgent` gerou insights após o volume mínimo de presenças ser atingido.

```text
PASS src/services/agents/__tests__/Swarm.test.ts
  Áquila Swarm Integration Tests
    ✓ Agents should perceive events and update memory
    ✓ SecurityAgent should increase threat level on unrecognized faces
    ✓ PedagogicalAgent should trigger insights after multiple presences
```

## Próximos Passos
- **Fase 1300**: WASM Hardening (Criptografia e Auditoria de alta performance).
