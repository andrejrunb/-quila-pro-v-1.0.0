# Implementation Plan: Phase 1200 — Áquila Swarm (Multi-Agents)

Este plano detalha a implementação da arquitetura multi-agente do Áquila Pro, permitindo que diferentes especialidades de IA (Segurança e Pedagógica) colaborem de forma autônoma.

## Conceito: O Enxame (Swarm)

Cada agente terá seu próprio contexto, ferramentas e objetivos, coordenados por um `SwarmManager`.

### [Componentes Principais]

#### [NEW] [SwarmManager.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/SwarmManager.ts)
- Ponto central de comunicação entre agentes.
- Gerencia o "Espaço de Trabalho Compartilhado" (Shared Blackboard).
- Roteia eventos globais para agentes específicos.

#### [NEW] [BaseAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/BaseAgent.ts)
- Classe abstrata definindo o ciclo de vida do agente (Perceber -> Pensar -> Agir).
- Integração com sistemas de log e persistência de memória.

#### [NEW] [SecurityAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/SecurityAgent.ts)
- **Foco**: Monitoramento de câmeras, detecção de intrusos e alertas de IoT.
- **Ferramentas**: `FaceRecognition`, `IoTService`, `LockdownPanel`.

#### [NEW] [PedagogicalAgent.ts](file:///c:/aquila/aquilapro_electron/src/services/agents/PedagogicalAgent.ts)
- **Foco**: Gestão de presença, análise de engajamento e relatórios de aula.
- **Ferramentas**: `AttendanceService`, `Database`, `ImmutableAuditLog`.

### [Configuração]

#### [NEW] [agents.yaml](file:///c:/aquila/aquilapro_electron/src/config/agents.yaml)
- Definição declarativa dos agentes, suas permissões e "temperamentos".

## Plano de Verificação

### Testes Automatizados
- `npm test src/services/agents/__tests__/SwarmManager.test.ts`: Verificar comunicação inter-agente.
- Simulação de evento de segurança: Validar se o `SecurityAgent` ativa protocolos de IoT automaticamente.

### Verificação Manual
- Ativar o "Modo Swarm" no Dashboard e observar os logs de decisão dos agentes em tempo real.
