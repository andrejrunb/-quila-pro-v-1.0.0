import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, Shield, Terminal, Copy, Check, ExternalLink, RefreshCw, Layers } from 'lucide-react';
import './GpuAccelerationCockpit.css';

export interface GpuTelemetryData {
  timestamp: string;
  nvidiaCloud: {
    status: 'ONLINE' | 'OFFLINE';
    latencyMs: number;
    activeModel: string;
    availableModelsCount: number;
  };
  colabGpu: {
    status: 'ONLINE' | 'STANDBY';
    url: string;
    device?: string;
    vramTotalGb?: number;
    vramUsedGb?: number;
    capabilities?: {
      insightface: boolean;
      yolo: boolean;
    };
  };
  localEdge: {
    device: string;
    acceleration: string;
    directMlSupported: boolean;
  };
}

export const GpuAccelerationCockpit: React.FC = () => {
  const [telemetry, setTelemetry] = useState<GpuTelemetryData>({
    timestamp: 'Carregando...',
    nvidiaCloud: {
      status: 'ONLINE',
      latencyMs: 520,
      activeModel: 'minimaxai/minimax-m3.1-flash',
      availableModelsCount: 85
    },
    colabGpu: {
      status: 'STANDBY',
      url: 'https://agriculture-lime-rendering-budapest.trycloudflare.com',
      device: 'NVIDIA A100-SXM4-80GB',
      vramTotalGb: 80,
      vramUsedGb: 0,
      capabilities: { insightface: true, yolo: true }
    },
    localEdge: {
      device: 'AMD Radeon(TM) Vega 8 Graphics',
      acceleration: 'DirectML / ONNX Runtime DmlExecutionProvider',
      directMlSupported: true
    }
  });

  const [colabUrlInput, setColabUrlInput] = useState<string>('');
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dev Swarm Studio State
  const [selectedRole, setSelectedRole] = useState<'coder' | 'architect' | 'qa' | 'security'>('coder');
  const [devPrompt, setDevPrompt] = useState<string>('Crie uma função TypeScript que calcule o score TRI 3PL com estimativa de máxima verossimilhança.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [lastMeta, setLastMeta] = useState<{ model: string; latencyMs: number; tokens?: number } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [logs, setLogs] = useState<string[]>([
    '[INIT] Cockpit de Aceleração por Hardware Áquila Pro v2.1 carregado.',
    '[NVIDIA DGX] Conexão ativa com 85 supermodelos no cluster NVIDIA NIM.',
    '[EDGE LOCAL] Acelerador AMD Radeon Vega 8 ativo com DirectML.',
    '[COLAB A100] Monitor de túnel pronto para orquestração de cargas pesadas.'
  ]);

  const fetchTelemetry = async () => {
    setIsRefreshing(true);
    try {
      if ((window as any).aquila?.invoke) {
        const data = await (window as any).aquila.invoke('hardware:get-telemetry');
        if (data) {
          setTelemetry(data);
          if (data.colabGpu?.url) {
            setColabUrlInput(data.colabGpu.url);
          }
          setLogs(prev => [`[${new Date().toLocaleTimeString()}] Telemetria atualizada: NVIDIA Cloud ${data.nvidiaCloud.latencyMs}ms | Colab ${data.colabGpu.status}`, ...prev]);
        }
      }
    } catch (err: any) {
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] Erro ao buscar telemetria: ${err.message}`, ...prev]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectColab = async () => {
    if (!colabUrlInput.trim()) return;
    setIsUpdatingUrl(true);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] Conectando túnel Colab: ${colabUrlInput}...`, ...prev]);
    try {
      if ((window as any).aquila?.invoke) {
        const res = await (window as any).aquila.invoke('hardware:set-colab-url', colabUrlInput.trim());
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] Resposta Colab: ${res.message}`, ...prev]);
        await fetchTelemetry();
      }
    } catch (err: any) {
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] Falha ao configurar Colab: ${err.message}`, ...prev]);
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  const handleRunDevTask = async () => {
    if (!devPrompt.trim()) return;
    setIsGenerating(true);
    setGeneratedResult('');
    setLastMeta(null);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] Despachando tarefa [${selectedRole}] para a GPU NVIDIA DGX...`, ...prev]);

    try {
      if ((window as any).aquila?.invoke) {
        const res = await (window as any).aquila.invoke('hardware:dev-task', {
          role: selectedRole,
          prompt: devPrompt
        });

        if (res.success) {
          setGeneratedResult(res.response);
          setLastMeta({
            model: res.model,
            latencyMs: res.latencyMs,
            tokens: res.tokens
          });
          setLogs(prev => [`[${new Date().toLocaleTimeString()}] ✅ GPU Swarm respondeu em ${res.latencyMs}ms via ${res.model} (${res.tokens || 0} tokens)`, ...prev]);
        } else {
          setGeneratedResult(`❌ Falha: ${res.response}`);
          setLogs(prev => [`[${new Date().toLocaleTimeString()}] ❌ Erro na GPU: ${res.response}`, ...prev]);
        }
      } else {
        // Simulação local em modo dev
        setTimeout(() => {
          setGeneratedResult(`// Código gerado via GPU Swarm (Modo de Demonstração)\nexport function calculateTRI(hits: boolean[]): number {\n  return 500 + hits.filter(Boolean).length * 50;\n}`);
          setLastMeta({ model: 'minimaxai/minimax-m3.1-flash', latencyMs: 480, tokens: 65 });
          setIsGenerating(false);
        }, 1200);
        return;
      }
    } catch (err: any) {
      setGeneratedResult(`❌ Erro de IPC: ${err.message}`);
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] Erro: ${err.message}`, ...prev]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="gpu-cockpit-container" data-testid="gpu-acceleration-cockpit">
      {/* HEADER */}
      <header className="gpu-cockpit-header">
        <div className="gpu-title-area">
          <div className="gpu-badge-row">
            <span className="badge nvidia"><Zap size={13} /> NVIDIA CLOUD DGX H100</span>
            <span className="badge colab"><Cpu size={13} /> GOOGLE COLAB A100-80GB</span>
            <span className="badge edge"><Layers size={13} /> DIRECTML EDGE ACCELERATION</span>
          </div>
          <h1>Córtex de Aceleração por Hardware & GPU Dev Swarm</h1>
          <p className="subtitle">
            Supercomputação Híbrida para Desenvolvimento Autônomo e Execução Pedagógica do Áquila Pro
          </p>
        </div>

        <button className="btn-refresh" onClick={fetchTelemetry} disabled={isRefreshing}>
          <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
          <span>{isRefreshing ? 'Sincronizando...' : 'Atualizar Telemetria'}</span>
        </button>
      </header>

      {/* CLUSTERS GRID */}
      <div className="gpu-clusters-grid">
        {/* CARD 1: NVIDIA CLOUD DGX H100 */}
        <div className="cluster-card nvidia-card">
          <div className="card-top">
            <div className="cluster-meta">
              <span className="cluster-icon nvidia-icon"><Zap size={20} /></span>
              <div>
                <h2>NVIDIA Cloud DGX H100</h2>
                <span className="cluster-sub">Cluster de Supercomputação NIM</span>
              </div>
            </div>
            <span className={`status-pill ${telemetry.nvidiaCloud.status.toLowerCase()}`}>
              {telemetry.nvidiaCloud.status}
            </span>
          </div>

          <div className="cluster-stats">
            <div className="stat-box">
              <span className="stat-lbl">Latência de Inferência</span>
              <span className="stat-val accent-green">{telemetry.nvidiaCloud.latencyMs} ms</span>
            </div>
            <div className="stat-box">
              <span className="stat-lbl">Supermodelos Prontos</span>
              <span className="stat-val">{telemetry.nvidiaCloud.availableModelsCount} modelos</span>
            </div>
          </div>

          <div className="cluster-features">
            <div className="feature-item">
              <span className="dot online" />
              <span>Modelo de Código: <strong>minimax-m3.1-flash</strong></span>
            </div>
            <div className="feature-item">
              <span className="dot online" />
              <span>Raciocínio Profundo: <strong>nemotron-3.5-lightning</strong></span>
            </div>
            <div className="feature-item">
              <span className="dot online" />
              <span>Visão & OCR: <strong>llama-3.2-90b-vision</strong></span>
            </div>
          </div>
        </div>

        {/* CARD 2: GOOGLE COLAB PRO A100 */}
        <div className="cluster-card colab-card">
          <div className="card-top">
            <div className="cluster-meta">
              <span className="cluster-icon colab-icon"><Cpu size={20} /></span>
              <div>
                <h2>Google Colab Pro A100</h2>
                <span className="cluster-sub">Processamento Gráfico & Tensores</span>
              </div>
            </div>
            <span className={`status-pill ${telemetry.colabGpu.status.toLowerCase()}`}>
              {telemetry.colabGpu.status}
            </span>
          </div>

          <div className="colab-url-box">
            <label>URL do Túnel Cloudflare</label>
            <div className="input-group">
              <input
                type="text"
                value={colabUrlInput}
                onChange={(e) => setColabUrlInput(e.target.value)}
                placeholder="https://xxx.trycloudflare.com"
              />
              <button onClick={handleConnectColab} disabled={isUpdatingUrl}>
                {isUpdatingUrl ? 'Conectando...' : 'Conectar'}
              </button>
            </div>
          </div>

          <div className="cluster-stats">
            <div className="stat-box">
              <span className="stat-lbl">VRAM Dedicada</span>
              <span className="stat-val accent-purple">{telemetry.colabGpu.vramTotalGb || 80} GB A100</span>
            </div>
            <div className="stat-box">
              <span className="stat-lbl">ArcFace 512-D</span>
              <span className="stat-val accent-green">
                {telemetry.colabGpu.capabilities?.insightface ? 'Habilitado' : 'Pronto'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: HARDWARE EDGE LOCAL */}
        <div className="cluster-card edge-card">
          <div className="card-top">
            <div className="cluster-meta">
              <span className="cluster-icon edge-icon"><Layers size={20} /></span>
              <div>
                <h2>Acelerador Edge Local</h2>
                <span className="cluster-sub">GPU & NPU Integrados</span>
              </div>
            </div>
            <span className="status-pill online">ATIVO</span>
          </div>

          <div className="edge-info-box">
            <span className="edge-device-name">{telemetry.localEdge.device}</span>
            <span className="edge-driver">ONNX DirectML Hardware Execution Provider</span>
          </div>

          <div className="cluster-features">
            <div className="feature-item">
              <span className="dot online" />
              <span>Aceleração Gráfica: <strong>Ativa via DirectX 12</strong></span>
            </div>
            <div className="feature-item">
              <span className="dot online" />
              <span>Privacidade Soberana: <strong>Zero vazamento biométrico</strong></span>
            </div>
            <div className="feature-item">
              <span className="dot online" />
              <span>Operação Offline: <strong>100% Autônomo na Borda</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* DEV SWARM STUDIO: DESENVOLVIMENTO COM AS GPUS */}
      <section className="dev-swarm-studio">
        <div className="studio-head">
          <div className="studio-title-wrap">
            <Terminal size={18} className="text-emerald-400" />
            <div>
              <h3>Estúdio de Engenharia GPU Dev Swarm</h3>
              <p>Despache demandas de código, refatoração, arquitetura e testes diretamente para os clusters de GPU</p>
            </div>
          </div>

          <div className="role-selector">
            {(['coder', 'architect', 'qa', 'security'] as const).map((r) => (
              <button
                key={r}
                className={`role-btn ${selectedRole === r ? 'active' : ''}`}
                onClick={() => setSelectedRole(r)}
              >
                {r === 'coder' && '💻 Engenheiro de Código'}
                {r === 'architect' && '🏛️ Arquiteto de Sistemas'}
                {r === 'qa' && '🧪 Engenheiro de QA & Testes'}
                {r === 'security' && '🛡️ Auditor de Segurança LGPD'}
              </button>
            ))}
          </div>
        </div>

        <div className="studio-input-area">
          <textarea
            value={devPrompt}
            onChange={(e) => setDevPrompt(e.target.value)}
            placeholder="Descreva a demanda de engenharia (ex: Crie um serviço de rate-limiting para o WebSocket do Áquila...)"
            rows={3}
          />
          <div className="studio-actions-bar">
            <button className="btn-dispatch-gpu" onClick={handleRunDevTask} disabled={isGenerating}>
              <Zap size={14} />
              <span>{isGenerating ? 'Processando na GPU...' : 'Despachar para o Cluster NVIDIA (Zero-Token-Waste)'}</span>
            </button>
          </div>
        </div>

        {/* CÓDIGO GERADO */}
        {generatedResult && (
          <div className="studio-output-area">
            <div className="output-header">
              <div className="output-meta">
                <span className="model-badge">{lastMeta?.model || 'nvidia-gpu'}</span>
                {lastMeta?.latencyMs && <span className="latency-badge">{lastMeta.latencyMs} ms</span>}
                {lastMeta?.tokens && <span className="tokens-badge">{lastMeta.tokens} tokens</span>}
              </div>
              <button className="btn-copy" onClick={copyToClipboard}>
                {copiedCode ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copiado!' : 'Copiar Solução'}</span>
              </button>
            </div>
            <pre className="output-code">
              <code>{generatedResult}</code>
            </pre>
          </div>
        )}
      </section>

      {/* TERMINAL DE TELEMETRIA AO VIVO */}
      <div className="gpu-terminal">
        <div className="terminal-header">
          <div className="terminal-lights">
            <span className="t-light red" />
            <span className="t-light yellow" />
            <span className="t-light green" />
          </div>
          <span className="terminal-title">Log de Execução & Telemetria do Cluster Híbrido</span>
        </div>
        <div className="terminal-body">
          {logs.map((log, idx) => (
            <div key={idx} className="terminal-line">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
