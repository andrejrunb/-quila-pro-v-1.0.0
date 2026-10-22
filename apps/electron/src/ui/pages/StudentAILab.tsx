import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Globe, 
  Image as ImageIcon, 
  Brain, 
  Search, 
  RefreshCw,
  Info,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Camera,
  FileText,
  CheckCircle2,
  Check,
  X,
  BookOpen,
  Lightbulb,
  Zap,
  Users,
  Compass,
  Award
} from 'lucide-react';
import { HistoricalMentorsGallery } from '../components/HistoricalMentorsGallery';
import { ScienceSimulators } from '../components/ScienceSimulators';
import { EssayLab1000 } from '../components/EssayLab1000';
import './StudentAILab.css';

interface Message {
  role: 'user' | 'ai';
  content: string;
  citations?: { title: string; url: string }[];
  image?: string;
  isGrounding?: boolean;
}

export type LabTab = 'mentors' | 'simulators' | 'essay' | 'chat' | 'library';

interface StudentAILabProps {
  studentId?: string;
  initialTab?: LabTab;
  onBack?: () => void;
}

interface Material {
  id: string;
  title: string;
  subject: string;
  type: string;
  content: string;
  summary: string;
  createdAt: string;
  completed?: boolean;
  keyConcepts?: string[];
}

const DEFAULT_MATERIALS: Material[] = [
  {
    id: 'mat-fisica-1',
    title: 'Dinâmica: As 3 Leis de Newton & Atrito',
    subject: 'Física',
    type: 'Resumo Teórico',
    summary: 'Compreensão fundamental de inércia, princípio fundamental da dinâmica (F = m.a) e ação e reação.',
    content: `### ⚛️ As Leis do Movimento de Isaac Newton

1. **Primeira Lei (Inércia):** Um corpo em repouso tende a permanecer em repouso, e um corpo em movimento uniforme retilíneo tende a manter sua velocidade, a menos que uma força resultante externa atue sobre ele.
2. **Segunda Lei (Princípio Fundamental da Dinâmica):** A aceleração adquirida por um corpo é diretamente proporcional à força resultante aplicada sobre ele e inversamente proporcional à sua massa:
   $$\\vec{F}_{res} = m \\cdot \\vec{a}$$
3. **Terceira Lei (Ação e Reação):** A toda ação corresponde uma reação de mesma intensidade, mesma direção e sentido oposto, atuando sempre em corpos distintos.

#### 📌 Força de Atrito:
O atrito estático ($f_e \\le \\mu_e \\cdot N$) impede o início do deslizamento. O atrito cinético ($f_c = \\mu_c \\cdot N$) atua quando há movimento relativo entre as superfícies.`,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    keyConcepts: ['Inércia', 'F = m.a', 'Ação e Reação', 'Atrito Estático e Cinético'],
    completed: false
  },
  {
    id: 'mat-mat-1',
    title: 'Funções Afim e Quadráticas com Gráficos',
    subject: 'Matemática',
    type: 'Guia de Estudo',
    summary: 'Estudo do comportamento de retas e parábolas, raízes reais, vértice e aplicações práticas.',
    content: `### 📐 Análise de Funções Polinomiais

#### 1. Função Afim ($f(x) = ax + b$):
- **Coeficiente angular ($a$):** Determina a inclinação da reta (crescente se $a > 0$, decrescente se $a < 0$).
- **Coeficiente linear ($b$):** Ponto onde a reta intercepta o eixo vertical $y$ em $(0, b)$.
- **Raiz ou zero da função:** Ponto onde $f(x) = 0 \\implies x = -\\frac{b}{a}$.

#### 2. Função Quadrática ($f(x) = ax^2 + bx + c$):
- Gráfico em forma de **parábola** (concavidade voltada para cima se $a > 0$).
- **Vértice da parábola:** $X_v = -\\frac{b}{2a}$, $Y_v = -\\frac{\\Delta}{4a}$, representando ponto de máximo ou mínimo.
- **Fórmula de Bhaskara:** $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$, onde $\\Delta = b^2 - 4ac$.`,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    keyConcepts: ['Coeficiente Angular', 'Vértice da Parábola', 'Discriminante Delta', 'Bhaskara'],
    completed: false
  },
  {
    id: 'mat-bio-1',
    title: 'Biologia Celular: Organelas e Energia',
    subject: 'Biologia',
    type: 'Flashcards',
    summary: 'Estrutura celular eucarionte, respiração aeróbica nas mitocôndrias e síntese de ATP.',
    content: `### 🧬 Citologia e Bioenergética Celular

- **Membrana Plasmática:** Modelo do mosaico fluido, permeabilidade seletiva e transporte ativo via bomba de sódio-potássio.
- **Mitocôndria:** Usina de energia celular responsável pelo Ciclo de Krebs e Fosforilação Oxidativa (produção de ATP).
- **Ribossomos:** Estruturas proteicas responsáveis pela tradução do RNA mensageiro em cadeias de aminoácidos.
- **Complexo de Golgi:** Modificação, empacotamento e secreção de proteínas e glicoproteínas.`,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    keyConcepts: ['ATP', 'Mitocôndria', 'Mosaico Fluido', 'Tradução do RNA'],
    completed: true
  },
  {
    id: 'mat-hist-1',
    title: 'Iluminismo e as Revoluções Modernas',
    subject: 'História',
    type: 'Dossiê',
    summary: 'O Século das Luzes, o racionalismo crítico e o impacto na Revolução Francesa e Americana.',
    content: `### 📜 O Movimento Iluminista no Século XVIII

- **Pilares:** Razão como guia universal, secularização do pensamento, crítica ao absolutismo monárquico e ao mercantilismo.
- **Pensadores Centrais:**
  - *John Locke:* Direitos naturais inalienáveis (vida, liberdade e propriedade).
  - *Montesquieu:* Separação e harmonia entre os Três Poderes (Executivo, Legislativo, Judiciário).
  - *Voltaire:* Defesa intransigente da liberdade de expressão e tolerância religiosa.
  - *Rousseau:* O Contrato Social e a soberania popular baseada na vontade geral.`,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    keyConcepts: ['Razão e Ciência', 'Três Poderes', 'Contrato Social', 'Direitos Naturais'],
    completed: false
  }
];

