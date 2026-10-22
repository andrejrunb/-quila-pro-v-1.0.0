import React from 'react';
import { 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Award, 
  Target,
  ArrowRight,
  Download
} from 'lucide-react';
import './InstitutionalPlaybook.css';

const InstitutionalPlaybook: React.FC = () => {
  return (
    <div className="playbook-container">
      <header className="playbook-header">
        <div className="header-content">
          <Award className="icon-gold" size={40} />
          <div>
            <h1>Playbook de Transformação Institucional</h1>
            <p>Áquila Pro v2.0.0 — Estratégia de Soberania e ROI</p>
          </div>
        </div>
        <button className="download-guide-btn">
          <Download size={18} /> Baixar Guia Executivo (PDF)
        </button>
      </header>

      <div className="playbook-grid">
        <section className="playbook-card roi-focus">
          <div className="card-header">
            <TrendingUp size={24} />
            <h2>Retorno sobre Investimento (ROI)</h2>
          </div>
          <div className="roi-metrics">
            <div className="roi-item">
              <span className="label">Eficiência de Chamada</span>
              <span className="value">+95%</span>
              <p>Redução de tempo administrativo manual.</p>
            </div>
            <div className="roi-item">
              <span className="label">Inadimplência</span>
              <span className="value">-18%</span>
              <p>Otimização de cobrança via PIX e réguas de cobrança.</p>
            </div>
            <div className="roi-item">
              <span className="label">Segurança Preventiva</span>
              <span className="value">Total</span>
              <p>Eliminação de acessos não autorizados.</p>
            </div>
          </div>
        </section>

        <section className="playbook-card roadmap-v2">
          <div className="card-header">
            <Target size={24} />
            <h2>Roadmap de Maturidade Digital</h2>
          </div>
          <ul className="milestone-list">
            <li className="completed">
              <ShieldCheck size={18} />
              <div>
                <strong>Nível 1-18: Estabilização e Radar</strong>
                <span>Fase Concluída — Hubs ativos e monitorados.</span>
              </div>
            </li>
            <li className="completed">
              <ShieldCheck size={18} />
              <div>
                <strong>Nível 19-20: Gêmeos e Federação</strong>
                <span>Fase Concluída — Malha Nexus e Mirroring 3D.</span>
              </div>
            </li>
            <li className="active">
              <Zap size={18} className="animate-pulse" />
              <div>
                <strong>Nível 21: Autonomia Total</strong>
                <span>Em progresso — Operação 100% soberana em hardware Edge.</span>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <div className="executive-summary">
        <h3>Visão Executiva do Diretor</h3>
        <p>
          O Áquila Pro v2.0.0 não é apenas uma ferramenta de segurança, mas um sistema operacional de inteligência escolar. 
          Ao adotar a soberania de dados, sua instituição se posiciona na vanguarda da LGPD e da tecnologia NPU, garantindo 
          um ambiente seguro, eficiente e pedagogicamente avançado.
        </p>
        <div className="playbook-actions">
           <button className="primary-action">Configurar Governança Nexus <ArrowRight size={16} /></button>
           <button className="secondary-action">Auditar Conformidade LGPD</button>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalPlaybook;
