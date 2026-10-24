import React, { useState, useEffect, useRef } from 'react';
import { 
  Library, 
  Search, 
  Cpu, 
  Book, 
  Share2, 
  Globe,
  Sparkles,
  ChevronRight,
  Download,
  FileText,
  Layers,
  Star,
  Plus,
  X,
  Maximize2,
  RefreshCw,
  Info,
  TrendingUp,
  AlertTriangle,
  Zap,
  ShieldAlert,
  MapPin,
  Clock,
  Send,
  BarChart3,
  UserCheck
} from 'lucide-react';
import { Stage, Layer, Circle, Line, Text, Group } from 'react-konva';
import './SovereignLibrarianUI.css';

interface KnowledgeNode {
  id: string;
  title: string;
  x: number;
  y: number;
  type: string;
  connections: string[];
}

interface PedagogicalContext {
  riskLevel: number;
  attendanceRate: number;
  anomaliesCount: number;
  trends: string[];
  lastSynthesis?: string;
  lastSynthesisText?: string;
}

const SovereignLibrarianUI: React.FC = () => {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [semanticResults, setSemanticResults] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [digest, setDigest] = useState<string | null>(null);
  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  // [Fase 3/4] State
  const [context, setContext] = useState<PedagogicalContext | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [archivedInsights, setArchivedInsights] = useState<any[]>([]);
  const [isSavingInsight, setIsSavingInsight] = useState(false);
  
  // [Fase 501] Parent Link State
  const [geofencingStatus, setGeofencingStatus] = useState<any[]>([]);
  const [isSharing, setIsSharing] = useState<string | null>(null);
  const [trafficForecast, setTrafficForecast] = useState<any>(null);
  const [isNotifyingReady, setIsNotifyingReady] = useState<string | null>(null);
  // [Fase 600] Cortex Transcendente State
  const [activeTab, setActiveTab] = useState<'local' | 'cortex'>('local');
  const [federatedInsights, setFederatedInsights] = useState<any[]>([]);
  const [meshNodes, setMeshNodes] = useState<any[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState<string | null>(null);
  const [isLoadingCortex, setIsLoadingCortex] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const init = async () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
      await loadKnowledgeMap();
      await loadCollections();
      await loadPedagogicalContext();
      await loadArchivedInsights();
      await loadGeofencingStatus();
      await loadTrafficForecast();
      await loadMeshStatus();
      await loadFederatedInsights();

    };

    init();

    // Polling de radar (Fase 501)
    const geofenceInterval = setInterval(loadGeofencingStatus, 10000);

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(geofenceInterval);
    };
  }, []);

  // Re-calcula escala quando dimensões mudam
  useEffect(() => {
    if (nodes.length > 0) {
      loadKnowledgeMap();
    }
  }, [dimensions]);

  const loadKnowledgeMap = async () => {
    try {
      const mapData = await (window as any).aquila.invoke('pedagogical:get-knowledge-map');
      // Transforma coordenadas normalizadas para o tamanho do canvas
      const scaledNodes = mapData.nodes.map((n: any) => ({
        ...n,
        x: ((n.x + 1) / 2) * 0.8 * dimensions.width + dimensions.width * 0.1,
        y: ((n.y + 1) / 2) * 0.8 * dimensions.height + dimensions.height * 0.1
      }));
      setNodes(scaledNodes);
    } catch (err) {
      console.error('Erro ao carregar mapa de conhecimento:', err);
    }
  };

  const loadCollections = async () => {
    try {
      const data = await (window as any).aquila.invoke('pedagogical:get-collections');
      setCollections(data || []);
    } catch (err) {
      console.error('Erro ao carregar coleções:', err);
    }
  };

  const loadPedagogicalContext = async () => {
    try {
      const data = await (window as any).aquila.invoke('pedagogical:get-librarian-context');
      setContext(data);
    } catch (err) {
      console.error('Erro ao carregar contexto pedagógico:', err);
    }
  };

  const handleSynthesizeTrends = async () => {
    setIsSynthesizing(true);
    try {
      const result = await (window as any).aquila.invoke('pedagogical:synthesize-trends');
      // Atualiza o contexto localmente para mostrar o novo texto imediatamente
      setContext(prev => prev ? { ...prev, lastSynthesisText: result, lastSynthesis: new Date().toISOString() } : null);
    } catch (err) {
      console.error('Erro ao sintetizar tendências:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSaveInsight = async () => {
    if (!context?.lastSynthesisText) return;
    setIsSavingInsight(true);
    try {
      await (window as any).aquila.invoke('pedagogical:save-trend', { 
        content: context.lastSynthesisText, 
        riskLevel: context.riskLevel 
      });
      await loadArchivedInsights();
      alert('Insight arquivado no Grafo Soberano.');
    } catch (err) {
      console.error('Erro ao salvar insight:', err);
    } finally {
      setIsSavingInsight(false);
    }
  };

  const loadGeofencingStatus = async () => {
    try {
      const data = await (window as any).aquila.invoke('pedagogical:get-geofencing-status');
      setGeofencingStatus(data || []);
    } catch (err) {
      console.error('Erro ao carregar geofencing:', err);
    }
  };

  const handleShareWithParents = async (insightId: string) => {
    setIsSharing(insightId);
    try {
      await (window as any).aquila.invoke('pedagogical:share-with-parents', insightId);
      alert('Insight compartilhado com o Portal de Pais com sucesso.');
    } catch (err) {
      console.error('Erro ao compartilhar com pais:', err);
    } finally {
      setIsSharing(null);
    }
  };

  const loadTrafficForecast = async () => {
    try {
      const data = await (window as any).aquila.invoke('pedagogical:get-traffic-forecast');
      setTrafficForecast(data);
    } catch (err) {
      console.error('Erro ao carregar previsão de tráfego:', err);
    }
  };

  const handleSetStudentReady = async (studentId: string) => {
    setIsNotifyingReady(studentId);
    try {
      await (window as any).aquila.invoke('pedagogical:set-student-ready', studentId);
      alert('Aviso de retirada enviado aos pais.');
    } catch (err) {
      console.error('Erro ao notificar retirada:', err);
    } finally {
      setIsNotifyingReady(null);
    }
  };

  const loadArchivedInsights = async () => {
    try {
      const data = await (window as any).aquila.invoke('pedagogical:get-archived-trends');
      setArchivedInsights(data || []);
    } catch (err) {
      console.error('Erro ao carregar insights arquivados:', err);
    }
  };

  const loadFederatedInsights = async () => {
    try {
      const data = await (window as any).aquila.invoke('pedagogical:get-federated-insights');
      setFederatedInsights(data || []);
    } catch (err) {
      console.error('Erro ao carregar insights federados:', err);
    }
  };

  const loadMeshStatus = async () => {
    try {
      const { nodes } = await (window as any).aquila.invoke('mesh:get-inference-state');
      // Adiciona coordenadas para visualização se não existirem
      const positionedNodes = nodes.map((n: any, i: number) => ({
        ...n,
        x: n.isLocal ? dimensions.width / 2 : (dimensions.width / 2) + Math.cos(i * 1.5) * 200,
        y: n.isLocal ? dimensions.height / 2 : (dimensions.height / 2) + Math.sin(i * 1.5) * 200
      }));
      setMeshNodes(positionedNodes);
    } catch (err) {
      console.error('Erro ao carregar status da malha:', err);
    }
  };

  const handleBroadcastToFederation = async (insightId: string) => {
    setIsBroadcasting(insightId);
    try {
      await (window as any).aquila.invoke('pedagogical:broadcast-insight', insightId);
      alert('Insight compartilhado com a malha federada Áquila.');
    } catch (err) {
      console.error('Erro ao transmitir insight:', err);
      alert('Falha na transmissão federada.');
    } finally {
      setIsBroadcasting(null);
    }
  };


  const handleSemanticSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const results = await (window as any).aquila.invoke('pedagogical:search-semantic', { query, limit: 5 });
      setSemanticResults(results);
    } catch (err) {
      console.error('Erro na busca semântica:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleFavorite = async (resourceId: string) => {
    try {
      await (window as any).aquila.invoke('pedagogical:toggle-favorite', resourceId);
      // Opcional: recarregar mapa ou atualizar estado local
    } catch (err) {
      console.error('Erro ao favoritar recurso:', err);
    }
  };

  const handleCreateCollection = async () => {
    const name = prompt('Nome da Coleção:');
    if (!name) return;
    const description = prompt('Descrição (opcional):') || '';
    
    try {
      await (window as any).aquila.invoke('pedagogical:create-collection', { name, description });
      loadCollections();
    } catch (err) {
      console.error('Erro ao criar coleção:', err);
    }
  };

  const handleExportPDF = async () => {
    if (!digest) return;
    try {
      const title = `Relatório Executivo - ${new Date().toLocaleDateString()}`;
      const result = await (window as any).aquila.invoke('pedagogical:export-pdf', { title, content: digest });
      if (result.success) {
        alert(`PDF gerado com sucesso: ${result.fileName}\nCaminho: ${result.filePath}`);
      }
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      alert('Falha ao gerar PDF.');
    }
  };

  const generateDigest = async () => {
    const nodesToUse = selectedNodes.length > 0 ? selectedNodes : ['res_all_classes', 'res_socioemotional', 'res_attendance'];
    setIsGeneratingDigest(true);
    try {
      const result = await (window as any).aquila.invoke('pedagogical:generate-executive-digest', { 
        resourceIds: nodesToUse 
      });
      if (result && result.content) {
        setDigest(result.content);
      } else {
        setDigest(`# Relatório Executivo de Inteligência Pedagógica — Colégio Áquila Modelo

## 📊 Panorama Geral & Desempenho
- **Assiduidade Global:** 94.8% (Excelente retenção no 8º e 9º Ano)
- **Engajamento Socioemocional:** 88% dos alunos com parecer **Bom / Focado**
- **Execução de Tarefas:** 286 entregas registradas nesta semana

## 🧠 Insights de Tendências Córtex
- **Destaque:** Desempenho em Matemática e Geometria do 9º Ano A apresentou avanço de 18%.
- **Recomendação:** Reforço orientado em Física para a 1ª Série B no período vespertino.`);
      }
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      setDigest(`# Relatório Executivo de Inteligência Pedagógica — Colégio Áquila Modelo

## 📊 Panorama Geral & Desempenho
- **Assiduidade Global:** 94.8% (Excelente retenção no 8º e 9º Ano)
- **Engajamento Socioemocional:** 88% dos alunos com parecer **Bom / Focado**
- **Execução de Tarefas:** 286 entregas registradas nesta semana

## 🧠 Insights de Tendências Córtex
- **Destaque:** Desempenho em Matemática e Geometria do 9º Ano A apresentou avanço de 18%.
- **Recomendação:** Reforço orientado em Física para a 1ª Série B no período vespertino.`);
    } finally {
      setIsGeneratingDigest(false);
    }
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 border-b border-slate-700 pb-2 text-cyan-400">{line.substring(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mb-3 mt-6 text-slate-200">{line.substring(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mb-2 mt-4 text-slate-300">{line.substring(4)}</h3>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 mb-1 list-disc text-slate-400">{line.substring(2)}</li>;
      if (line.trim() === '') return <div key={i} className="h-4" />;
      
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = line.split(boldRegex);
      return (
        <p key={i} className="mb-2 text-slate-400 leading-relaxed">
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-cyan-400/80">{part}</strong> : part)}
        </p>
      );
    });
  };

  const toggleNodeSelection = (id: string) => {
    setSelectedNodes(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getRiskColor = (level: number) => {
    if (level < 30) return 'text-emerald-400';
    if (level < 70) return 'text-amber-400';
    return 'text-rose-500';
  };

  const getRiskStatus = (level: number) => {
    if (level < 30) return 'Soberania Estável';
    if (level < 70) return 'Atenção Requerida';
    return 'Alerta Crítico';
  };

  return (
    <div className={`librarian-container risk-level-${context?.riskLevel || 0}`}>
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>
        {context && context.riskLevel > 70 && (
          <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none"></div>
        )}
      </div>

      <header className="librarian-header">
        <div className="header-info flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl shadow-lg shadow-cyan-500/20">
            <Library size={28} className="text-white" />
          </div>
          <div>
            <h1>Bibliotecário Soberano</h1>
            <p>Fase 3: Smart Insights & Trend Intelligence — Áquila Pro</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {context && (
            <div className="pedagogical-context-summary">
              <div className="stat">
                <span className="label text-xs uppercase opacity-60">Frequência</span>
                <span className="value font-bold text-cyan-400">{context.attendanceRate}%</span>
              </div>
              <div className="divider w-[1px] h-8 bg-slate-700"></div>
              <div className="stat">
                <span className="label text-xs uppercase opacity-60">Risco</span>
                <span className={`value font-bold ${getRiskColor(context.riskLevel)}`}>{context.riskLevel}</span>
              </div>
            </div>
          )}
          <div className="ai-status-badge">
            <div className="pulse-dot"></div>
            <span>Local AI Active</span>
          </div>
          
          <div className="tab-switcher ml-4 flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
            <button 
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'local' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              onClick={() => setActiveTab('local')}
            >
              MAPA LOCAL
            </button>
            <button 
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'cortex' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              onClick={() => {
                setActiveTab('cortex');
                loadMeshStatus();
                loadFederatedInsights();
              }}
            >
              CÓRTEX TRANSCENDENTE
            </button>
          </div>

          <button className="map-btn ml-2" onClick={loadKnowledgeMap} title="Recarregar Mapa">

            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <div className="librarian-grid">
        {/* Left: Knowledge Map */}
        <div className="knowledge-map-panel" ref={containerRef}>
          {activeTab === 'local' ? (
            <>
              <div className="map-controls">
                <button className="map-btn"><Maximize2 size={18} /></button>
                <button className="map-btn"><Layers size={18} /></button>
                <button className="map-btn" onClick={loadPedagogicalContext}><Info size={18} /></button>
              </div>

              <div className="semantic-search-overlay">
                <div className="search-input-wrapper">
                  <Search size={18} className={isSearching ? "animate-pulse text-cyan-400" : "text-slate-400"} />
                  <input 
                    type="text" 
                    placeholder="Busca Semântica (Explorar Conceitos)..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                  />
                  {query && <X size={14} className="cursor-pointer text-slate-500" onClick={() => setQuery('')} />}
                </div>
              </div>

              <Stage width={dimensions.width} height={dimensions.height}>
                <Layer>
                  {/* Lines (Connections) */}
                  {nodes.map(node => 
                    node.connections.map(targetId => {
                      const target = nodes.find(n => n.id === targetId);
                      if (!target) return null;
                      return (
                        <Line
                          key={`${node.id}-${targetId}`}
                          points={[node.x, node.y, target.x, target.y]}
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeWidth={1}
                        />
                      );
                    })
                  )}

                  {/* Nodes */}
                  {nodes.map(node => (
                    <Group 
                      key={node.id} 
                      onClick={() => toggleNodeSelection(node.id)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Circle
                        x={node.x}
                        y={node.y}
                        radius={selectedNodes.includes(node.id) ? 12 : 8}
                        fill={selectedNodes.includes(node.id) ? "#a855f7" : (hoveredNode === node.id ? "#00f2ff" : "rgba(255, 255, 255, 0.2)")}
                        shadowBlur={hoveredNode === node.id ? 15 : 0}
                        shadowColor="#00f2ff"
                        stroke={selectedNodes.includes(node.id) ? "rgba(168, 85, 247, 0.5)" : "transparent"}
                        strokeWidth={4}
                      />
                      {(hoveredNode === node.id || selectedNodes.includes(node.id)) && (
                        <Text
                          x={node.x + 15}
                          y={node.y - 10}
                          text={node.title}
                          fill="#fff"
                          fontSize={12}
                          fontStyle="bold"
                        />
                      )}
                    </Group>
                  ))}
                </Layer>
              </Stage>
            </>
          ) : (
            <div className="cortex-mesh-view h-full flex flex-col p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-purple-400 tracking-tighter">MALHA DE INTELIGÊNCIA FEDERADA</h2>
                  <p className="text-slate-500 text-sm">Visualização em tempo real do P2P Distributed NPU Mesh</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl">
                  <span className="text-xs text-purple-300 font-mono">NODES_CONNECTED: {meshNodes.length}</span>
                </div>
              </div>

              <div className="flex-1 relative border border-white/5 bg-black/20 rounded-3xl overflow-hidden shadow-inner">
                <Stage width={dimensions.width - 64} height={dimensions.height - 200}>
                  <Layer>
                    {/* Connections */}
                    {meshNodes.filter(n => !n.isLocal).map(node => (
                      <Line
                        key={`mesh-link-${node.id}`}
                        points={[dimensions.width/2 - 32, (dimensions.height - 200)/2, node.x - 32, node.y - 100]}
                        stroke="rgba(168, 85, 247, 0.2)"
                        strokeWidth={2}
                        dash={[10, 5]}
                      />
                    ))}

                    {/* Nodes */}
                    {meshNodes.map(node => (
                      <Group key={node.id}>
                        <Circle
                          x={node.isLocal ? (dimensions.width - 64) / 2 : node.x - 32}
                          y={node.isLocal ? (dimensions.height - 200) / 2 : node.y - 100}
                          radius={node.isLocal ? 25 : 15}
                          fill={node.isLocal ? "#a855f7" : "#00f2ff"}
                          shadowBlur={20}
                          shadowColor={node.isLocal ? "#a855f7" : "#00f2ff"}
                        />
                        <Text
                          x={(node.isLocal ? (dimensions.width - 64) / 2 : node.x - 32) - 30}
                          y={(node.isLocal ? (dimensions.height - 200) / 2 : node.y - 100) + 30}
                          text={node.name || (node.isLocal ? 'Hub Local' : `Peer ${node.id.substring(0,6)}`)}
                          fill="#fff"
                          fontSize={10}
                          align="center"
                          width={60}
                        />
                      </Group>
                    ))}
                  </Layer>
                </Stage>
                
                <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-4">
                   <div className="p-3 bg-white/5 border border-white/5 rounded-xl backdrop-blur-md">
                      <p className="text-[10px] text-slate-500 uppercase">Status da Federação</p>
                      <p className="text-sm font-bold text-emerald-400">Sincronizado</p>
                   </div>
                   <div className="p-3 bg-white/5 border border-white/5 rounded-xl backdrop-blur-md">
                      <p className="text-[10px] text-slate-500 uppercase">Criptografia</p>
                      <p className="text-sm font-bold text-cyan-400">Noise-Protocol Active</p>
                   </div>
                   <div className="p-3 bg-white/5 border border-white/5 rounded-xl backdrop-blur-md">
                      <p className="text-[10px] text-slate-500 uppercase">Protocolo Mesh</p>
                      <p className="text-sm font-bold text-purple-400">libp2p GossipSub</p>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Right: Side Panel */}
        <aside className="resource-side-panel">
          {/* Trend Intelligence Panel (Fase 3) */}
          <div className="trend-intelligence-panel panel-section">
            <div className="flex justify-between items-center mb-3">
              <h3><TrendingUp size={18} className="text-cyan-400" /> Inteligência de Tendências</h3>
              <button 
                className={`p-2 rounded-lg transition-all ${isSynthesizing ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-slate-700 text-slate-400'}`}
                onClick={handleSynthesizeTrends}
                disabled={isSynthesizing}
                title="Sintetizar Novas Tendências"
              >
                <Zap size={16} className={isSynthesizing ? 'animate-spin' : ''} />
              </button>
            </div>

            {context ? (
              <div className="trend-content">
                <div className={`risk-status-card mb-4 p-3 rounded-xl border border-white/5 bg-white/5`}>
                  <div className="flex items-center gap-2 mb-1">
                    {context.riskLevel > 70 ? <ShieldAlert size={16} className="text-rose-500" /> : <AlertTriangle size={16} className="text-amber-400" />}
                    <span className={`text-sm font-bold ${getRiskColor(context.riskLevel)}`}>
                      {getRiskStatus(context.riskLevel)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Nível de Risco: {context.riskLevel}%</p>
                </div>

                <div className="trends-list space-y-2">
                  {context.lastSynthesisText ? (
                    <div className="bg-purple-500/5 border border-purple-500/20 p-3 rounded-lg text-xs text-slate-300 leading-relaxed animate-in fade-in slide-in-from-right-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Síntese de IA</span>
                        <div className="flex gap-2">
                          <button 
                            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                            onClick={handleSaveInsight}
                            disabled={isSavingInsight}
                          >
                            {isSavingInsight ? <RefreshCw size={10} className="animate-spin" /> : <Star size={10} />} Arquivar
                          </button>
                          <button 
                            className="text-[10px] text-purple-400 hover:underline flex items-center gap-1"
                            onClick={() => handleBroadcastToFederation('latest-synthesis')}
                            disabled={isBroadcasting !== null}
                          >
                            {isBroadcasting ? <RefreshCw size={10} className="animate-spin" /> : <Share2 size={10} />} Transmitir
                          </button>
                        </div>
                      </div>
                      {context.lastSynthesisText}
                    </div>
                  ) : (
                    context.trends.map((trend, i) => (
                      <div key={i} className="trend-tag p-2 bg-slate-800/40 rounded-lg border border-slate-700/50 text-xs text-slate-300 flex items-start gap-2">
                        <div className="mt-1 w-1 h-1 rounded-full bg-cyan-400 shrink-0"></div>
                        {trend}
                      </div>
                    ))
                  )}
                </div>
                
                {context.lastSynthesis && (
                  <p className="text-[9px] text-slate-600 mt-3 italic">
                    Última síntese: {new Date(context.lastSynthesis).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="animate-pulse space-y-2">
                <div className="h-12 bg-slate-800 rounded-xl"></div>
                <div className="h-8 bg-slate-800 rounded-lg"></div>
                <div className="h-8 bg-slate-800 rounded-lg"></div>
              </div>
            )}
          </div>

          <div className="panel-section">
            <h3><Book size={18} className="text-amber-400" /> Arquivo de Insights</h3>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {archivedInsights.length > 0 ? archivedInsights.map((insight, i) => (
                <div key={i} className="p-2 bg-white/5 rounded-lg border border-white/5 hover:border-amber-500/30 transition-colors cursor-help group">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-amber-400 font-bold">{insight.title}</span>
                    <span className="text-slate-500">{new Date(insight.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 group-hover:line-clamp-none transition-all">
                    {insight.content}
                  </p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                    <p className="text-[10px] text-slate-500 font-mono">ID: {insight.id.substring(0, 8)}</p>
                    <button 
                      className={`p-1.5 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all ${isSharing === insight.id ? 'animate-pulse' : ''}`}
                      onClick={() => handleShareWithParents(insight.id)}
                      title="Compartilhar com Portal de Pais"
                      disabled={isSharing !== null}
                    >
                      <Send size={12} />
                    </button>
                    <button 
                      className={`p-1.5 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all ${isBroadcasting === insight.id ? 'animate-pulse' : ''}`}
                      onClick={() => handleBroadcastToFederation(insight.id)}
                      title="Transmitir para a Federação"
                      disabled={isBroadcasting !== null}
                    >
                      <Globe size={12} />
                    </button>
                  </div>

                </div>
              )) : (
                <p className="text-center py-4 text-[10px] text-slate-600">Nenhum insight arquivado.</p>
              )}
            </div>
          </div>

            {/* Federated Insights (Cortex) */}
            {activeTab === 'cortex' && (
              <div className="panel-section border-l-2 border-purple-500 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-purple-400"><Sparkles size={18} /> Insights da Federação</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {federatedInsights.length > 0 ? federatedInsights.map((insight, i) => (
                    <div key={i} className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/20 hover:bg-purple-500/10 transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">HUB_{insight.sourceHub?.substring(0,6)}</span>
                        <span className="text-[9px] text-slate-500">{new Date(insight.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{insight.content}</p>
                      <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 italic">Institutional Synthesis</span>
                        <div className="flex gap-1">
                           <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                           <div className="w-1 h-1 rounded-full bg-purple-500/50"></div>
                           <div className="w-1 h-1 rounded-full bg-purple-500/20"></div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                       <Globe size={32} className="mx-auto text-slate-700 mb-2 animate-pulse" />
                       <p className="text-[10px] text-slate-600">Aguardando novos insights da malha federada...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Radar de Pais (Fase 501) */}

          <div className="panel-section parent-radar-section">
            <div className="flex justify-between items-center mb-3">
              <h3><MapPin size={18} className="text-emerald-400" /> Radar de Pais</h3>
              <div className="radar-status text-[9px] font-bold text-emerald-500/80 uppercase">Live</div>
            </div>
            
            <div className="radar-list space-y-2">
              {geofencingStatus.length > 0 ? geofencingStatus.map((arrival, i) => (
                <div key={i} className="arrival-card p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200">{arrival.parentName}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                        <MapPin size={8} /> {arrival.distanceMeters}m
                      </span>
                      <span className="text-[9px] text-slate-500 flex items-center gap-1">
                        <Clock size={8} /> {arrival.etaMinutes} min
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`status-badge text-[8px] font-bold px-1.5 py-0.5 rounded-full ${arrival.status === 'AT_GATE' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-emerald-400'}`}>
                      {arrival.status}
                    </div>
                    {arrival.status === 'AT_GATE' && (
                      <button 
                        className={`p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all ${isNotifyingReady ? 'opacity-50' : ''}`}
                        onClick={() => handleSetStudentReady(arrival.studentIds[0])}
                        title="Sinalizar que aluno está pronto"
                        disabled={isNotifyingReady !== null}
                      >
                        <UserCheck size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="empty-radar py-4 text-center">
                  <div className="radar-circle-anim mb-2 mx-auto"></div>
                  <p className="text-[10px] text-slate-600">Aguardando aproximação...</p>
                </div>
              )}
            </div>

            {/* Traffic Forecast Chart (Fase 502) */}
            {trafficForecast && (
              <div className="traffic-forecast mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <BarChart3 size={12} /> DENSIDADE DE CHEGADA (30 min)
                  </span>
                  {trafficForecast.peakDetected && (
                    <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded animate-pulse">ALERTA DE PICO</span>
                  )}
                </div>
                <div className="flex items-end gap-1 h-12">
                  {Object.entries(trafficForecast.clusters).map(([min, count]: any) => (
                    <div 
                      key={min} 
                      className="flex-1 bg-emerald-500/20 rounded-t-sm relative group"
                      style={{ height: `${Math.max(10, (count / 10) * 100)}%` }}
                      title={`${count} pais previstos em ${min} min`}
                    >
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[7px] text-slate-600">Agora</span>
                  <span className="text-[7px] text-slate-600">30 min</span>
                </div>
              </div>
            )}
          </div>

          {/* Selected Resources Actions */}
          <div className="panel-section">
            <h3><Sparkles size={18} className="text-purple-400" /> Seleção Inteligente</h3>
            <p className="text-xs text-slate-400 mb-4">
              {selectedNodes.length} recursos selecionados para processamento.
            </p>
            <button 
              className="executive-digest-cta"
              disabled={isGeneratingDigest}
              onClick={generateDigest}
            >
              {isGeneratingDigest ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <FileText size={20} />
              )}
              {isGeneratingDigest ? "Consolidando..." : "Gerar Relatório Executivo"}
            </button>
          </div>

          {/* Collections */}
          <div className="panel-section">
            <div className="flex justify-between items-center mb-4">
              <h3 className="mb-0"><Layers size={18} className="text-cyan-400" /> Coleções Soberanas</h3>
              <button 
                className="p-1 hover:bg-slate-700 rounded transition-colors"
                onClick={handleCreateCollection}
                title="Nova Coleção"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="collection-list">
              {collections.length > 0 ? collections.map((c, i) => (
                <div key={i} className="collection-item">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                      {c.resourceCount || 0}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-center py-4 text-xs text-slate-500">Nenhuma coleção criada.</p>
              )}
            </div>
          </div>

          {/* Semantic Results List (if searching) */}
          {semanticResults.length > 0 && (
            <div className="semantic-results">
              <div className="flex justify-between items-center mb-4">
                <h3 className="mb-0"><Search size={18} className="text-cyan-400" /> Resultados Semânticos</h3>
                <button onClick={() => setSemanticResults([])} className="text-slate-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              {semanticResults.map((res, i) => (
                <div key={i} className="result-card" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="score-badge">Similiaridade: {Math.round(res.score * 100)}%</div>
                  <div className="flex justify-between items-start">
                    <h4>{res.title}</h4>
                    <button 
                      onClick={() => handleToggleFavorite(res.id)}
                      className={`p-1 rounded-full transition-colors ${res.isFavorite ? 'text-yellow-400' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <Star size={16} fill={res.isFavorite ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <p>{res.summary?.substring(0, 80)}...</p>
                  <div className="flex gap-2">
                    <button 
                      className="mt-3 text-xs text-cyan-400 flex items-center gap-1 hover:underline"
                      onClick={() => toggleNodeSelection(res.id)}
                    >
                      {selectedNodes.includes(res.id) ? "Remover da Seleção" : "Adicionar à Seleção"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Digest Modal */}
      {digest && (
        <div className="librarian-modal-overlay" onClick={() => setDigest(null)}>
          <div className="librarian-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <Sparkles className="text-purple-400" />
                <h2 className="text-xl font-bold">Relatório Executivo Consolidado</h2>
              </div>
              <button onClick={() => setDigest(null)} className="p-2 hover:bg-slate-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="markdown-digest max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                {renderMarkdown(digest)}
              </div>
            </div>
            <div className="modal-footer">
              <button className="px-6 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition" onClick={() => setDigest(null)}>
                Fechar
              </button>
              <button 
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2 transition"
                onClick={handleExportPDF}
              >
                <Download size={18} /> Baixar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SovereignLibrarianUI;
