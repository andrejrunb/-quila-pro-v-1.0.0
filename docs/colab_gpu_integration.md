# 🦅 Áquila Pro — Colab GPU Integration

## Divisão de Trabalho

```
┌─────────────────────────────────────────────────────────────────┐
│                    ÁQUILA PRO ECOSYSTEM                         │
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────────────┐ │
│  │  🤖 ANTIGRAVITY      │     │  🖥️ GOOGLE COLAB (GPU)       │ │
│  │  (Agente / Eu)       │     │  (Funcionário GPU)           │ │
│  │                      │     │                              │ │
│  │  ✅ Escrever código  │     │  ✅ Face recognition         │ │
│  │  ✅ Debugar           │     │  ✅ Embeddings faciais       │ │
│  │  ✅ Planejar          │     │  ✅ Detecção YOLO            │ │
│  │  ✅ Gerenciar tokens │     │  ✅ Processamento de imagem  │ │
│  │  ✅ Raciocínio        │     │  ✅ Inferência ONNX          │ │
│  │  ✅ Arquitetura       │     │  ✅ Benchmark GPU            │ │
│  │                      │     │                              │ │
│  │  ❌ GPU (não tenho)   │     │  ❌ Código (não é o foco)    │ │
│  │  ❌ Visão comp.       │     │  ❌ Chat/LLM (redundante)    │ │
│  └──────────────────────┘     └──────────────────────────────┘ │
│           │                              ▲                      │
│           │    HTTPS (Cloudflare Tunnel)  │                      │
│           └──────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos Criados

| Arquivo | Localização | Função |
|---------|-------------|--------|
| **GPU Engine (Colab)** | [`aquila_sovereign_engine.py`](file:///c:/aquila/colab/aquila_sovereign_engine.py) | Script que roda no Colab. Instala InsightFace + YOLO + FastAPI + túnel. |
| **Bridge (Electron)** | [`ColabGpuBridge.ts`](file:///c:/aquila/apps/electron/src/main/services/ColabGpuBridge.ts) | Serviço TypeScript que conecta o Electron ao Colab. Singleton, health check automático. |
| **Skill Docs** | [`SKILL.md`](file:///c:/aquila/.agent/skills/colab_offload/SKILL.md) | Documentação da skill atualizada com foco em visão. |

---

## Como Usar

### Passo 1: Iniciar o Colab

1. Abra o Google Colab: [colab.research.google.com](https://colab.research.google.com)
2. Crie um notebook novo
3. **Runtime → Alterar tipo → GPU** (T4 grátis ou A100 no Pro)
4. Cole o conteúdo inteiro de `aquila_sovereign_engine.py` numa célula
5. Execute (▶️)
6. Aguarde a mensagem com a **URL do túnel**

### Passo 2: Configurar no Áquila

Quando o Colab imprimir a URL, configure no Electron:

```typescript
import { colabGpuBridge } from './services/ColabGpuBridge';

// URL que o Colab imprime (muda a cada sessão)
colabGpuBridge.configure('https://algo-random.trycloudflare.com');
```

### Passo 3: Usar

```typescript
// Embeddings faciais (512 dimensões, GPU)
const faces = await colabGpuBridge.extractFaceEmbeddings(imageBuffer);

// Detectar pessoas no frame (YOLO, GPU)
const detections = await colabGpuBridge.detectObjects(frameBuffer, 0.5, "0");

// Comparar dois rostos
const match = await colabGpuBridge.compareFaces(photo1, photo2);

// Processar imagem (resize + sharpen + normalize)
const processed = await colabGpuBridge.processImage(img, "resize,sharpen,normalize");
```

---

## Endpoints do Servidor (Colab)

| Método | Endpoint | Descrição | VRAM |
|--------|----------|-----------|------|
| `GET` | `/health` | Status completo (GPU, uptime, stats) | — |
| `POST` | `/face/embeddings` | Embeddings ArcFace 512-dim | ~2GB |
| `POST` | `/face/compare` | Comparar 2 rostos (similaridade 0-1) | ~2GB |
| `POST` | `/face/batch` | Lote de embeddings | ~2GB |
| `POST` | `/detect` | Detecção YOLO (objetos/pessoas) | ~1GB |
| `POST` | `/process/image` | Processamento de imagem (ops variadas) | ~0.5GB |
| `POST` | `/benchmark` | Benchmark GPU (TFLOPs) | ~4GB |

**Total de VRAM em uso**: ~5-6GB → T4 (16GB) suporta tranquilo.

---

## Economia de Tokens

| Cenário | Sem Colab | Com Colab |
|---------|-----------|-----------|
| Face recognition | API paga ou CPU lento | GPU grátis, <50ms |
| Detecção de objetos | API paga | GPU grátis, <30ms |
| Processamento de imagem | CPU local | GPU, 10x mais rápido |
| Chat/código | Tokens do Antigravity | Tokens do Antigravity (sem mudança) |

> [!TIP]
> O Colab grátis dá ~12h de GPU por sessão. Com Colab Pro (~R\$50/mês), são ~24h e GPU A100 (80GB VRAM).

---

## Limitações

- **Sessão expira**: Precisa reiniciar o notebook periodicamente
- **URL muda**: Cada sessão gera nova URL do Cloudflare
- **Sem persistência**: Modelos são baixados de novo a cada sessão (~5min)
- **Latência de rede**: ~50-200ms por request (vs. local <5ms)

> [!NOTE]
> O `ColabGpuBridge` faz health check automático a cada 30s. Se o Colab cair, emite evento `offline` e o Áquila pode usar fallback local (CPU, mais lento).
