import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import './EmpathicCockpit.css';

const EmpathicCockpit: React.FC = () => {
  const [pulse, setPulse] = useState<any>(null);

  const fetchPulse = async () => {
    try {
      const p = await (window as any).aquila.invoke('affective:get-climate');
      setPulse(p);
    } catch (err) {
      console.error('Erro ao consultar status normativo CNE/CP nº 15/2026:', err);
    }
  };

  useEffect(() => {
    fetchPulse();
  }, []);

  return (
    <div className="empathic-container">
      <header className="empathic-header">
        <div className="flex items-center gap-4">
          <ShieldCheck size={32} className="text-emerald-400" />
          <div>
            <h1>Painel de Salvaguarda Emocional (Bloqueado)</h1>
            <p>Conformidade Imediata — Parecer CNE/CP nº 15/2026 (MEC DOU 11/11/2026)</p>
          </div>
        </div>
      </header>

      <div className="empathic-grid">
        <section className="global-metrics glass-panel" style={{ gridColumn: '1 / -1', padding: '1.75rem' }}>
          <div className="flex items-start gap-4">
            <Lock size={28} className="text-amber-400 shrink-0" />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Inferência Automatizada de Emoções Desativada por Lei
              </h2>
              <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
                Em cumprimento imediato ao <strong>Parecer CNE/CP nº 15/2026</strong> (homologado pelo
                Ministério da Educação em 10/11/2026, DOU Edição 212, Seção 1, p. 141), o reconhecimento
                e a inferência automatizada de emoções, humor ou atenção de estudantes classificam-se como{' '}
                <strong>Risco Excessivo</strong> e estão tecnicamente bloqueados neste painel.
              </p>
              <p style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '0.75rem' }}>
                Código de bloqueio: <code>{pulse?.complianceCode || 'CNE_15_2026_PROHIBITED_EMOTION_INFERENCE'}</code>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EmpathicCockpit;
