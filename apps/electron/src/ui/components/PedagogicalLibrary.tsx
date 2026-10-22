import React, { useState, useEffect } from 'react';
import { 
  Library, 
  Upload, 
  FileText, 
  Search, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  BookOpen,
  Zap,
  LayoutGrid,
  SearchCode,
  HelpCircle
} from 'lucide-react';
import './PedagogicalLibrary.css';
import HelpRequestModal from './HelpRequestModal';

interface Material {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'audio' | 'text' | 'enriched_content';
  createdAt: string;
  summary: string;
  flashcards: string[];
  youtubeLinks?: string[];
  youtubeSummaries?: { title: string, url: string, summary: string }[];
  studentId?: string;
  isCorporate?: boolean;
  originInstitution?: string;
  isFavorite?: boolean;
  collectionId?: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
}

interface Student {
  id: string;
  name: string;
  observationLevel: number;
  frustrationScore: number;
}

const PedagogicalLibrary: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [studentsAtRisk, setStudentsAtRisk] = useState<Student[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'monitoring' | 'feed'>('materials');
  const [selectedClass, setSelectedClass] = useState<string>('T01');
  const [generateOptions, setGenerateOptions] = useState<string[]>(['summary', 'flashcards', 'questions']);
  const [brainResponse, setBrainResponse] = useState<string | null>(null);
  const [feedText, setFeedText] = useState('');
  const [searchScope, setSearchScope] = useState<'local' | 'swarm'>('local');
  const [swarmResults, setSwarmResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const loadData = async () => {
    try {
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (selectedCollection !== 'all') filters.collectionId = selectedCollection;
      if (showOnlyFavorites) filters.isFavorite = true;

      const mats = await window.aquila.pedagogical.browseLibrary(filters);
      setMaterials(mats || []);

      const colls = await window.aquila.pedagogical.getCollections();
      setCollections(colls || []);

      const students = await window.aquila.getStudents();
      const atRisk = students.filter((s: any) => s.observationLevel > 0 || s.frustrationScore > 0);
      setStudentsAtRisk(atRisk);
      
      // Carregar cache do enxame se estiver no escopo swarm
      if (searchScope === 'swarm') {
        const cache = await window.aquila.pedagogical.getSwarmCache();
        setSwarmResults(cache || []);
      }
    } catch (err) {
      console.error('Falha ao carregar dados pedagógicos:', err);
    }
  };

  useEffect(() => {
    loadData();
    
    // Escutar por atualizações de reputação
    const unsubRep = window.aquila.events.on('reputation_update', (data: any) => {
      setSwarmResults(prev => prev.map(item => 
        item.id === data.resourceId ? { ...item, reputationScore: (item.reputationScore || 0) + 1 } : item
      ));
    });

    return () => {
      unsubRep();
    };
  }, [searchScope, selectedCollection, showOnlyFavorites]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(`Gerando ${generateOptions.length} artefatos para a turma ${selectedClass}...`);

    try {
      const res = await window.aquila.pedagogical.uploadFile({
        filePath: file.path,
        classId: selectedClass,
        options: generateOptions
      });
      
      if (res.error) {
        setUploadStatus(`Erro: ${res.error}`);
      } else {
        setUploadStatus('Processamento concluído com sucesso!');
        loadData();
      }
    } catch (err) {
      setUploadStatus('Erro fatal no processamento.');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadStatus(null);
      }, 3000);
    }
  };

  const handleTextFeed = async () => {
    if (!feedText.trim()) return;
    setIsUploading(true);
    setUploadStatus('Enriquecendo biblioteca com I.A e Curadoria de Vídeo...');
    try {
      // Usando o mesmo endpoint de upload mas enviando texto
      const res = await window.aquila.pedagogical.uploadFile({
        content: feedText,
        classId: selectedClass,
        options: [...generateOptions, 'youtube_links']
      });
      
      if (res.success) {
        setFeedText('');
        setUploadStatus('Conhecimento processado e vídeos sugeridos!');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadStatus(null);
      }, 2000);
    }
  };

  const handleConsultBrain = async () => {
    setIsUploading(true);
    setUploadStatus('Consultando Cérebro do Projeto...');
    try {
      const response = await window.aquila.notebook.ask("Como podemos melhorar o engajamento desta turma hoje?");
      setBrainResponse(response);
    } catch (err) {
      setBrainResponse('Cérebro offline no momento. Tente novamente mais tarde.');
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
    }
  };

  const handleIntervention = async (studentId: string) => {
    const reason = window.prompt("Descreva a intervenção pedagógica realizada para descartar este risco:");
    if (!reason) return;

    setIsUploading(true);
    setUploadStatus('Registrando intervenção e auditando...');
    try {
      await window.aquila.pedagogical.dismissRisk(studentId, 'pedagogical_intervention', reason);
      loadData();
    } catch (err) {
      console.error('Falha ao registrar intervenção:', err);
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
    }
  };

  const handleSwarmSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsUploading(true);
    setUploadStatus('Consultando enxame Áquila via P2P...');
    try {
      await window.aquila.pedagogical.querySwarm(searchQuery);
      // A busca no enxame é assíncrona, mas o cache deve atualizar via evento
      // ou podemos forçar uma recarga após um delay
      setTimeout(loadData, 2000);
    } catch (err) {
      console.error('Erro na busca enxame:', err);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadStatus(null);
      }, 1500);
    }
  };

  const handleVouch = async (id: string) => {
    try {
      await window.aquila.pedagogical.vouchForResource(id);
      setUploadStatus('Reputação enviada ao enxame!');
      setTimeout(() => setUploadStatus(null), 2000);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImport = async (item: any) => {
    setIsUploading(true);
    setUploadStatus('Importando material para biblioteca local...');
    try {
      // Simulação de importação local (criação de registro local)
      await window.aquila.pedagogical.uploadFile({
        content: `IMPORTADO DO ENXAME: ${item.excerpt}`,
        classId: selectedClass,
        options: ['summary']
      });
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await window.aquila.pedagogical.toggleFavorite(id);
      loadData();
    } catch (err) {
      console.error('Erro ao favoritar:', err);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      await window.aquila.pedagogical.createCollection(newCollectionName);
      setNewCollectionName('');
      loadData();
    } catch (err) {
      console.error('Erro ao criar coleção:', err);
    }
  };

  const handleAssignToCollection = async (resourceId: string, collectionId: string) => {
    try {
      await window.aquila.pedagogical.assignToCollection(resourceId, collectionId);
      loadData();
    } catch (err) {
      console.error('Erro ao atribuir coleção:', err);
    }
  };

  return (
    <div className="pedagogical-library-modal">
      <header className="pl-header">
        <div className="pl-title">
          <div className="pl-eagle-badge">Córtex v1.5</div>
          <h2>Inteligência Pedagógica Soberana</h2>
        </div>
        <div className="pl-tabs">
          <button 
            className={`td-action-btn ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            <BookOpen size={16} /> Biblioteca
          </button>
          <button 
            className={`td-action-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <UserPlus size={16} /> Alimentar
          </button>
          <button 
            className={`td-action-btn ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoring')}
          >
            <LayoutGrid size={16} /> Monitoramento
          </button>
        </div>
      </header>

      <div className="pl-content">
        <aside className="pl-sidebar">
          <div className="pl-section">
            <div className="pl-section-title">Contexto & Destino</div>
            <select 
              className="pl-select" 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              title="Selecionar turma de destino"
              aria-label="Selecionar turma de destino"
            >
              <option value="T01">Turma 01 - Matriz</option>
              <option value="T02">Turma 02 - Alpha</option>
              <option value="T03">Turma 03 - Beta</option>
            </select>
          </div>

          <div className="pl-section">
            <div className="pl-section-title">Coleções</div>
            <select 
              className="pl-select" 
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
            >
              <option value="all">Todas as Coleções</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="pl-new-col-row" style={{display: 'flex', gap: '5px', marginTop: '10px'}}>
              <input 
                type="text" 
                className="pl-input-mini" 
                placeholder="Nova coleção..." 
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
              <button className="pl-btn-mini" onClick={handleCreateCollection}>+</button>
            </div>
          </div>

          <div className="pl-section">
            <div className="pl-section-title">Filtros Avançados</div>
            <label className="pl-option-item">
              <input 
                type="checkbox" 
                checked={showOnlyFavorites}
                onChange={(e) => setShowOnlyFavorites(e.target.checked)}
              />
              <span>Apenas Favoritos</span>
            </label>
          </div>

          <div className="pl-section">
            <div className="pl-section-title">Opções de Geração</div>
            <div className="pl-options-grid">
              {['summary', 'flashcards', 'questions', 'exercise_list', 'form'].map(opt => (
                <label key={opt} className="pl-option-item">
                  <input 
                    type="checkbox" 
                    checked={generateOptions.includes(opt)}
                    onChange={(e) => {
                      if (e.target.checked) setGenerateOptions([...generateOptions, opt]);
                      else setGenerateOptions(generateOptions.filter(o => o !== opt));
                    }}
                  />
                  <span>{opt === 'summary' ? 'Resumo' : 
                         opt === 'flashcards' ? 'Flashcards' : 
                         opt === 'questions' ? 'Questões' : 
                         opt === 'exercise_list' ? 'Lista de Ex.' : 'Formulário'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pl-section">
            <div className="pl-section-title">Upload de Conhecimento</div>
            <label className="pl-upload-card">
              <input type="file" hidden onChange={handleFileUpload} accept=".pdf,image/*,audio/*" />
              <div className="pl-upload-icon"><Upload /></div>
              <div className="pl-upload-text">
                <strong>Subir Material</strong>
                <p>PDF, Fotos da Lousa ou Áudios</p>
              </div>
            </label>
          </div>

          <button className="pl-brain-btn" onClick={handleConsultBrain}>
            <Zap size={16} /> Consultar Cérebro Soberano
          </button>

          <div className="pl-section">
            <div className="pl-section-title">Resumo da Inteligência</div>
            <div className="td-stat-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
              <div className="td-stat-box">
                <div className="td-stat-val" style={{fontSize: '18px'}}>{materials.length}</div>
                <div className="td-stat-label">Materiais</div>
              </div>
              <div className="td-stat-box">
                <div className="td-stat-val" style={{fontSize: '18px', color: 'var(--timer-urgent)'}}>{studentsAtRisk.length}</div>
                <div className="td-stat-label">Em Risco</div>
              </div>
            </div>
          </div>

          <div className="pl-section" style={{marginTop: 'auto'}}>
            <div className="pl-risk-alert">
              <div className="pl-risk-icon">🛡️</div>
              <div style={{fontSize: '11px'}}>
                Processamento 100% Local. <br/>Soberania de dados garantida.
              </div>
            </div>
          </div>
        </aside>

        <main className="pl-main-view">
          {activeTab === 'materials' && (
            <>
              <div className="pl-section-header">
                <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                  <h3>{searchScope === 'local' ? 'Biblioteca Local' : 'Enxame Áquila (Swarm)'}</h3>
                  <div className="pl-scope-toggle">
                    <button 
                      className={searchScope === 'local' ? 'active' : ''} 
                      onClick={() => setSearchScope('local')}
                    >
                      Local
                    </button>
                    <button 
                      className={searchScope === 'swarm' ? 'active' : ''} 
                      onClick={() => setSearchScope('swarm')}
                    >
                      Enxame (P2P)
                    </button>
                  </div>
                </div>
                <div className="pl-search">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder={searchScope === 'local' ? "Buscar localmente..." : "Pesquisar no enxame..."} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (searchScope === 'local' ? null : handleSwarmSearch())}
                  />
                  {searchScope === 'swarm' && <button className="pl-search-btn" onClick={handleSwarmSearch}>Buscar</button>}
                  <button 
                    className="pl-help-request-btn"
                    onClick={() => setShowHelpModal(true)}
                    title="Pedir Ajuda ao Enxame"
                  >
                    <HelpCircle size={16} />
                  </button>
                </div>
              </div>

              {searchScope === 'local' ? (
                <div className="pl-grid">
                  {materials.map(mat => (
                    <div key={mat.id} className="pl-material-card">
                      <span className={`pl-card-tag tag-${mat.type}`}>{mat.type}</span>
                      <button 
                        className={`pl-fav-btn ${mat.isFavorite ? 'active' : ''}`}
                        onClick={() => handleToggleFavorite(mat.id)}
                      >
                        {mat.isFavorite ? '★' : '☆'}
                      </button>
                      <div className="pl-card-name">{mat.name}</div>
                      <div className="pl-card-meta">
                        <Clock size={12} /> {new Date(mat.createdAt).toLocaleDateString()}
                      </div>
                      <div className="pl-card-summary">
                        {mat.summary}
                      </div>
                      {mat.isCorporate && (
                        <div className="pl-corporate-tag">
                          Curadoria Áquila PRO
                        </div>
                      )}
                      {mat.youtubeSummaries && mat.youtubeSummaries.length > 0 && (
                        <div className="pl-youtube-section">
                          <h4>📺 Videoaulas & Resumos IA:</h4>
                          <div className="pl-youtube-grid">
                            {mat.youtubeSummaries.map((yt, idx) => (
                              <div key={idx} className="pl-youtube-item">
                                <a href={yt.url} target="_blank" rel="noopener noreferrer" className="pl-yt-link">
                                  {yt.title}
                                </a>
                                <div className="pl-yt-summary">{yt.summary}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="pl-card-stats">
                        <div className="pl-stat">
                          <span className="pl-stat-val">{mat.flashcards.length}</span>
                          <span className="pl-stat-label">Flashcards</span>
                        </div>
                        <select 
                          className="pl-select-mini"
                          value={mat.collectionId || ''}
                          onChange={(e) => handleAssignToCollection(mat.id, e.target.value)}
                        >
                          <option value="">Mover para...</option>
                          {collections.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pl-grid">
                  {swarmResults.length > 0 ? swarmResults.map(item => (
                    <div key={item.id} className="pl-material-card swarm-card">
                      <div className="pl-swarm-origin">
                        <SearchCode size={14} /> Hub Externo
                      </div>
                      <div className="pl-card-name" style={{color: 'var(--accent-glow)'}}>{item.title}</div>
                      {item.isCorporate && <div className="pl-corporate-tag">Curadoria Áquila</div>}
                      <div className="pl-card-summary">
                        {item.excerpt}
                      </div>
                      <div className="pl-card-footer">
                        <div className="pl-reputation">
                          ⭐ Confiança: <strong>{item.reputationScore || 0}</strong>
                        </div>
                        <div className="pl-swarm-actions">
                          <button className="pl-vouch-btn" onClick={() => handleVouch(item.id)}>Vouch</button>
                          <button className="pl-import-btn" onClick={() => handleImport(item)}>Importar</button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="pl-empty">
                      <SearchCode size={48} opacity={0.2} />
                      <p>Nenhum material encontrado no enxame.</p>
                      <button className="pl-brain-btn" style={{marginTop: '20px'}} onClick={handleSwarmSearch}>
                        Forçar Varredura P2P
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'feed' && (
            <div className="pl-feed-container">
              <h3>Alimentação Direta de Conhecimento</h3>
              <p>O Córtex irá gerar automaticamente resumos, flashcards e buscar videoaulas no YouTube com base no seu texto.</p>
              
              <textarea 
                className="pl-feed-textarea"
                placeholder="Insira aqui notas de aula, conceitos chave ou transcrições para alimentar a inteligência..."
                value={feedText}
                onChange={(e) => setFeedText(e.target.value)}
              />
              
              <div className="pl-feed-actions">
                <button 
                  className="pl-brain-btn" 
                  onClick={handleTextFeed}
                  disabled={!feedText.trim()}
                >
                  <Zap size={16} /> Enriquecer Biblioteca
                </button>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <>
              <div className="pl-section-header">
                <h3>Alunos em Observação Próxima</h3>
                <p style={{color: '#64748b', fontSize: '13px'}}>Gatilho automático: 3 frustrações consecutivas com a I.A</p>
              </div>

              <div className="pl-risk-list">
                {studentsAtRisk.map(student => (
                  <div key={student.id} className="td-card" style={{marginBottom: '12px', border: student.observationLevel > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : ''}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <div className="student-avatar-mini" style={{background: 'rgba(59, 130, 246, 0.2)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{fontWeight: 700}}>{student.name}</div>
                          <div style={{fontSize: '11px', color: '#64748b'}}>Status: {student.observationLevel > 0 ? 'OBSERVAÇÃO ATIVA' : 'Sinalizado'}</div>
                        </div>
                      </div>
                      
                      <div className="pl-risk-metrics" style={{display: 'flex', gap: '20px'}}>
                        <div className="pl-stat">
                          <span className="pl-stat-val" style={{color: student.frustrationScore >= 3 ? '#ef4444' : '#f59e0b'}}>{student.frustrationScore}</span>
                          <span className="pl-stat-label">Frustrações</span>
                        </div>
                        <button 
                          className="td-action-btn" 
                          style={{width: 'auto', background: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e', color: '#22c55e'}}
                          onClick={() => handleIntervention(student.id)}
                        >
                          Realizar Intervenção
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {studentsAtRisk.length === 0 && (
                  <div className="pl-empty">
                    <CheckCircle2 size={48} color="#22c55e" opacity={0.2} />
                    <p>Todos os alunos operando em níveis normais.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {isUploading && (
        <div className="pl-processing-overlay">
          <div className="pl-spinner"></div>
          <p>{uploadStatus}</p>
        </div>
      )}

      {showHelpModal && (
        <HelpRequestModal 
          onClose={() => setShowHelpModal(false)}
          onSuccess={() => {
            setShowHelpModal(false);
            setUploadStatus('Solicitação enviada com sucesso!');
            setIsUploading(true);
            setTimeout(() => {
              setIsUploading(false);
              setUploadStatus(null);
            }, 3000);
          }}
        />
      )}
    </div>
  );
};

export default PedagogicalLibrary;
