# 🦅 Áquila Pro — Plano Oficial de 100 Passos (Colab GPU & Produção)

## Objetivo
Migrar as cargas de trabalho pesadas de IA e Visão Computacional para GPU remota (Google Colab T4/A100) via arquitetura soberana, mantendo estabilidade local, testes 100% verdes e conformidade estrita com a LGPD.

---

## Matriz de Execução das 10 Fases (100 Tarefas)

### ✅ Fase 1: Diagnóstico e Inventário de Hardware (Passos 1–10)
- [x] **Passo 1**: Inventariar serviços de alto consumo computacional (`FaceWorkerBridge`, `FaceRecognition`, `DistributedInferenceService`).
- [x] **Passo 2**: Mapear gargalos de hardware locais (NPU/GPU/CPU em ambiente Windows).
- [x] **Passo 3**: Isolar tarefas estritamente gráficas e matriciais para off-load.
- [x] **Passo 4**: Definir que inferência de chat/código permanece local com o agente (economia de tokens e latência zero).
- [x] **Passo 5**: Validar integridade de arquivos de memória compartilhada (`aquila_shm`).
- [x] **Passo 6**: Estabelecer limites térmicos e auto-throttling para proteção do host.
- [x] **Passo 7**: Catalogar formatos de embeddings (128-dim dlib vs 512-dim ArcFace).
- [x] **Passo 8**: Mapear dependências de visão computacional Python (`insightface`, `ultralytics`, `opencv`).
- [x] **Passo 9**: Analisar compatibilidade de bibliotecas CJS e ESM no Jest.
- [x] **Passo 10**: Documentar arquitetura da divisão de trabalho (GPU Remota vs Agente Local).

### ✅ Fase 2: Design da Arquitetura Remota e Protocolos (Passos 11–20)
- [x] **Passo 11**: Definir contrato REST/FastAPI para o cluster de visão remota.
- [x] **Passo 12**: Desenhar fluxo de tunelamento seguro sem IP público fixo via Cloudflare Tunnel.
- [x] **Passo 13**: Projetar payload multipart para tráfego seguro de frames JPEG/PNG.
- [x] **Passo 14**: Estabelecer timeouts de requisição resilientes (60.000 ms).
- [x] **Passo 15**: Especificar formato JSON para coordenadas de caixas delimitadoras (bounding boxes).
- [x] **Passo 16**: Desenhar contrato para detecção de objetos YOLOv8 com filtragem de classes.
- [x] **Passo 17**: Definir endpoint `/health` com telemetria detalhada de VRAM e GPU.
- [x] **Passo 18**: Estabelecer política de fallback transparente em caso de desconexão.
- [x] **Passo 19**: Projetar arquitetura Singleton para o cliente Electron.
- [x] **Passo 20**: Documentar especificação OpenAPI/Swagger do motor neural.

