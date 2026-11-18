import React, { useState, useEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';

interface RtcFiscalAdapterPanelProps {
  onNotify?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const RtcFiscalAdapterPanel: React.FC<RtcFiscalAdapterPanelProps> = ({ onNotify }) => {
  const [rtcSubTab, setRtcSubTab] = useState<'danfse' | 'calculators'>('danfse');
  const [rtcStatus, setRtcStatus] = useState<any>(null);
  const [rtcXmlInput, setRtcXmlInput] = useState<string>('');
  const [rtcAdminRef, setRtcAdminRef] = useState<string>('ADM-2026-00418');
  const [rtcDocuments, setRtcDocuments] = useState<any[]>([]);
  const [rtcPreviewPdfUrl, setRtcPreviewPdfUrl] = useState<string | null>(null);
  const [rtcGeneratingDanfse, setRtcGeneratingDanfse] = useState(false);
  const [rtcDanfseError, setRtcDanfseError] = useState<{ errorClass?: string; message: string } | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const [rtcRegime, setRtcRegime] = useState<'regime_regular' | 'simples_nacional'>('regime_regular');
  const [rtcNbsCode, setRtcNbsCode] = useState<string>('1.1601.10.00');
  const [rtcOpDesc, setRtcOpDesc] = useState<string>('Servicos educacionais / licenciamento tecnologico');
  const [rtcBaseAmount, setRtcBaseAmount] = useState<string>('10000.00');
  const [rtcCbsRate, setRtcCbsRate] = useState<string>('8.8');
  const [rtcIbsUfRate, setRtcIbsUfRate] = useState<string>('12.2');
  const [rtcIbsMunRate, setRtcIbsMunRate] = useState<string>('5.5');
  const [rtcSeletivoRate, setRtcSeletivoRate] = useState<string>('0.0');
  const [rtcOpDate, setRtcOpDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [rtcReviewer, setRtcReviewer] = useState<string>('Contador Responsavel (CRC pendente conferencia)');
  const [rtcSimulations, setRtcSimulations] = useState<any[]>([]);
  const [rtcSimulating, setRtcSimulating] = useState(false);

  const notify = useCallback((msg: string, kind: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setBanner(msg);
    setTimeout(() => setBanner(prev => (prev === msg ? null : prev)), 4000);
    onNotify?.(msg, kind);
  }, [onNotify]);

  const loadRtcFiscalState = useCallback(async () => {
    const win = window as any;
    if (!win.aquila) return;
    try {
      const [stRes, docsRes, simsRes] = await Promise.all([
        win.aquila.invoke('rtc-fiscal:get-status'),
        win.aquila.invoke('rtc-fiscal:list-documents'),
        win.aquila.invoke('rtc-fiscal:list-simulations'),
      ]);
      if (stRes?.success) setRtcStatus(stRes.status);
      if (docsRes?.success && Array.isArray(docsRes.documents)) setRtcDocuments(docsRes.documents);
      if (simsRes?.success && Array.isArray(simsRes.simulations)) setRtcSimulations(simsRes.simulations);
    } catch {}
  }, []);

  useEffect(() => {
    loadRtcFiscalState();
  }, [loadRtcFiscalState]);

  const handleLoadSampleXml = async () => {
    try {
      const res = await (window as any).aquila?.invoke?.('rtc-fiscal:get-sample-xml');
      if (res?.success && res.xml) {
        setRtcXmlInput(res.xml);
        setRtcDanfseError(null);
        notify('XML modelo de NFS-e carregado (somente para teste documental).', 'info');
      }
    } catch {}
  };

  const handleXmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRtcXmlInput(String(reader.result || ''));
      setRtcDanfseError(null);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleGenerateDanfse = async () => {
    const win = window as any;
    if (!win.aquila) return;
    setRtcGeneratingDanfse(true);
    setRtcDanfseError(null);
    try {
      const res = await win.aquila.invoke('rtc-fiscal:generate-danfse', {
        xmlContent: rtcXmlInput,
        adminRecordRef: rtcAdminRef,
        schoolUnit: 'Administração Central',
        createdBy: 'Operador Administrativo',
      });
      if (!res?.success) {
        setRtcDanfseError({ errorClass: res?.errorClass, message: res?.error || 'Falha ao gerar DANFSe.' });
        notify(res?.error || 'Falha ao validar XML para DANFSe.', 'warning');
      } else {
        if (res.pdfBase64) {
          const byteChars = atob(res.pdfBase64);
          const bytes = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'application/pdf' });
          setRtcPreviewPdfUrl(URL.createObjectURL(blob));
        }
        await loadRtcFiscalState();
        notify('DANFSe gerado em PDF e XML original preservado em cofre isolado.', 'success');
      }
    } catch (err: any) {
      setRtcDanfseError({ message: err?.message || 'Erro de comunicação com o adaptador fiscal.' });
    } finally {
      setRtcGeneratingDanfse(false);
    }
  };

  const handleSwitchRtcRegime = (next: 'regime_regular' | 'simples_nacional') => {
    setRtcRegime(next);
    if (next === 'simples_nacional') {
      setRtcCbsRate('0.9');
      setRtcIbsUfRate('0.1');
      setRtcIbsMunRate('0.0');
      setRtcSeletivoRate('0.0');
    } else {
      setRtcCbsRate('8.8');
      setRtcIbsUfRate('12.2');
      setRtcIbsMunRate('5.5');
      setRtcSeletivoRate('0.0');
    }
  };

  const handleRunRtcSimulation = async () => {
    const win = window as any;
    if (!win.aquila) return;
    setRtcSimulating(true);
    try {
      const res = await win.aquila.invoke('rtc-fiscal:simulate-tax', {
        regime: rtcRegime,
        ncmOrNbsCode: rtcNbsCode,
        operationDescription: rtcOpDesc,
        baseAmount: rtcBaseAmount,
        cbsRatePercent: Number(rtcCbsRate),
        ibsUfRatePercent: Number(rtcIbsUfRate),
        ibsMunRatePercent: Number(rtcIbsMunRate),
        seletivoRatePercent: Number(rtcSeletivoRate),
        operationDate: rtcOpDate,
        reviewer: rtcReviewer,
      });
      if (res?.success) {
        await loadRtcFiscalState();
        notify('Simulação tributária determinística registrada com metadados de auditoria.', 'success');
      } else {
        notify(res?.error || 'Falha na simulação fiscal.', 'warning');
      }
    } finally {
      setRtcSimulating(false);
    }
  };

  return (
    <div className="rtc-fiscal-adapter-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {banner && (
        <div style={{ padding: '8px 12px', borderRadius: '9px', background: 'rgba(16, 185, 129, 0.16)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#6ee7b7', fontSize: '12px', fontWeight: 700 }}>
          {banner}
        </div>
      )}

      {/* Barra de Status Arquitetural e Sub-Abas */}
      <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.78)', border: '1px solid rgba(56, 189, 248, 0.22)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <FileText size={17} className="text-sky-400" />
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
              Adaptador Fiscal Independente — Receita Federal (RTC / NFS-e)
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.16)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              Isolado do aquila.db
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(59, 130, 246, 0.16)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              Zero XML/PDF em Logs & IA
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              Sem Movimentação Bancária Automática
            </span>
          </div>
          <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '3px', marginBottom: 0 }}>
            Cofre separado: <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{rtcStatus?.storageDir || 'userData/rtc_fiscal_isolated'}</span> • Chamadas diretas determinísticas (sem LangGraph)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setRtcSubTab('danfse')}
            style={{
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              border: rtcSubTab === 'danfse' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
              background: rtcSubTab === 'danfse' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
              color: rtcSubTab === 'danfse' ? '#fff' : '#94a3b8',
            }}
          >
            1. Gerador DANFSe (XML → PDF)
          </button>
          <button
            type="button"
            onClick={() => setRtcSubTab('calculators')}
            style={{
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              border: rtcSubTab === 'calculators' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
              background: rtcSubTab === 'calculators' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
              color: rtcSubTab === 'calculators' ? '#fff' : '#94a3b8',
            }}
          >
            2. Calculadoras (Regime Regular & Simples)
          </button>
        </div>
      </div>

      {rtcSubTab === 'danfse' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.15fr', gap: '12px' }}>
          <div className="glass-panel" style={{ padding: '14px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Conferência Documental — XML de NFS-e → DANFSe (PDF)
              </h3>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: rtcStatus?.connectors?.danfseGo?.online ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.16)', color: rtcStatus?.connectors?.danfseGo?.online ? '#34d399' : '#93c5fd' }}>
                {rtcStatus?.connectors?.danfseGo?.online ? 'Serviço Go /api/danfse Online' : 'Adaptador PDF Local Ativo (Go Offline)'}
              </span>
            </div>

            <div style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.28)', fontSize: '11px', color: '#fde68a', lineHeight: 1.35 }}>
              <strong>Importante:</strong> Gerar o DANFSe <strong>não equivale a emitir uma NFS-e</strong>. Inicia a partir de um XML já fornecido e não comprova autorização fiscal, pagamento ou autenticidade da operação.
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '170px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px', fontWeight: 700 }}>
                  Ref. Registro Administrativo
                </label>
                <input
                  type="text"
                  value={rtcAdminRef}
                  onChange={(e) => setRtcAdminRef(e.target.value)}
                  style={{ width: '100%', padding: '5px 9px', minHeight: '30px', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.7)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={handleLoadSampleXml}
                  style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.16)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#7dd3fc', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Carregar XML Modelo
                </button>
                <label style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>
                  Anexar .XML
                  <input type="file" accept=".xml,text/xml,application/xml" onChange={handleXmlFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px', fontWeight: 700 }}>
                Conteúdo XML da NFS-e (máx. 512 KB • bloqueio anti-XXE ativo • sem log)
              </label>
              <textarea
                value={rtcXmlInput}
                onChange={(e) => setRtcXmlInput(e.target.value)}
                placeholder="Cole o XML da NFS-e de serviço recebido ou clique em 'Carregar XML Modelo'..."
                rows={6}
                style={{ width: '100%', padding: '7px 9px', minHeight: '118px', borderRadius: '10px', background: 'rgba(2, 6, 23, 0.75)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '11px', resize: 'vertical' }}
              />
            </div>

            {rtcDanfseError && (
              <div style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', fontSize: '11px' }}>
                <strong>{rtcDanfseError.errorClass || 'Erro Documental'}:</strong> {rtcDanfseError.message}
              </div>
            )}

            <button
              type="button"
              disabled={rtcGeneratingDanfse}
              onClick={handleGenerateDanfse}
              style={{ padding: '8px 14px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff', fontWeight: 800, fontSize: '12.5px', border: 'none', cursor: 'pointer' }}
            >
              {rtcGeneratingDanfse ? 'Validando XML e Gerando DANFSe...' : 'Validar XML, Preservar Vínculo SHA-256 & Gerar DANFSe (PDF)'}
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '14px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#fff', margin: 0 }}>
                Acervo Isolado de NFS-e / DANFSe ({rtcDocuments.length})
              </h3>
              {rtcPreviewPdfUrl && (
                <a
                  href={rtcPreviewPdfUrl}
                  download="DANFSe_Conferencia.pdf"
                  style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', fontSize: '11.5px', fontWeight: 800, textDecoration: 'none' }}
                >
                  Baixar Último PDF
                </a>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '295px', overflowY: 'auto' }}>
              {rtcDocuments.length === 0 ? (
                <div style={{ padding: '22px', textAlign: 'center', color: '#64748b', fontSize: '12px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                  Nenhum XML convertido ainda. Carregue o XML modelo à esquerda para validar o fluxo documental DANFSe.
                </div>
              ) : (
                rtcDocuments.slice(0, 6).map((doc: any) => (
                  <div key={doc.id} style={{ padding: '9px 11px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '12px', color: '#fff' }}>
                        NFS-e #{doc.number} • {doc.providerName}
                      </strong>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>
                        R$ {doc.serviceAmountDecimal}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      Ref: <strong>{doc.adminRecordRef}</strong> • Motor: <span style={{ color: '#7dd3fc' }}>{doc.providerMode}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#64748b', marginTop: '3px' }}>
                      XML SHA-256: {String(doc.xmlSha256 || '').slice(0, 18)}... ↔ PDF SHA-256: {String(doc.pdfSha256 || '').slice(0, 18)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {rtcSubTab === 'calculators' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '12px' }}>
          <div className="glass-panel" style={{ padding: '14px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#fff', margin: 0 }}>
              Simulador Tributário Revisável (CBS, IBS e Imposto Seletivo)
            </h3>

            <div style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.28)', fontSize: '11px', color: '#bfdbfe', lineHeight: 1.35 }}>
              <strong>Conferência Contábil & Documental:</strong> O software executa regra determinística sem substituir decisão do contador. Serviços Java offline da RFB exigem base SQLite pré-gerada (e atenção às divergências de porta 8082/8080 e pasta <code>flyway/</code> no README do Simples Nacional).
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleSwitchRtcRegime('regime_regular')}
                style={{
                  padding: '7px', borderRadius: '9px', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                  background: rtcRegime === 'regime_regular' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.03)',
                  border: rtcRegime === 'regime_regular' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                  color: rtcRegime === 'regime_regular' ? '#6ee7b7' : '#94a3b8'
                }}
              >
                Regime Regular (CBS/IBS/IS)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchRtcRegime('simples_nacional')}
                style={{
                  padding: '7px', borderRadius: '9px', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                  background: rtcRegime === 'simples_nacional' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                  border: rtcRegime === 'simples_nacional' ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                  color: rtcRegime === 'simples_nacional' ? '#ddd6fe' : '#94a3b8'
                }}
              >
                Simples Nacional (CBS/IBS)
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Valor Base (R$)</label>
                <input type="text" value={rtcBaseAmount} onChange={(e) => setRtcBaseAmount(e.target.value)} style={{ width: '100%', padding: '5px 9px', minHeight: '30px', borderRadius: '8px', background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>NBS / NCM</label>
                <input type="text" value={rtcNbsCode} onChange={(e) => setRtcNbsCode(e.target.value)} style={{ width: '100%', padding: '5px 9px', minHeight: '30px', borderRadius: '8px', background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '12px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8' }}>CBS (%)</label>
                <input type="text" value={rtcCbsRate} onChange={(e) => setRtcCbsRate(e.target.value)} style={{ width: '100%', padding: '5px 7px', minHeight: '30px', borderRadius: '7px', background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8' }}>IBS UF (%)</label>
                <input type="text" value={rtcIbsUfRate} onChange={(e) => setRtcIbsUfRate(e.target.value)} style={{ width: '100%', padding: '5px 7px', minHeight: '30px', borderRadius: '7px', background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8' }}>IBS Mun (%)</label>
                <input type="text" value={rtcIbsMunRate} onChange={(e) => setRtcIbsMunRate(e.target.value)} style={{ width: '100%', padding: '5px 7px', minHeight: '30px', borderRadius: '7px', background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8' }}>IS (%)</label>
                <input type="text" value={rtcSeletivoRate} onChange={(e) => setRtcSeletivoRate(e.target.value)} disabled={rtcRegime === 'simples_nacional'} style={{ width: '100%', padding: '5px 7px', minHeight: '30px', borderRadius: '7px', background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '12px' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Descrição da Operação</label>
              <input type="text" value={rtcOpDesc} onChange={(e) => setRtcOpDesc(e.target.value)} style={{ width: '100%', padding: '5px 9px', minHeight: '30px', borderRadius: '8px', background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '12px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Data da Operação</label>
                <input type="date" value={rtcOpDate} onChange={(e) => setRtcOpDate(e.target.value)} style={{ width: '100%', padding: '5px 9px', minHeight: '30px', borderRadius: '8px', background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Responsável pela Revisão Contábil</label>
                <input type="text" value={rtcReviewer} onChange={(e) => setRtcReviewer(e.target.value)} style={{ width: '100%', padding: '5px 9px', minHeight: '30px', borderRadius: '8px', background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '12px' }} />
              </div>
            </div>

            <button
              type="button"
              disabled={rtcSimulating}
              onClick={handleRunRtcSimulation}
              style={{ padding: '8px 14px', borderRadius: '10px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#022c22', fontWeight: 900, fontSize: '12.5px', border: 'none', cursor: 'pointer' }}
            >
              {rtcSimulating ? 'Calculando em Centavos...' : 'Executar Cálculo Determinístico & Registrar Memória'}
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '14px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#fff', margin: 0 }}>
              Memória de Cálculos & Auditoria Contábil ({rtcSimulations.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '310px', overflowY: 'auto' }}>
              {rtcSimulations.length === 0 ? (
                <div style={{ padding: '22px', textAlign: 'center', color: '#64748b', fontSize: '12px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                  Execute uma estimativa ao lado para gravar versão do motor, versão da base, entradas, resultado e responsável.
                </div>
              ) : (
                rtcSimulations.slice(0, 5).map((sim: any) => (
                  <div key={sim.id} style={{ padding: '9px 11px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '12px', color: '#fff' }}>
                        {sim.regime === 'simples_nacional' ? 'Simples Nacional' : 'Regime Regular'} • Base R$ {sim.inputs?.baseAmountDecimal} ({sim.inputs?.ncmOrNbsCode})
                      </strong>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>
                        Total RTC: R$ {sim.result?.totalRtcTaxesDecimal} ({sim.result?.effectiveRatePercent}%)
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
                      CBS: R$ {sim.result?.cbsAmountDecimal} • IBS UF: R$ {sim.result?.ibsUfAmountDecimal} • IBS Mun: R$ {sim.result?.ibsMunAmountDecimal} • IS: R$ {sim.result?.seletivoAmountDecimal}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      Motor: <code>{sim.engineVersion}</code> • Base: <code>{sim.databaseVersion}</code> • Data Op.: {sim.operationDate}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#fcd34d', marginTop: '2px' }}>
                      Revisor: {sim.reviewer}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RtcFiscalAdapterPanel;
