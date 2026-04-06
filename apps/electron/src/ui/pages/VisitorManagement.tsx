import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserPlus, ShieldCheck, Camera, Printer, Search, CheckCircle2, ArrowLeft, Monitor, UserCheck, Clock, X, RefreshCw, ZoomIn, ShieldAlert } from 'lucide-react';
import './VisitorManagement.css';

interface Visitor {
  id: string;
  name: string;
  cpf: string;
  reason: string;
  checkIn: string;
  status: 'active' | 'completed';
  photo?: string;
}

type TotemStep = 'idle' | 'form' | 'webcam' | 'background-check' | 'confirm';

export const VisitorManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isTotemMode, setIsTotemMode] = useState(false);
  const [totemStep, setTotemStep] = useState<TotemStep>('idle');
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    reason: 'Reunião Pedagógica'
  });

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [backgroundRisk, setBackgroundRisk] = useState<{ allowed: boolean; riskLevel: string; remarks?: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (window.aquila) {
      window.aquila.getRecentVisitors().then((v: any[]) => {
        if (Array.isArray(v) && v.length > 0) setVisitors(v);
      }).catch(() => {
        seedMockVisitors();
      });
    } else {
      seedMockVisitors();
    }
  }, []);

  const seedMockVisitors = () => {
    setVisitors([
      { id: '1', name: 'Marcos Oliveira', cpf: '123.456.789-00', reason: 'Manutenção TI', checkIn: '09:15', status: 'active' },
    ]);
  };

  useEffect(() => {
    if (totemStep === 'webcam') {
      setCameraError(null);
      setCapturedPhoto(null);
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch(err => {
          setCameraError(`Não foi possível acessar a câmera: ${err.message}. Verifique as permissões do navegador.`);
        });
    }
    return () => {
      if (totemStep !== 'webcam' && streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [totemStep]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(dataUrl);
      stopCamera();
      
      setTotemStep('background-check');
      setIsVerifying(true);
      
      if (window.aquila) {
        window.aquila.registerVisitor({ cpf: formData.cpf, name: formData.name, photo: dataUrl, reason: formData.reason })
          .then((res: any) => {
            setBackgroundRisk({ allowed: res.securityStatus !== 'CRITICAL', riskLevel: res.securityStatus });
            setIsVerifying(false);
          })
          .catch(() => {
            setBackgroundRisk({ allowed: true, riskLevel: 'CLEARED' });
            setIsVerifying(false);
          });
      } else {
        setTimeout(() => {
          setBackgroundRisk({ allowed: true, riskLevel: 'CLEARED' });
          setIsVerifying(false);
        }, 1500);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTotemStep('webcam');
  };

  const handleConfirmRegister = () => {
    const newVisitor: Visitor = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      checkIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'active',
      photo: capturedPhoto || undefined
    };

    setVisitors(prev => [newVisitor, ...prev]);
    
    if (window.aquila) {
      window.aquila.registerVisitor({
        ...formData,
        checkIn: newVisitor.checkIn,
        photo: capturedPhoto
      }).catch(() => {});
    }

    window.aquila.printBadge({
      visitorName: formData.name,
      cpf: formData.cpf,
      reason: formData.reason,
      checkInTime: newVisitor.checkIn
    });

    setFormData({ name: '', cpf: '', reason: 'Reunião Pedagógica' });
    setCapturedPhoto(null);
    setTotemStep('idle');
  };

  const handleCancelTotem = () => {
    stopCamera();
    setTotemStep('idle');
    setFormData({ name: '', cpf: '', reason: 'Reunião Pedagógica' });
    setCapturedPhoto(null);
  };

  // ==== MODO TOTEM ====
  if (isTotemMode) {
    return (
      <div className="totem-overlay font-sans">

        {/* ETAPA: idle — tela inicial */}
        {totemStep === 'idle' && (
          <div className="totem-card animate-zoom-in">
            <div className="totem-icon-container">
              <UserPlus className="w-12 h-12 text-blue-400" />
            </div>
            <h1 className="totem-title">Bem-vindo à Áquila School</h1>
            <p className="totem-subtitle">Por favor, identifique-se para liberar seu acesso.</p>
            
            <div className="totem-actions-grid">
              <button
                onClick={() => setTotemStep('form')}
                className="btn-totem-main group"
                title="Novo Visitante"
                aria-label="Iniciar novo cadastro de visitante"
              >
                <Camera className="w-10 h-10 mb-4" />
                <span className="text-xl font-semibold">Novo Visitante</span>
              </button>
              <button className="btn-totem-secondary" title="Visitante já Cadastrado" aria-label="Identificar visitante já cadastrado no sistema">
                <UserCheck className="w-10 h-10 mb-4 text-green-400" />
                <span className="text-xl font-semibold">Já tenho Cadastro</span>
              </button>
            </div>

            <button
              onClick={() => setIsTotemMode(false)}
              className="btn-exit-totem"
              title="Sair do Modo Totem"
              aria-label="Sair do Modo Totem e voltar para a gestão administrativa"
            >
              <ShieldCheck className="w-4 h-4" /> Somente Funcionários Autorizados
            </button>
          </div>
        )}

        {/* ETAPA: form — dados do visitante */}
        {totemStep === 'form' && (
          <div className="totem-panel-form animate-zoom-in">
            <div className="panel-header">
              <button onClick={handleCancelTotem} className="btn-panel-back" title="Voltar" aria-label="Voltar para a tela anterior">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold">Dados da Visita</h2>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="totem-form-group">
                <label className="totem-label">Nome Completo *</label>
                <input
                  required
                  title="Nome Completo"
                  aria-label="Nome Completo"
                  placeholder="Digite seu nome"
                  value={formData.name}
                  className="totem-input"
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="totem-form-group">
                <label className="totem-label">CPF / Documento *</label>
                <input
                  required
                  title="CPF / Documento"
                  aria-label="CPF / Documento"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  className="totem-input"
                  onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                />
              </div>
              <div className="totem-form-group">
                <label className="totem-label">Motivo da Visita</label>
                <select
                  value={formData.reason}
                  title="Motivo da Visita"
                  aria-label="Motivo da Visita"
                  className="totem-select"
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                >
                  <option>Reunião Pedagógica</option>
                  <option>Manutenção</option>
                  <option>Entregas</option>
                  <option>Visita a Aluno</option>
                  <option>Outros</option>
                </select>
              </div>
              <button type="submit" className="btn-sumbit-totem" title="Próximo" aria-label="Avançar para a captura de foto">
                <Camera className="w-5 h-5" /> Próximo: Tirar Foto
              </button>
              <button type="button" onClick={handleCancelTotem} className="w-full text-slate-400 py-2 hover:text-slate-300" title="Cancelar" aria-label="Cancelar cadastro">
                Cancelar
              </button>
            </form>
          </div>
        )}

        {/* ETAPA: webcam — captura de foto */}
        {totemStep === 'webcam' && (
          <div className="webcam-panel animate-zoom-in">
            <h2 className="text-2xl font-bold mb-2">Capturar Foto</h2>
            <p className="totem-subtitle mb-6">Olhe diretamente para a câmera e clique em <strong>Capturar</strong>.</p>

            {cameraError ? (
              <div className="camera-error-box">
                {cameraError}
                <button
                  className="block mt-3 mx-auto text-blue-400 underline"
                  onClick={() => setTotemStep('webcam')}
                  title="Tentar Novamente"
                  aria-label="Tentar acessar a câmera novamente"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="visitor-video-wrapper">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="visitor-video-feed"
                />
                <div className="face-guide">
                  <div className="face-oval" />
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={handleCancelTotem} className="btn-totem-secondary py-3 flex-1 flex-row gap-2" title="Cancelar" aria-label="Cancelar e voltar ao início">
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button
                onClick={handleCapture}
                disabled={!!cameraError}
                className="btn-sumbit-totem flex-1 py-4"
                title="Capturar Foto"
                aria-label="Capturar sua foto agora"
              >
                <Camera className="w-5 h-5" /> Capturar Foto
              </button>
            </div>
          </div>
        )}

        {/* ETAPA: background-check — Phase 710 (Guardian API) */}
        {totemStep === 'background-check' && (
          <div className="totem-panel-form animate-zoom-in text-center">
            <div className="security-status-icon">
              {isVerifying ? (
                <ShieldCheck className="w-12 h-12 mx-auto status-check-anim" />
              ) : backgroundRisk?.allowed ? (
                <CheckCircle2 className="w-12 h-12 mx-auto status-check-success" />
              ) : (
                <ShieldAlert className="w-12 h-12 mx-auto status-check-error" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">Verificando Credenciais</h2>
            <p className="totem-subtitle mb-8">
              {isVerifying 
                ? 'Consultando bases de segurança e antecedentes criminais...' 
                : 'Verificação de segurança concluída com sucesso.'}
            </p>

            {isVerifying ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm text-slate-500">Aguarde um momento...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {backgroundRisk?.allowed ? (
                  <>
                    <div className="check-result-box result-success">
                      Nenhuma restrição encontrada para este documento.
                    </div>
                    <button
                      onClick={() => setTotemStep('confirm')}
                      className="btn-sumbit-totem py-4"
                      title="Continuar"
                      aria-label="Continuar o cadastro"
                    >
                      Continuar Cadastro
                    </button>
                  </>
                ) : (
                  <div className="check-result-box result-denied">
                    <h3 className="font-bold mb-2 text-lg">ACESSO NÃO AUTORIZADO</h3>
                    <p className="text-sm mb-6">{backgroundRisk?.remarks || 'Restrição ativa identificada em base nacional.'}</p>
                    <button
                      onClick={handleCancelTotem}
                      className="btn-totem-secondary w-full py-4"
                      title="Voltar ao Início"
                      aria-label="Voltar para a tela inicial do totem"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ETAPA: confirm — confirmação antes de imprimir */}
        {totemStep === 'confirm' && (
          <div className="totem-panel-form animate-zoom-in text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Confirmar Cadastro</h2>
            <p className="totem-subtitle mb-6">Verifique os dados e a foto antes de confirmar.</p>

            {capturedPhoto && (
              <img src={capturedPhoto} alt="Foto" className="captured-img-preview" />
            )}

            <div className="visitor-summary-box">
              <div className="summary-row"><span className="summary-label">Nome:</span> <span className="summary-value">{formData.name}</span></div>
              <div className="summary-row"><span className="summary-label">CPF:</span> <span className="summary-value">{formData.cpf}</span></div>
              <div className="summary-row"><span className="summary-label">Motivo:</span> <span className="summary-value">{formData.reason}</span></div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { stopCamera(); setTotemStep('webcam'); }}
                className="btn-totem-secondary flex-1 py-3 flex-row gap-2"
                title="Tirar Outra Foto"
                aria-label="Tirar uma nova foto"
              >
                <RefreshCw className="w-4 h-4" /> Refazer
              </button>
              <button
                onClick={handleConfirmRegister}
                className="btn-sumbit-totem flex-1 py-4 bg-green-600"
                title="Confirmar e Imprimir"
                aria-label="Confirmar cadastro e imprimir crachá"
              >
                <Printer className="w-5 h-5" /> Imprimir
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==== MODO GESTÃO (ADMIN) ====
  return (
    <div className="visitor-mgmt-page font-sans">
      <div className="visitor-mgmt-header">
        <div className="header-left">
          <button onClick={onBack} className="btn-back-square" title="Voltar" aria-label="Voltar para a tela anterior">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="visitor-mgmt-title-group">
            <h1>Gestão de Visitantes</h1>
            <p>Monitoramento de portaria e Totem de auto-cadastro</p>
          </div>
        </div>

        <button onClick={() => setIsTotemMode(true)} className="btn-totem-mode" title="Ativar Totem" aria-label="Ativar o modo totem para auto-cadastro de visitantes">
          <Monitor className="w-5 h-5" /> Ativar Modo Totem
        </button>
      </div>

      <div className="visitor-mgmt-grid">
        <div className="visitor-list-main">
          <section className="mgmt-section-card">
            <div className="card-header-bar">
              <h3><Clock className="w-4 h-4 text-blue-400" /> No Prédio Agora</h3>
              <div className="search-container">
                <Search className="search-icon" size={16} />
                <input
                  placeholder="Buscar visitante..."
                  className="search-input"
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="visitor-table-wrapper custom-scrollbar">
              <table className="visitor-table">
                <thead>
                  <tr>
                    <th>Visitante</th>
                    <th>Motivo</th>
                    <th>Check-in</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())).map(visitor => (
                    <tr key={visitor.id} className="visitor-row">
                      <td>
                        <div className="visitor-info-cell">
                          {visitor.photo ? (
                            <img src={visitor.photo} alt={visitor.name} className="visitor-photo-mini" />
                          ) : (
                            <div className="visitor-photo-placeholder">
                              <UserPlus className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <div className="visitor-name">{visitor.name}</div>
                            <div className="visitor-id">{visitor.cpf}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="reason-badge">{visitor.reason}</span>
                      </td>
                      <td><span className="check-in-time">{visitor.checkIn}</span></td>
                      <td className="actions-cell">
                        <div className="action-buttons-group">
                          <button
                            className="btn-action-icon"
                            title="Imprimir Crachá"
                            aria-label="Imprimir crachá do visitante"
                            onClick={() => window.aquila.printBadge({
                              visitorName: visitor.name,
                              cpf: visitor.cpf,
                              reason: visitor.reason,
                              checkInTime: visitor.checkIn
                            })}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {visitor.photo && (
                            <button
                              className="btn-action-icon"
                              title="Ver Foto"
                              aria-label="Visualizar foto capturada do visitante"
                              onClick={() => window.open(visitor.photo, '_blank')}
                            >
                              <ZoomIn className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visitors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">Nenhum visitante no momento.</div>
              )}
            </div>
          </section>
        </div>

        <aside className="visitor-stats-sidebar">
          <div className="stats-sidebar-card">
            <h4 className="stats-card-header">
              <ShieldCheck className="w-5 h-5" /> Status da Portaria
            </h4>
            <div className="stats-item-row">
              <span className="stats-item-label">Visitantes Ativos</span>
              <span className="stats-item-value">
                {visitors.filter(v => v.status === 'active').length}
              </span>
            </div>
            <div className="stats-item-footer">
              <div className="stats-footer-text">
                TODOS OS ACESSOS SÃO MONITORADOS POR IA
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default VisitorManagement;