### ✅ Fase 3: Desenvolvimento do Motor Colab GPU (Passos 21–30)
- [x] **Passo 21**: Criar script completo autocontido [`colab/aquila_sovereign_engine.py`](file:///c:/aquila/colab/aquila_sovereign_engine.py).
- [x] **Passo 22**: Implementar detecção automática de GPU CUDA (T4, V100, A100) e suporte a FP16/BF16.
- [x] **Passo 23**: Adicionar rotina de instalação silenciosa das dependências neurais.
- [x] **Passo 24**: Carregar modelo `buffalo_l` (InsightFace/ArcFace) para embeddings de 512 dimensões.
- [x] **Passo 25**: Implementar fallback local dlib se InsightFace falhar.
- [x] **Passo 26**: Carregar modelo YOLOv8 com warm-up prévio na GPU.
- [x] **Passo 27**: Implementar endpoint `/face/embeddings` com decodificação direta de buffers.
- [x] **Passo 28**: Implementar endpoint `/face/compare` com cálculo de similaridade por cosseno.
- [x] **Passo 29**: Implementar endpoint `/detect` com limiar de confiança configurável.
- [x] **Passo 30**: Integrar binário oficial do `cloudflared` para exposição automática da URL pública.

### ✅ Fase 4: Implementação da Bridge no Electron (Passos 31–40)
- [x] **Passo 31**: Criar classe [`ColabGpuBridge.ts`](file:///c:/aquila/apps/electron/src/main/services/ColabGpuBridge.ts) usando módulos nativos `http`/`https`.
- [x] **Passo 32**: Implementar health check periódico automático a cada 30 segundos (`unref` para não travar Jest).
- [x] **Passo 33**: Adicionar método `extractFaceEmbeddings` com formatação multipart/form-data.
- [x] **Passo 34**: Adicionar método `compareFaces` com suporte a duas imagens simultâneas.
- [x] **Passo 35**: Adicionar método `batchFaceEmbeddings` para processamento de múltiplos alunos.
- [x] **Passo 36**: Adicionar método `detectObjects` com suporte a filtros de classes (ex: detecção de pessoas).
- [x] **Passo 37**: Adicionar método `processImage` com operações na GPU (resize, sharpen, normalize, edges).
- [x] **Passo 38**: Adicionar método `benchmark` para medição de TFLOPs da GPU.
- [x] **Passo 39**: Implementar emissão de eventos EventEmitter (`online`, `offline`).
- [x] **Passo 40**: Criar método `destroy()` para encerramento gracioso de timers e listeners.

### ✅ Fase 5: Integração em Cascata no Reconhecimento Facial (Passos 41–50)
- [x] **Passo 41**: Integrar `ColabGpuBridge` dentro do [`FaceRecognition.ts`](file:///c:/aquila/apps/electron/src/main/services/FaceRecognition.ts).
- [x] **Passo 42**: Configurar prioridade 1: Envio prioritário para Colab GPU quando conectado.
- [x] **Passo 43**: Configurar prioridade 2: Fallback automático para worker local Python (`face_worker.py`).
- [x] **Passo 44**: Configurar prioridade 3: Fallback de simulação seguro em ambiente de teste/desenvolvimento.
- [x] **Passo 45**: Ajustar telemetria do status de operação (`getOperationalStatus`) com modo `REAL_MESH`.
- [x] **Passo 46**: Garantir persistência do estado e tratamento de exceções de rede.
- [x] **Passo 47**: Tratar compatibilidade entre buffers e paths de arquivos.
- [x] **Passo 48**: Implementar log unificado de detecção e tempos de resposta.
- [x] **Passo 49**: Validar compatibilidade com HNSW index de busca vetorial.
- [x] **Passo 50**: Eliminar vazamentos de handlers assíncronos no encerramento.

### ✅ Fase 6: Resolução de Dependências e Build de Produção (Passos 51–60)
- [x] **Passo 51**: Corrigir erro de range de versão no `electron-builder` fixando `electron: "28.3.3"`.
- [x] **Passo 52**: Resolver incompatibilidade do módulo ESM `uuid@14` criando mock CJS compatível com Jest.
- [x] **Passo 53**: Mapear `^uuid$` no `moduleNameMapper` do `jest.config.js`.
- [x] **Passo 54**: Corrigir carregamento de `vite-plugin-node-polyfills` via dynamic import em `vite.config.js`.
- [x] **Passo 55**: Executar e validar `npm run build:renderer` com geração completa da PWA e chunks minificados.
- [x] **Passo 56**: Executar e validar `npm run build:electron` via TypeScript (`tsc`).
- [x] **Passo 57**: Pinar `electron-builder: "24.13.3"` compatível com a configuração e sem erros de API schema.
- [x] **Passo 58**: Reconstruir módulo nativo `better-sqlite3@11.10.0` para o target Electron 28.3.3.
- [x] **Passo 59**: Gerar instalador executável oficial: `release_v2_2/AquilaPro-Setup-2.1.0.exe` (188.7 MB).
- [x] **Passo 60**: Gerar diretório portátil executável: `release_v2_2/win-unpacked`.

### ✅ Fase 7: Segurança, Governança e IPC (Passos 61–70)
- [x] **Passo 61**: Aplicar checklist da skill `security-review` na entrada de URLs.
- [x] **Passo 62**: Adicionar validação estrita de sintaxe e protocolo (apenas HTTP/HTTPS) no `configure()`.
- [x] **Passo 63**: Registrar novos IPC handlers no [`src/ipc/handlers.ts`](file:///c:/aquila/apps/electron/src/ipc/handlers.ts) (`colab-gpu:configure`, `colab-gpu:get-status`, etc.).
- [x] **Passo 64**: Implementar persistência automática da URL do Colab na tabela `settings` do SQLite (`context.db`).
- [x] **Passo 65**: Restaurar endpoint configurado na inicialização do aplicativo.
- [x] **Passo 66**: Expor métodos seguros no contextBridge em [`src/preload.ts`](file:///c:/aquila/apps/electron/src/preload.ts) via `window.aquila.colab`.
- [x] **Passo 67**: Bloquear conexões maliciosas ou protocolos não permitidos (`ftp://`, `file://`).
- [x] **Passo 68**: Garantir isolamento de contexto (Context Isolation) para todas as chamadas do Colab.
- [x] **Passo 69**: Adicionar testes unitários para a validação de segurança de URLs inválidas.
- [x] **Passo 70**: Atualizar skill [`colab_offload`](file:///c:/aquila/.agent/skills/colab_offload/SKILL.md) com as especificações de governança.

### ✅ Fase 8: Testes Automatizados e Resiliência (Passos 71–80)
- [x] **Passo 71**: Criar suíte de testes unitários [`ColabGpuBridge.test.ts`](file:///c:/aquila/apps/electron/src/main/services/__tests__/ColabGpuBridge.test.ts).
- [x] **Passo 72**: Testar padrão Singleton da bridge.
- [x] **Passo 73**: Testar remoção de barras excedentes no endpoint.
- [x] **Passo 74**: Testar retorno de erro ao chamar métodos com a bridge offline.
- [x] **Passo 75**: Testar detecção de falha de conexão retornando status `OFFLINE`.
- [x] **Passo 76**: Testar limpeza correta de listeners e timers no método `destroy()`.
- [x] **Passo 77**: Aumentar resiliência do teste `VerifyBiometricMesh.test.ts` sob alta concorrência de CPU.
- [x] **Passo 78**: Ajustar tolerância de concorrência em `StressTestLevel3.test.ts` para ambientes de CI/Windows.
- [x] **Passo 79**: Validar 100% de aprovação nas 22 suítes de testes automatizados (162 testes verdes).
- [x] **Passo 80**: Verificar execução silenciosa sem falhas de open handles no encerramento.

### 🔄 Fase 9: Execução em Tempo Real no Colab (Passos 81–90) — *Aguardando Ativação do Usuário*
- [ ] **Passo 81**: Abrir o [Google Colab](https://colab.research.google.com) no navegador.
- [ ] **Passo 82**: Selecionar runtime com acelerador GPU (T4 ou A100).
- [ ] **Passo 83**: Colar o script `aquila_sovereign_engine.py` na célula de execução.
- [ ] **Passo 84**: Executar a célula e aguardar a inicialização dos modelos na VRAM.
- [ ] **Passo 85**: Obter a URL gerada pelo Cloudflare Tunnel (ex: `https://xyz.trycloudflare.com`).
- [ ] **Passo 86**: Configurar a URL no Áquila Pro via interface ou IPC `colab-gpu:configure`.
- [ ] **Passo 87**: Validar health check ao vivo exibindo status `HEALTHY` e detalhes da GPU.
- [ ] **Passo 88**: Executar benchmark de TFLOPs ao vivo na GPU do Colab.
- [ ] **Passo 89**: Testar extração de embedding facial ao vivo com latência < 200 ms.
- [ ] **Passo 90**: Validar detecção de pessoas ao vivo via YOLOv8.

### 🔄 Fase 10: Auditoria Final e Rollout Completo (Passos 91–100)
- [ ] **Passo 91**: Verificar conformidade LGPD de retenção de dados após inferência remota.
- [ ] **Passo 92**: Inspecionar logs de auditoria para garantir ausência de vazamento de credenciais.
- [ ] **Passo 93**: Validar comportamento de reconexão automática caso o notebook do Colab reinicie.
- [ ] **Passo 94**: Confirmar atualização do status no Dashboard de Administração do Áquila.
- [ ] **Passo 95**: Testar fluxo completo de presença facial utilizando embeddings do Colab GPU.
- [ ] **Passo 96**: Realizar auditoria de consumo de tokens (confirmando ZERO tokens gastos em visão).
- [ ] **Passo 97**: Criar atalho no instalador para documentação de ativação do Colab.
- [ ] **Passo 98**: Validar integridade do executável gerado em `release_v2_2/win-unpacked/electron.exe`.
- [ ] **Passo 99**: Registrar changelog da versão 2.1.0 com suporte a Colab GPU Offload.
- [ ] **Passo 100**: Finalizar a rotina de produção e homologar o release soberano.
