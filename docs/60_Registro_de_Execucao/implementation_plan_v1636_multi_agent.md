# Implementation Plan - v1636: Multi-Agent Orchestration

Este plano detalha a criação de uma camada de agentes inteligentes para cada um dos 9 portais do ecossistema Áquila, permitindo operação simultânea e coordenação inter-agente.

## Proposed Changes

### [v1636: Core Agent Logic]
- [NEW] [AgentOrchestratorService.ts](file:///c:/aquila/aquilapro_electron/src/services/AgentOrchestratorService.ts): 
    - O "Cérebro" central que roteia requisições entre agentes.
    - Gerencia o estado de "atividade" de cada agente.
- [NEW] [AgentDefinitions.ts](file:///c:/aquila/aquilapro_electron/src/services/AgentDefinitions.ts): 
    - Definição das especialidades de cada um dos 9 agentes (Admin, Coordinator, Teacher, Secretary, Parent, Student, Security, Totem, Public).

### [v1636: UI - Agent Presence]
- [MODIFY] [GlobalEcosystem.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/GlobalEcosystem.tsx): 
    - Adicionar um widget de "Agente Ativo" que mostra o que a IA está processando naquele portal.
- [NEW] [AgentActivityFeed.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/AgentActivityFeed.tsx): 
    - Componente visual para mostrar a cooperação entre agentes (ex: "Agente Segurança solicitou verificação ao Agente Totem").

### [v1636: Integration]
- [MODIFY] [CommunicationHubService.ts](file:///c:/aquila/aquilapro_electron/src/services/CommunicationHubService.ts): 
    - Permitir que agentes "postem" mensagens em canais automáticos baseados em gatilhos de rádio/visão.

## Verification Plan
### Automated Tests
1. Simular Evento "Cheguei" no Agente Pai -> Validar se o Agente Totem recebe a tarefa de atualizar o Mural.
2. Simular Detecção de Arma no Agente Segurança -> Validar se o Agente Coordenador recebe alerta CRÍTICO e o Agente Admin recebe log de incidente.

### Manual Verification
1. Navegar entre os portais e observar o "Agent Widget" mudando de contexto e especialidade.
2. Verificar o feed de atividades inter-agente no Dashboard Administrativo.
