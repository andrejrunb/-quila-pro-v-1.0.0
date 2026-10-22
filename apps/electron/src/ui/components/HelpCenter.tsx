import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, FileText, Video, MessageCircle, ExternalLink, 
  ShieldAlert, X, Play, Pause, ChevronLeft, ChevronRight, BookOpen, Volume2
} from 'lucide-react';
import './HelpCenter.css';

/**
 * Phase 401+: Help & Tutorial Center
 * Centro de suporte impecável para exportação global e facilidade de instalação.
 */
export const HelpCenter: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState(35); // simulated percent
  
  const [activeDoc, setActiveDoc] = useState<{ title: string; pages: number } | null>(null);
  const [currentPageNum, setCurrentPageNum] = useState(1);

  const [activeSop, setActiveSop] = useState<{ title: string; emoji: string; desc: string; steps: string[] } | null>(null);

  const tutorials = [
    { title: 'Configuração das Câmeras', type: 'video', duration: '3:45' },
    { title: 'Gestão da Base de Alunos', type: 'doc', pages: 12 },
    { title: 'Entendendo os Alertas de Segurança', type: 'video', duration: '5:20' },
    { title: 'Como convidar os Pais (App)', type: 'doc', pages: 8 },
  ];

  const DOC_CONTENT: Record<string, string[]> = {
    'Gestão da Base de Alunos': [
      'Página 1: Introdução ao Cadastro de Alunos - O Áquila Pro utiliza inteligência artificial e biometria facial para gerenciar a segurança e presença dos alunos.',
      'Página 2: Cadastrando um Aluno - Acesse o menu lateral "Alunos", clique em "Adicionar Aluno". Insira o nome completo, matrícula e dados do responsável.',
      'Página 3: Importação de Planilhas - Caso queira importar alunos em lote, utilize uma planilha Excel com as colunas Nome, Matrícula, Turma e Telefone.',
      'Página 4: Captura de Biometria - A biometria facial requer fotos nítidas do aluno. Recomendamos pelo menos 3 ângulos diferentes para maior precisão.',
      'Página 5: Uso de Câmeras IP - O sistema reconhece os alunos automaticamente a partir de fluxos RTSP de alta definição instalados na escola.',
      'Página 6: Frequência Inteligente - A chamada é preenchida automaticamente de acordo com as detecções das câmeras da sala durante os horários das aulas.',
      'Página 7: Relatório de Frequência - Os dados coletados geram relatórios consolidados que podem ser exportados nos formatos PDF e Excel para a secretaria.',
      'Página 8: Auditoria de Detecções - Em caso de dúvidas, a secretaria pode visualizar os logs de imagem das detecções para auditar a chamada.',
      'Página 9: Tratamento de Evasão - Alunos com risco de evasão são sinalizados por algoritmos preditivos após 3 faltas consecutivas.',
      'Página 10: Retenção de Dados - Respeitando a LGPD, fotos e biometrias brutas são armazenadas localmente de forma criptografada (AES-256).',
      'Página 11: Termo de Consentimento - A escola deve obter a assinatura do termo de consentimento dos pais antes de ativar a biometria facial.',
      'Página 12: Suporte - Se encontrar qualquer instabilidade no banco de dados, abra um chamado diretamente pelo Suporte Áquila.'
    ],
    'Como convidar os Pais (App)': [
      'Página 1: Conectando a Família - O aplicativo dos pais permite acompanhar a entrada, saída, presença e alertas de segurança do aluno em tempo real.',
      'Página 2: Geração de Chaves - No menu do aluno, clique em "Gerar Convite". O sistema gerará um código único de 6 dígitos.',
      'Página 3: Envio Automático via WhatsApp - Se o WhatsApp estiver integrado, você pode disparar o link de convite e o código diretamente para o celular do responsável.',
      'Página 4: Download do App - O pai deve baixar o aplicativo "Áquila Pais" na Google Play Store ou App Store.',
      'Página 5: Ativação - Ao abrir o aplicativo, o responsável insere o código do convite e confirma os dados do aluno para ativar a sincronia segura.',
      'Página 6: Notificações em Tempo Real - Os pais receberão notificações na bandeja do celular toda vez que o aluno passar pela portaria ou sala de aula.',
      'Página 7: Justificativa de Faltas - Pelo aplicativo, os pais podem enviar justificativas de faltas (como atestados médicos) diretamente para a coordenação.',
      'Página 8: Segurança de Dados - Toda a comunicação entre o aplicativo dos pais e o servidor local da escola utiliza criptografia de ponta a ponta.'
    ]
  };

  const handleOpenVideo = (title: string) => {
    setActiveVideo(title);
    setVideoPlaying(true);
    setVideoLoading(true);
    setVideoProgress(15);
  };

  const handleOpenDoc = (title: string, pages: number) => {
    setActiveDoc({ title, pages });
    setCurrentPageNum(1);
  };

  const handleOpenSop = (title: string, emoji: string, desc: string, steps: string[]) => {
    setActiveSop({ title, emoji, desc, steps });
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeVideo && videoPlaying) {
      if (videoLoading) {
        timer = setTimeout(() => setVideoLoading(false), 1200);
      } else {
        timer = setInterval(() => {
          setVideoProgress(p => (p >= 100 ? 0 : p + 1));
        }, 1500);
      }
    }
    return () => {
      clearTimeout(timer);
      clearInterval(timer);
    };
  }, [activeVideo, videoPlaying, videoLoading]);

  return (
    <div className="help-center-container">
      {/* Estilos locais para Modais Premium */}
      <style>{`
        .tutorial-item.interactive {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tutorial-item.interactive:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.2);
          transform: translateY(-1px);
        }
        .help-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(2, 6, 23, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: helpFadeIn 0.25s ease-out;
        }
        @keyframes helpFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .help-modal-content {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border-radius: 24px;
          width: 90%;
          max-width: 700px;
          overflow: hidden;
          position: relative;
        }
        .help-modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(30, 41, 59, 0.2);
        }
        .help-modal-close {
          color: rgba(255, 255, 255, 0.4);
          transition: color 0.2s;
        }
        .help-modal-close:hover {
          color: #ef4444;
        }
        /* Video Simulation Styles */
        .video-viewport-sim {
          aspect-ratio: 16/9;
          background: #000;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .video-scanline {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          background-size: 100% 4px, 6px 100%;
          pointer-events: none;
          z-index: 10;
        }
        .video-loading-sim {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .video-loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: helpSpin 1s linear infinite;
        }
        @keyframes helpSpin {
          to { transform: rotate(360deg); }
        }
        .video-simulation-view {
          width: 100%;
          height: 100%;
          padding: 1.5rem;
          box-sizing: border-box;
          font-family: monospace;
          font-size: 11px;
          color: #3b82f6;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: radial-gradient(circle at center, #020617 0%, #000 100%);
        }
        .video-controls-bar {
          background: rgba(15, 23, 42, 0.9);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .video-progress-container {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          position: relative;
          cursor: pointer;
        }
        .video-progress-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 2px;
        }
        /* Document Reader Styles */
        .doc-reader-body {
          padding: 2.5rem;
          min-height: 250px;
          background: #0f172a;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .doc-reader-text {
          font-size: 14px;
          line-height: 1.6;
          max-width: 500px;
          margin: 0 auto;
        }
        .doc-reader-footer {
          padding: 1rem 1.5rem;
          background: rgba(30, 41, 59, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .doc-nav-btn {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 11px;
          font-weight: bold;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .doc-nav-btn:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.3);
        }
        .doc-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        /* SOP Styles */
        .sop-body {
          padding: 2rem;
          background: #0f172a;
        }
        .sop-step-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          margin-bottom: 0.75rem;
        }
        .sop-step-number {
          width: 24px;
          height: 24px;
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 11px;
          flex-shrink: 0;
        }
      `}</style>

      <header className="flex items-center gap-3 mb-6">
        <HelpCircle className="text-blue-400" size={24} />
        <h2 className="text-xl font-bold uppercase tracking-widest text-slate-200">Central de Ajuda Áquila</h2>
      </header>

      <div className="help-grid">
        {/* Vídeos */}
        <div className="support-card principal">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Video size={16} /> TUTORIAIS EM VÍDEO
          </h3>
          <div className="space-y-3">
            {tutorials.filter(t => t.type === 'video').map((t, i) => (
              <div 
                key={i} 
                className="tutorial-item interactive group" 
                onClick={() => handleOpenVideo(t.title)}
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded flex items-center justify-center group-hover:bg-blue-500/40 transition-colors">
                  <Video size={14} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-xs font-bold">{t.title}</div>
                  <div className="text-[10px] text-slate-500">Duração: {t.duration}</div>
                </div>
                <ExternalLink size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Documentos */}
        <div className="support-card">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <FileText size={16} /> MANUAIS DE USO
          </h3>
          <div className="space-y-3">
            {tutorials.filter(t => t.type === 'doc').map((t, i) => (
              <div 
                key={i} 
                className="tutorial-item interactive group"
                onClick={() => handleOpenDoc(t.title, t.pages || 1)}
              >
                <div className="w-10 h-10 bg-slate-500/10 rounded flex items-center justify-center group-hover:bg-slate-500/20 transition-colors">
                  <FileText size={14} className="text-slate-400" />
                </div>
                <div>
                  <div className="text-xs font-bold">{t.title}</div>
                  <div className="text-[10px] text-slate-500">Formato: PDF ({t.pages} pág.)</div>
                </div>
                <BookOpen size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Protocolos SOP */}
        <div className="support-card border-amber-500/20 bg-amber-500/5 col-span-full">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-amber-400">
            <ShieldAlert size={16} /> PROTOCOLOS DE SEGURANÇA ESCOLAR
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="sop-card">
              <div className="text-[11px] font-bold text-amber-200">🔒 Protocolo de Invasão</div>
              <p className="text-[10px] text-slate-500 mt-1">Procedimentos de lockdown e alerta silencioso via Áquila.</p>
              <button 
                className="mt-2 text-[9px] font-bold text-amber-500 hover:underline"
                onClick={() => handleOpenSop(
                  'Protocolo de Invasão', '🔒', 
                  'Procedimentos imediatos para contenção de incidentes de intrusão e garantia física dos alunos.',
                  [
                    'Pressione o botão de Pânico no cockpit principal do Áquila Pro.',
                    'O sistema enviará um Alerta Silencioso (Silent Alarm) direto às forças de segurança.',
                    'Os portões IoT compatíveis serão travados no modo de confinamento automático.',
                    'Professores receberão orientações via notificação do celular para trancarem salas.'
                  ]
                )}
              >
                VER GUIA RÁPIDO
              </button>
            </div>
            <div className="sop-card">
              <div className="text-[11px] font-bold text-amber-200">🔥 Evasão em Incêndio</div>
              <p className="text-[10px] text-slate-500 mt-1">Rotas de fuga dinâmicas e contagem de cabeças em tempo real.</p>
              <button 
                className="mt-2 text-[9px] font-bold text-amber-500 hover:underline"
                onClick={() => handleOpenSop(
                  'Evasão em Incêndio', '🔥', 
                  'Procedimentos ordenados para evacuação segura e rápida das salas de aula.',
                  [
                    'Liberação imediata de todas as portas eletrônicas no protocolo Fail-Safe.',
                    'Exibição do mapa tridimensional com as rotas de fuga ativas em todos os monitores.',
                    'Direcionamento dos alunos aos pontos de encontro fora do prédio.',
                    'Contagem automática de pessoas via Inteligência Artificial nas câmeras externas.'
                  ]
                )}
              >
                VER MAPA DE FUGA
              </button>
            </div>
            <div className="sop-card">
              <div className="text-[11px] font-bold text-amber-200">🚑 Emergência de Saúde</div>
              <p className="text-[10px] text-slate-500 mt-1">Acionamento de socorro e histórico médico do aluno via QR Code.</p>
              <button 
                className="mt-2 text-[9px] font-bold text-amber-500 hover:underline"
                onClick={() => handleOpenSop(
                  'Emergência de Saúde', '🚑', 
                  'Atendimento prioritário em casos de indisposição física ou incidentes com alunos.',
                  [
                    'Pesquise pelo aluno ou utilize a câmera de reconhecimento na enfermaria.',
                    'Abra a ficha médica criptografada do estudante (alergias e dados sanguíneos).',
                    'Acione os serviços médicos locais integrados ao sistema.',
                    'Envie um aviso imediato com relatórios para os celulares dos responsáveis.'
                  ]
                )}
              >
                VER FLUXO MÉDICO
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Simulated Video Player */}
      {activeVideo && (
        <div className="help-modal-overlay" onClick={() => setActiveVideo(null)}>
          <div className="help-modal-content" onClick={e => e.stopPropagation()}>
            <header className="help-modal-header">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-blue-400" />
                <span className="font-bold text-sm text-slate-200">{activeVideo}</span>
              </div>
              <button className="help-modal-close" onClick={() => setActiveVideo(null)}><X size={18} /></button>
            </header>
            
            <div className="video-viewport-sim">
              <div className="video-scanline"></div>
              {videoLoading ? (
                <div className="video-loading-sim">
                  <div className="video-loading-spinner"></div>
                  <span className="text-xs font-bold tracking-widest uppercase">Conectando ao Feed Áquila...</span>
                </div>
              ) : (
                <div className="video-simulation-view animate-fade-in">
                  <div>
                    <div className="text-emerald-400 font-bold">[FEED OK] CONNECTED TO CORE CAMERA STREAM</div>
                    <div className="text-slate-400 mt-2">STREAM: rtsp://192.168.10.150:554/ch01_live</div>
                    <div className="text-slate-500">RESOLUTION: 1920x1080 @ 30 FPS</div>
                    <div className="text-slate-500">ACCELERATION: NPU 26 TOPS - ACTIVE</div>
                  </div>
                  <div style={{ border: '1px dashed #3b82f6', padding: '15px', borderRadius: '8px', background: 'rgba(59,130,246,0.05)' }}>
                    <div className="text-white font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      PROCESSANDO RECONHECIMENTO FACIAL
                    </div>
                    <div className="text-slate-400 mt-1">Liveness Check: 98% (REAL_IMAGE)</div>
                    <div className="text-slate-400">Match Database: Aluno ID 'STU-482' - 97.4% de confiança</div>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>STATUS: TUTORIAL PLAYING</span>
                    <span>© 2026 EAGLE AI</span>
                  </div>
                </div>
              )}
            </div>

            <div className="video-controls-bar">
              <button 
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white"
                onClick={() => setVideoPlaying(!videoPlaying)}
              >
                {videoPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <div className="video-progress-container">
                <div className="video-progress-fill" style={{ width: `${videoProgress}%` }}></div>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                <span>{videoPlaying && !videoLoading ? `01:${Math.floor(videoProgress * 0.6).toString().padStart(2, '0')}` : '00:00'}</span>
                <Volume2 size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Document Reader */}
      {activeDoc && (
        <div className="help-modal-overlay" onClick={() => setActiveDoc(null)}>
          <div className="help-modal-content" onClick={e => e.stopPropagation()}>
            <header className="help-modal-header">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                <span className="font-bold text-sm text-slate-200">{activeDoc.title}</span>
              </div>
              <button className="help-modal-close" onClick={() => setActiveDoc(null)}><X size={18} /></button>
            </header>

            <div className="doc-reader-body">
              <div className="doc-reader-text animate-fade-in">
                <p className="text-white font-bold mb-4">{activeDoc.title}</p>
                <p>{DOC_CONTENT[activeDoc.title]?.[currentPageNum - 1] || 'Fim do documento.'}</p>
              </div>
            </div>

            <div className="doc-reader-footer">
              <button 
                className="doc-nav-btn" 
                onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
                disabled={currentPageNum === 1}
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <span className="text-xs font-bold text-slate-500">Pág. {currentPageNum} de {activeDoc.pages}</span>
              <button 
                className="doc-nav-btn" 
                onClick={() => setCurrentPageNum(p => Math.min(activeDoc.pages, p + 1))}
                disabled={currentPageNum === activeDoc.pages}
              >
                Próxima <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SOP Protocol Guide */}
      {activeSop && (
        <div className="help-modal-overlay" onClick={() => setActiveSop(null)}>
          <div className="help-modal-content" onClick={e => e.stopPropagation()}>
            <header className="help-modal-header">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-500" />
                <span className="font-bold text-sm text-slate-200">{activeSop.title}</span>
              </div>
              <button className="help-modal-close" onClick={() => setActiveSop(null)}><X size={18} /></button>
            </header>

            <div className="sop-body">
              <div className="flex gap-4 items-center mb-6 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <span className="text-3xl">{activeSop.emoji}</span>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">{activeSop.desc}</p>
              </div>
              
              <div className="space-y-3">
                {activeSop.steps.map((step, idx) => (
                  <div key={idx} className="sop-step-item">
                    <div className="sop-step-number">{idx + 1}</div>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 pt-4 border-t border-white/5 text-center">
        <div className="text-[9px] text-slate-600 uppercase tracking-widest">
          Áquila Pro Help v.1.5.0 // Desenvolvido para Escolas do Brasil
        </div>
      </footer>
    </div>
  );
};

export default HelpCenter;
