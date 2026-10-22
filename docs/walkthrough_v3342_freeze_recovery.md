# Relatório de Resolução e Recuperação: Áquila Pro OS Desktop

## Diagnóstico do Travamento e Causa-Raiz (Root Cause)
1. **Loop Infinito de Inferência Distribuída e Auto-Cura:**
   - O `CortexEvolutionService` despachava tarefas de sumarização para o `DistributedInferenceService`. Em modo nó-único (sem peers P2P conectados), as tarefas permaneciam indefinidamente na fila `activeTasks`.
   - O `SelfHealingService` executava sua rotina de auditoria térmica a cada 10 segundos e re-despachava todas as tarefas pendentes sem cancelar as anteriores nem aplicar backpressure.
   - Isso gerava um crescimento exponencial (duplicação a cada 10s: 5 -> 10 -> 20 -> 40 -> 80 ... > 81.000 tarefas), gerando ~300 logs/segundo, travando o Event Loop do Node.js, elevando a temperatura da CPU para 80°C e inflando o arquivo de log para 336.5 MB.
2. **Lock de Instância Única (Single-Instance Lockout):**
   - Um processo zumbi do Electron (PID 18528) havia permanecido travado em segundo plano. Novas tentativas de abrir o aplicativo acionavam `app.requestSingleInstanceLock()`, retornavam falso e executavam `app.quit()` imediatamente.
3. **Bloqueio de Exibição da Janela:**
   - Em `window.ts`, a janela principal iniciava com `show: false` aguardando `ready-to-show`. Como o event loop estava sob inanição, o evento atrasava ou não disparava, mantendo o app invisível.

---

## Modificações Realizadas

### 1. `apps/electron/src/main/services/DistributedInferenceService.ts`
- Implementado backpressure com limite estrito de tarefas ativas simultâneas (`MAX_ACTIVE_TASKS = 25`).
- Adicionado timestamp `createdAt` para controle de Time-to-Live (TTL).
- Implementado fallback assíncrono local quando não há nós P2P remotos conectados (`connectedPeers.length === 0`), garantindo auto-remoção e resolução de tarefas locais em background.
- Adicionados métodos de higiene e expurgo: `cancelTask(taskId)` e `pruneStaleTasks(maxAgeMs)`.

### 2. `apps/electron/src/main/services/SelfHealingService.ts`
- Adicionada trava de reentrância (`isThermalOffloading`) para impedir re-disparos concorrentes.
- Limitado o fatiamento de tarefas a no máximo 3 itens pendentes por ciclo, cancelando explicitamente as instâncias antigas antes de reencaminhar.
- Conectado o `pruneStaleTasks(30000)` para expurgo ativo de tarefas obsoletas.

### 3. `apps/electron/src/main/services/CortexEvolutionService.ts`
- Adicionada guarda booleana `isLoopRunning` para evitar inicialização dupla concorrente.
- Implementado throttling pedagógico: novas tarefas só são delegadas se houver menos de 5 tarefas ativas na malha.

### 4. `apps/electron/src/main/services/PedagogicalScaffoldingService.ts`
- Corrigidos nomes de colunas do esquema SQLite:
  - `gpu_training_runs`: `trained_at` -> `created_at`
  - `vestibular_concept_matrix`: `decade_span` -> `decades`, `macro_topic` -> `topic`, `core_concepts` -> `concepts`.

### 5. `apps/electron/src/main/window.ts`
- Substituído carregamento de URL por `mainWindow.loadFile(distPath)` nativo para evitar inconsistências de caminho no Chromium sob Windows.
- Implementado `safetyTimer` de 2.5s garantindo que `mainWindow.show()` seja acionado com foco e elevação visual mesmo em caso de atraso de renderização.

### 6. `apps/electron/src/App.tsx`
- Expandida tipagem `Page` e array `isTeacherPage` para suportar as novas rotas integradas: `'ai-studio'`, `'activity-factory'` e `'mastery-chamber'`.

---

## Verificação e Telemetria
- **Processos ativos:** Electron rodando estavelmente (PIDs: 14964, 13256, 12404, 10292).
- **Consumo de CPU:** < 0.5% em repouso.
- **Saúde do Swarm:** 96% Health Index.
- **Renderização:** Interface carregada (Página Seating Intelligence / Dashboard), banco SQLite conectado e operando em modo WAL, workers de reconhecimento facial Python ativos.