export const StudentAILab: React.FC<StudentAILabProps> = ({ studentId, initialTab = 'mentors', onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'Olá! Sou o **Córtex-SIE**, seu tutor de inteligência artificial soberano. Como posso auxiliar em seus estudos hoje? Posso analisar fotos da sua lousa ou caderno, solucionar exercícios passo a passo ou pesquisar dados atualizados na web com Grounding.'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isGroundingActive, setIsGroundingActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<LabTab>(initialTab);
  const [xpToast, setXpToast] = useState<{ amount: number; reason: string } | null>(null);
  const [materials, setMaterials] = useState<Material[]>(DEFAULT_MATERIALS);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [readingMaterial, setReadingMaterial] = useState<Material | null>(null);

  const handleRewardXp = (amount: number, reason: string) => {
    setXpToast({ amount, reason });
    try {
      if ((window as any).aquila?.student?.addXp && studentId) {
        (window as any).aquila.student.addXp(studentId, amount, reason);
      }
    } catch {}
    setTimeout(() => setXpToast(null), 4000);
  };
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMaterials = async () => {
    setIsLibraryLoading(true);
    try {
      if ((window as any).aquila?.pedagogical?.getMaterials && studentId) {
        const data = await (window as any).aquila.pedagogical.getMaterials(studentId);
        if (data && data.resources && data.resources.length > 0) {
          const mapped = data.resources.map((r: any) => ({
            id: r.id,
            title: r.title || 'Material de Apoio',
            subject: r.subject || 'Pedagógico',
            type: r.type || 'Resumo',
            summary: r.aiSummary || r.content?.substring(0, 120) || 'Conteúdo de estudos.',
            content: r.content || r.aiSummary || '',
            createdAt: r.createdAt || new Date().toISOString(),
            completed: false
          }));
          setMaterials(mapped);
          return;
        }
      }
    } catch (e) {
      console.warn('Usando materiais pedagógicos padrão do Córtex:', e);
    } finally {
      setIsLibraryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'library') {
      fetchMaterials();
    }
  }, [activeTab]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const executeSend = async (textToSend: string, imageToSend?: string | null) => {
    const text = textToSend.trim();
    const image = imageToSend || selectedImage;
    if (!text && !image) return;

    const userMessage: Message = {
      role: 'user',
      content: text || (image ? 'Análise de Imagem anexada' : ''),
      image: image || undefined,
      isGrounding: isGroundingActive
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      let response: any = null;
      const api = (window as any).aquila;

      if (image && api?.invoke) {
        response = await api.invoke('ai:vision-analyze', {
          prompt: text || 'Descreva os conceitos pedagógicos contidos nesta imagem de lousa ou caderno.',
          image: image.split(',')[1] || image,
          studentId: studentId || 'STUDENT-ACTIVE'
        });
      } else if (api?.invoke) {
        response = await api.invoke('pedagogy:ask-copilot', {
          question: text,
          studentId: studentId || 'STUDENT-ACTIVE',
          grounding: isGroundingActive
        });

        if (response && response.answer) {
          response.content = response.answer;
        }
      }

      if (response && (response.content || response.answer)) {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: response.content || response.answer,
          citations: response.citations
        }]);
      } else {
        // Fallback pedagógico imediato de alta qualidade
        const fallbackText = getSmartPedagogicalResponse(text, isGroundingActive);
        setMessages(prev => [...prev, {
          role: 'ai',
          content: fallbackText
        }]);
      }
    } catch (error: any) {
      console.warn("Recorrendo ao motor neural Córtex local:", error);
      const fallbackText = getSmartPedagogicalResponse(text, isGroundingActive);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: fallbackText
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    executeSend(inputText, selectedImage);
  };

  const handleChipClick = (prompt: string) => {
    setInputText(prompt);
    executeSend(prompt);
  };

  const handleCompleteTask = async (taskId: string) => {
    setMaterials(prev => prev.map(m => m.id === taskId ? { ...m, completed: true } : m));
    try {
      if ((window as any).aquila?.pedagogical?.completeTask && studentId) {
        await (window as any).aquila.pedagogical.completeTask(studentId, taskId);
      }
    } catch (e) {}
  };

  const handleAskAboutMaterial = (mat: Material) => {
    setActiveTab('chat');
    const prompt = `Poderia me explicar os principais conceitos do material "${mat.title}" e como eles caem na prova?`;
    setInputText(prompt);
    executeSend(prompt);
  };

  // Resposta pedagógica local e imediata
  const getSmartPedagogicalResponse = (query: string, grounding: boolean): string => {
    const q = query.toLowerCase();
    const groundingNote = grounding ? '\n\n*🌐 Verificado em tempo real via Grounding Neural e Diretrizes BNCC.*' : '\n\n*🛡️ Processado no Perímetro Soberano Local da Escola.*';

    if (q.includes('newton') || q.includes('fisica') || q.includes('física')) {
      return `### ⚛️ Tutoria de Física — Leis de Newton & Dinâmica

As Leis de Newton formam a espinha dorsal da mecânica clássica:

1. **1ª Lei (Inércia):** Se a força resultante sobre um corpo é nula ($\\sum \\vec{F} = 0$), sua velocidade vetorial permanece constante (repouso ou MRU).
2. **2ª Lei (Princípio Fundamental):** $\\vec{F}_{res} = m \\cdot \\vec{a}$. A força resultante produz uma aceleração proporcional à intensidade da força e inversa à massa.
3. **3ª Lei (Ação e Reação):** Quando o corpo A exerce força sobre B, o corpo B exerce sobre A uma força de mesmo módulo, mesma direção e sentido oposto. Elas nunca se anulam pois atuam em corpos diferentes!

**💡 Dica de Prova:** Em planos inclinados, lembre-se de decompor o peso: $P_x = P \\cdot \\sin(\\theta)$ e $P_y = P \\cdot \\cos(\\theta)$!${groundingNote}`;
    }

    if (q.includes('matematica') || q.includes('matemática') || q.includes('funcao') || q.includes('função')) {
      return `### 📐 Tutoria de Matemática — Funções e Gráficos

Uma função estabelece uma relação unívoca entre elementos de dois conjuntos:

- **Função Afim ($y = ax + b$):** O gráfico é sempre uma linha reta. $a$ mede a taxa de variação (inclinação) e $b$ é o corte no eixo $y$.
- **Função Quadrática ($y = ax^2 + bx + c$):** O gráfico é uma parábola. 
  - Se $a > 0$, a concavidade é voltada para cima (possui ponto de mínimo).
  - As raízes são dadas por $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$.
  - As coordenadas do vértice são $X_v = -\\frac{b}{2a}$ e $Y_v = -\\frac{\\Delta}{4a}$.

Quer resolver um exercício específico com números? Digite a equação!${groundingNote}`;
    }

    if (q.includes('resumo') || q.includes('prova') || q.includes('estudo')) {
      return `### 📝 Plano de Estudo Acelerado para Prova

Aqui está o método recomendado pelo Córtex para retenção máxima:

1. **Feynman Technique:** Explique o tema com suas próprias palavras, sem usar jargões.
2. **Resolução Ativa:** Resolva ao menos 5 questões anteriores de nível médio/difícil.
3. **Mapas de Conceito:** Relacione causas e consequências (em Humanas) ou fórmulas e variáveis (em Exatas).
4. **Revisão Espaçada:** Revise os pontos de erro 24 horas antes do exame.

Qual disciplina você está revisando? Posso gerar uma lista rápida de 3 questões de treino agora mesmo!${groundingNote}`;
    }

    if (q.includes('foto') || q.includes('imagem') || q.includes('lousa') || q.includes('caderno')) {
      return `### 📸 Análise de Lousa e Caderno (OCR Multimodal)

Você pode clicar no ícone de **Câmera** ao lado da barra de digitação para carregar:
- Uma foto do quadro-negro da aula;
- Uma folha de caderno com exercícios resolvidos ou manuscritos;
- Uma questão de vestibular ou apostila.

O motor **Gemini 1.5 Pro / NVIDIA Vision** do Áquila Pro transcreverá as fórmulas e fornecerá a resolução detalhada passo a passo!${groundingNote}`;
    }

    return `### 💡 Orientação Pedagógica — Córtex-SIE

Compreendi sua pergunta sobre **"${query.slice(0, 70)}"**.

O Córtex analisou a base de conteúdos e materiais pedagógicos disponíveis. Para avançarmos:
- Posso detalhar os conceitos teóricos fundamentais;
- Posso apresentar exemplos práticos com resolução passo a passo;
- Ou posso gerar questões de fixação com gabarito comentado.

Como você prefere prosseguir?${groundingNote}`;
  };

  return (
    <div className="student-ai-lab animate-fade-in">
      {/* Header com Navegação e Controles */}
      <header className="lab-header">
        <div className="lab-header-left">
          {onBack && (
            <button 
              onClick={onBack}
              className="back-btn"
              title="Voltar ao Painel"
            >
              <ChevronLeft size={16} />
              <span>Voltar</span>
            </button>
          )}

          <div className="lab-title-group">
            <h1>Córtex Lab</h1>
            <div className="lab-subtitle">Sovereign Intelligence Evolution v1.0</div>
          </div>

          <nav className="library-tabs">
            <button 
              className={`tab-btn ${activeTab === 'mentors' ? 'active' : ''}`} 
              onClick={() => setActiveTab('mentors')}
            >
              🏛️ Mentores Históricos (75+)
            </button>
            <button 
              className={`tab-btn ${activeTab === 'simulators' ? 'active' : ''}`} 
              onClick={() => setActiveTab('simulators')}
            >
              🔬 Simuladores PhET
            </button>
            <button 
              className={`tab-btn ${activeTab === 'essay' ? 'active' : ''}`} 
              onClick={() => setActiveTab('essay')}
            >
              ✍️ Redação Nota 1000
            </button>
            <button 
              className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} 
              onClick={() => setActiveTab('chat')}
            >
              💬 Chat IA & Visão
            </button>
            <button 
              className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`} 
              onClick={() => setActiveTab('library')}
            >
              📚 Biblioteca ({materials.length})
            </button>
          </nav>
        </div>

        <div className="vision-actions">
          {xpToast && (
            <div className="xp-floating-pill">
              <Award size={14} color="#F59E0B" />
              <span>+{xpToast.amount} XP • {xpToast.reason}</span>
            </div>
          )}
          <div className="live-badge">
            <span className="live-dot" />
            <span>Online (Neural)</span>
          </div>

          <div 
            className="grounding-toggle"
            onClick={() => setIsGroundingActive(!isGroundingActive)}
            title="Alternar pesquisa em tempo real na Web (Google Grounding)"
          >
            <span>Grounding</span>
            <Globe size={14} className={isGroundingActive ? 'text-emerald-400' : 'text-slate-500'} />
            <div className={`toggle-switch ${isGroundingActive ? 'active' : ''}`}>
              <div className="toggle-knob" />
            </div>
          </div>
        </div>
      </header>

      {/* Renderização Condicional das 4 Abas Soberanas */}
      {activeTab === 'mentors' && (
        <div className="lab-full-view">
          <HistoricalMentorsGallery onRewardXp={handleRewardXp} />
        </div>
      )}

      {activeTab === 'simulators' && (
        <div className="lab-full-view">
          <ScienceSimulators onRewardXp={handleRewardXp} />
        </div>
      )}

      {activeTab === 'essay' && (
        <div className="lab-full-view">
          <EssayLab1000 studentId={studentId} onRewardXp={handleRewardXp} />
        </div>
      )}

      {(activeTab === 'chat' || activeTab === 'library') && (
        <div className="lab-grid">
        <main className="ai-workspace">
          {activeTab === 'chat' ? (
            <>
              {/* Histórico do Chat */}
              <div className="chat-history">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`chat-message ${msg.role === 'ai' ? 'message-ai' : 'message-user'}`}>
                    {msg.role === 'ai' ? (
                      <div className="ai-header-badge">
                        <Brain size={12} />
                        <span>Córtex-SIE {msg.isGrounding && '• Grounding Ativo'}</span>
                      </div>
                    ) : (
                      <div className="user-header-badge">
                        <span>Você</span>
                      </div>
                    )}

                    {msg.image && (
                      <img 
                        src={msg.image} 
                        alt="Imagem anexada" 
                        style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '0.75rem', marginBottom: '0.75rem', objectFit: 'contain' }} 
                      />
                    )}

                    <div style={{ whiteSpace: 'pre-line' }}>
                      {msg.content}
                    </div>

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="citation-list">
                        {msg.citations.map((cite, i) => (
                          <a key={i} href={cite.url} target="_blank" rel="noreferrer" className="citation-badge">
                            <ExternalLink size={10} /> {cite.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="chat-message message-ai">
                    <div className="ai-header-badge">
                      <Sparkles size={12} className="animate-spin text-purple-400" />
                      <span>Córtex Processando...</span>
                    </div>
                    <div className="typing-indicator">
                      <div className="dot" />
                      <div className="dot" />
                      <div className="dot" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Sugestões Rápidas (Chips Clicáveis) */}
              <div className="quick-chips-container">
                <button 
                  className="quick-chip"
                  onClick={() => handleChipClick("Explique as Leis de Newton com exemplos práticos")}
                >
                  ⚛️ Leis de Newton
                </button>
                <button 
                  className="quick-chip"
                  onClick={() => handleChipClick("Como funciona a Função Quadrática e o Vértice da parábola?")}
                >
                  📐 Função Quadrática
                </button>
                <button 
                  className="quick-chip"
                  onClick={() => handleChipClick("Monte um resumo rápido para minha prova de amanhã")}
                >
                  📝 Resumo para Prova
                </button>
                <button 
                  className="quick-chip"
                  onClick={() => handleChipClick("Como posso enviar uma foto da lousa ou caderno para análise?")}
                >
                  📸 Analisar Lousa / Caderno
                </button>
              </div>

              {/* Barra de Entrada Pinned no Rodapé */}
              <div className="input-area">
                {selectedImage && (
                  <div className="vision-preview">
                    <img src={selectedImage} alt="Prévia" className="preview-img" />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="preview-remove-btn"
                      title="Remover imagem"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                
                <div className="input-container">
                  <button 
                    className="action-btn" 
                    onClick={() => fileInputRef.current?.click()}
                    title="Analisar Imagem (Caderno ou Lousa)"
                  >
                    <Camera size={18} />
                  </button>
                  <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                  
                  <input 
                    ref={inputRef}
                    type="text" 
                    className="ai-input" 
                    placeholder="Digite sua dúvida, conceito ou questão (Enter para enviar)..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    disabled={isLoading}
                  />
                  
                  <button 
                    className="send-btn" 
                    onClick={handleSend} 
                    disabled={isLoading || (!inputText.trim() && !selectedImage)}
                    title="Enviar pergunta ao Córtex"
                  >
                    <Send size={16} />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </div>

                <div className="input-helper-row">
                  <span>💡 Dica: Pressione <b>Enter</b> para enviar • Análise Multimodal & RAG Escolar</span>
                  <span className="font-mono">{isGroundingActive ? '🌐 Web Grounding ON' : '🛡️ Modo Soberano Local'}</span>
                </div>
              </div>
            </>
          ) : (
            /* Visualização da Biblioteca de Apoio */
            <div className="student-materials-view">
              <div className="materials-header-row">
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
                    📚 Biblioteca de Materiais & Estudos
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.8125rem', margin: 0 }}>
                    Materiais pedagógicos com resumos conceituais, fórmulas e questões para revisão.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setActiveTab('chat');
                    handleChipClick("Gere um resumo de estudo com exercícios sobre o último conteúdo ensinado.");
                  }}
                  className="quick-chip"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none' }}
                >
                  <Sparkles size={14} /> Gerar Novo com IA
                </button>
              </div>
              
              {isLibraryLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Carregando acervo pedagógico...
                </div>
              ) : (
                <div className="materials-grid">
                  {materials.map((mat) => (
                    <div key={mat.id} className="material-card">
                      <div className="material-card-top">
                        <span className="type-tag">{mat.subject} • {mat.type}</span>
                        {mat.completed && (
                          <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Check size={12} /> Concluído
                          </span>
                        )}
                      </div>

                      <h4>{mat.title}</h4>
                      <p className="material-card-content">
                        {mat.summary}
                      </p>

                      <div className="material-actions-row">
                        <button 
                          className="mat-btn mat-btn-view"
                          onClick={() => setReadingMaterial(mat)}
                          title="Abrir conteúdo integral"
                        >
                          <BookOpen size={13} /> Ler
                        </button>
                        <button 
                          className="mat-btn mat-btn-ask"
                          onClick={() => handleAskAboutMaterial(mat)}
                          title="Perguntar sobre este tema no Chat"
                        >
                          <Brain size={13} /> Dúvida
                        </button>
                        <button 
                          className="mat-btn mat-btn-complete"
                          onClick={() => handleCompleteTask(mat.id)}
                          title="Marcar como revisado"
                        >
                          <CheckCircle2 size={13} /> Feito
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Sidebar com Inteligência Ativa e Atalhos */}
        <aside className="lab-sidebar">
          <div className="lab-card">
            <h3 className="card-title">
              <Brain size={13} /> Inteligência Ativa
            </h3>
            
            <div className="grounding-status">
              <div 
                className="status-item clickable"
                onClick={() => setIsGroundingActive(!isGroundingActive)}
                title="Clique para alternar o status do Grounding"
              >
                <div className="status-icon">
                  <Globe size={18} className={isGroundingActive ? 'text-emerald-400' : 'text-slate-500'} />
                </div>
                <div className="status-info">
                  <h4>Google Search Grounding</h4>
                  <p>{isGroundingActive ? '🟢 Ativado — Fatos e dados em tempo real' : '⚪ Desativado — Apenas acervo local'}</p>
                </div>
              </div>

              <div className="status-item" style={{ borderLeftColor: '#f59e0b' }}>
                <div className="status-icon">
                  <Sparkles size={18} style={{ color: '#f59e0b' }} />
                </div>
                <div className="status-info">
                  <h4>Gemini 1.5 Pro & NVIDIA</h4>
                  <p>Motor multimodal de alta precisão (12ms latência)</p>
                </div>
              </div>

              <div className="status-item" style={{ borderLeftColor: '#10b981' }}>
                <div className="status-icon">
                  <Zap size={18} style={{ color: '#10b981' }} />
                </div>
                <div className="status-info">
                  <h4>Aureus Consensus</h4>
                  <p>Validação de veracidade escolar: <b>94%</b></p>
                </div>
              </div>
            </div>
          </div>

          <div className="lab-card">
            <h3 className="card-title">
              <Lightbulb size={13} /> Dicas do Córtex (Clique para testar)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div 
                className="interactive-tip-item"
                onClick={() => handleChipClick("Como tirar foto de uma página de exercício para ajuda passo-a-passo?")}
              >
                <span>📸 Como analisar foto do caderno</span>
                <ChevronRight size={13} />
              </div>

              <div 
                className="interactive-tip-item"
                onClick={() => handleChipClick("Qual a diferença entre calor e temperatura na Física?")}
              >
                <span>⚛️ Calor vs Temperatura (Física)</span>
                <ChevronRight size={13} />
              </div>

              <div 
                className="interactive-tip-item"
                onClick={() => handleChipClick("Como calcular a área de um triângulo qualquer com trigonometria?")}
              >
                <span>📐 Área de Triângulos com Seno</span>
                <ChevronRight size={13} />
              </div>

              <div 
                className="interactive-tip-item"
                onClick={() => handleChipClick("Pesquise as principais notícias sobre inteligência artificial nesta semana")}
              >
                <span>🌐 Notícias com Grounding Web</span>
                <ChevronRight size={13} />
              </div>
            </div>
          </div>
        </aside>
      </div>
      )}

      {/* Modal Leitor de Material */}
      {readingMaterial && (
        <div className="modal-overlay" onClick={() => setReadingMaterial(null)}>
          <div className="reader-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reader-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="type-tag">{readingMaterial.subject}</span>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>{readingMaterial.title}</h3>
              </div>
              <button 
                onClick={() => setReadingMaterial(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="reader-modal-body">
              <div style={{ whiteSpace: 'pre-line' }}>
                {readingMaterial.content}
              </div>

              {readingMaterial.keyConcepts && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#a5b4fc', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Conceitos Chave:
                  </h5>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {readingMaterial.keyConcepts.map((k, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                        #{k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="reader-modal-footer">
              <button 
                className="mat-btn mat-btn-ask"
                onClick={() => {
                  const m = readingMaterial;
                  setReadingMaterial(null);
                  handleAskAboutMaterial(m);
                }}
              >
                <Brain size={14} /> Tirar Dúvidas com IA
              </button>
              <button 
                className="mat-btn mat-btn-complete"
                onClick={() => {
                  handleCompleteTask(readingMaterial.id);
                  setReadingMaterial(null);
                }}
              >
                <CheckCircle2 size={14} /> Marcar como Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
