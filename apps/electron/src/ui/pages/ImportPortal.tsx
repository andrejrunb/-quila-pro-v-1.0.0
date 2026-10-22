import React, { useState } from 'react';
import { PortalLayout } from '../layouts/PortalLayout';
import { Upload, Database, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import './ImportPortal.css';

export const ImportPortal: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'students' | 'schedules'>('students');
    const [dragging, setDragging] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [pastedContent, setPastedContent] = useState('');

    const handleSync = async () => {
        if (!pastedContent.trim()) return;
        
        setImporting(true);
        const channel = activeTab === 'students' ? 'integration:sync-students' : 'integration:sync-schedules';
        
        try {
            const win = window as any;
            if (win.aquila) {
                const res = await win.aquila.invoke(channel, {
                    source: activeTab === 'students' ? 'Portal de Alunos' : 'Grade Urania/PowerCubus',
                    content: pastedContent
                });
                setResult(res);
            } else {
                // Mock for dev
                await new Promise(r => setTimeout(r, 1500));
                setResult({ success: true, count: 125, timestamp: new Date().toISOString() });
            }
        } catch (err) {
            setResult({ success: false, message: 'Falha na conexão com o serviço de integração.' });
        }
        setImporting(false);
    };

    return (
        <PortalLayout portalName="Hub de Ingestão Soberana" themeColor="#3b82f6">
            <div className="import-container animate-fade-in">
                <header className="import-header flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Database size={32} className="text-blue-500" />
                        <div>
                            <h2 className="text-2xl font-bold">Importação de Sistemas Legados</h2>
                            <p className="text-slate-500">Alimente o Áquila Pro com dados da sua secretaria.</p>
                        </div>
                    </div>
                </header>

                {/* Tabs de Navegação */}
                <div className="tabs-container flex gap-2 mb-6 mt-4">
                    <button 
                        className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('students'); setResult(null); setPastedContent(''); }}
                    >
                        <Upload size={16} /> Alunos
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'schedules' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('schedules'); setResult(null); setPastedContent(''); }}
                    >
                        <FileText size={16} /> Grade Horária
                    </button>
                </div>

                <div className="import-grid">
                    {/* Área de Input */}
                    <div className="input-area glass-card">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black uppercase text-secondary">
                                {activeTab === 'students' ? 'Dados dos Alunos' : 'Dados da Grade'}
                            </h3>
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded">
                                {activeTab === 'students' ? 'SIS/ERP' : 'HORÁRIO'}
                            </span>
                        </div>
                        
                        <textarea 
                            className="paste-area"
                            placeholder={activeTab === 'students' 
                                ? "Cole aqui o código HTML da tabela de alunos ou o CSV do sistema da secretaria..."
                                : "Cole aqui o CSV exportado do Urania, PowerCubus ou similar..."
                            }
                            value={pastedContent}
                            onChange={(e) => setPastedContent(e.target.value)}
                        />

                        <button 
                            className={`btn-sync mt-6 ${importing ? 'loading' : ''}`}
                            onClick={handleSync}
                            disabled={importing || !pastedContent}
                        >
                            {importing ? <Loader2 className="animate-spin" /> : <Database size={18} />}
                            {importing ? 'Sincronizando...' : `Importar ${activeTab === 'students' ? 'Alunos' : 'Grade'}`}
                        </button>
                    </div>

                    {/* Área de Resultado/Status */}
                    <div className="status-area">
                        {result ? (
                            <div className="result-card glass-card animate-slide-up">
                                {result.success ? (
                                    <>
                                        <div className="result-header text-green-400">
                                            <CheckCircle2 size={24} />
                                            <h3>{activeTab === 'students' ? 'Alunos Sincronizados' : 'Grade Importada'}</h3>
                                        </div>
                                        <div className="metrics-grid mt-4">
                                            <div className="metric">
                                                <span className="label">Registros</span>
                                                <span className="value">{result.count}</span>
                                            </div>
                                            <div className="metric">
                                                <span className="label">Status</span>
                                                <span className="value">Soberano</span>
                                            </div>
                                        </div>
                                        <p className="mt-4 text-xs text-slate-400">
                                            {activeTab === 'students' 
                                                ? 'A base de alunos foi atualizada localmente.' 
                                                : 'Os horários foram vinculados às turmas e professores identificados.'}
                                        </p>
                                        <button className="btn-secondary mt-6" onClick={() => setResult(null)}>
                                            Limpar <ArrowRight size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="result-header text-red-400">
                                        <AlertCircle size={24} />
                                        <div>
                                            <h3>Erro na Ingestão</h3>
                                            <p className="text-xs">{result.message}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="guidance-card glass-card">
                                <FileText size={20} className="text-blue-400 mb-4" />
                                <h3 className="font-bold">
                                    {activeTab === 'students' ? 'Importar Alunos' : 'Importar Grade'}
                                </h3>
                                <ul className="steps-list mt-4">
                                    {activeTab === 'students' ? (
                                        <>
                                            <li><span>1</span> Entre no site da sua secretaria</li>
                                            <li><span>2</span> Vá na lista de alunos matriculados</li>
                                            <li><span>3</span> Selecione e copie a tabela (HTML)</li>
                                            <li><span>4</span> Cole no campo ao lado</li>
                                        </>
                                    ) : (
                                        <>
                                            <li><span>1</span> Exporte o CSV do seu software de grade</li>
                                            <li><span>2</span> Abra o arquivo no Bloco de Notas</li>
                                            <li><span>3</span> Copie todo o conteúdo</li>
                                            <li><span>4</span> Certifique-se que os Alunos já foram importados</li>
                                        </>
                                    )}
                                </ul>
                                <div className="info-box mt-6">
                                    <AlertCircle size={14} className="text-blue-500" />
                                    <p>O processamento é feito localmente no seu Áquila Edge Hub.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
};
