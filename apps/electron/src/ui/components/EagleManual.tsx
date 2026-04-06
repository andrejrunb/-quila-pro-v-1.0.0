import React, { useState } from 'react';
import { BookOpen, Shield, Heart, Flame, Search, ChevronRight, FileText } from 'lucide-react';
import './EagleManual.css';

interface ManualTopic {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  category: 'security' | 'pedagogy' | 'health';
}

export const EagleManual: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>('intro');

  const topics: ManualTopic[] = [
    {
      id: 'intro',
      title: 'Manual Áquila Sovereign',
      icon: <BookOpen size={18} />,
      category: 'security',
      content: `
        # Bem-vindo à Soberania Escolar
        Este manual foi desenvolvido para transformar o gestor escolar em uma autoridade técnica absoluta.
        A Áquila Pro não é apenas um software, é uma doutrina de segurança e pedagogia de elite.
        
        Use os protocolos abaixo para garantir a ordem, a segurança e a conformidade legal do seu enxame.
      `
    },
    {
      id: 'lockdown',
      title: 'Protocolo: Invasão & Lockdown',
      icon: <Shield size={18} />,
      category: 'security',
      content: `
        # PROTOCOLO SOP-001: LOCKDOWN ATIVO
        Em caso de detecção de intruso armado ou ameaça iminente:
        
        1. **Alerta Silencioso:** Acione via SOC para todos os nós (Nexus).
        2. **Retenção de Alunos:** Orientar entrada imediata em salas seguras.
        3. **Câmeras de Borda:** O Áquila Brain priorizará o tracking do intruso com Re-ID.
        4. **Notificação das Autoridades:** O sistema enviará automaticamente o link do feed ao 190.
        
        *Lembre-se: O sistema cuida da vigilância enquanto você coordena as vidas.*
      `
    },
    {
      id: 'health',
      title: 'Emergência de Saúde',
      icon: <Heart size={18} />,
      category: 'health',
      content: `
        # PROTOCOLO SOP-002: CRISE MÉDICA
        Quando um aluno é identificado com mal-estar súbito ou acidente:
        
        1. **QR Code Biométrico:** Escaneie o crachá do aluno para ver o histórico de alergias instantaneamente.
        2. **Acionamento de Emergência:** Utilize o botão de pânico médico para notificar o SAMU e os pais via WhatsApp.
        3. **Isolamento de Área:** Se for caso de doença infectocontagiosa, use o mapa de calor para identificar quem teve contato próximo nas últimas 4 horas.
      `
    },
    {
      id: 'evacuation',
      title: 'Evasão em Massa (Incêndio)',
      icon: <Flame size={18} />,
      category: 'security',
      content: `
        # PROTOCOLO SOP-003: INCÊNDIO/DESASTRE
        Siga o fluxo de saída otimizada pelo Áquila:
        
        1. **Contagem de Cabeças:** O sistema usará as câmeras de saída para contar quem já deixou o prédio.
        2. **Lista de Faltantes:** Uma lista de "Alunos Não Localizados" aparecerá em destaque no seu celular.
        3. **Pontos de Encontro:** Guie os alunos para as zonas verdes demarcadas no Dashboard.
      `
    }
  ];

  const currentTopic = topics.find(t => t.id === activeTopic) || topics[0];

  return (
    <div className="eagle-manual-container">
      <aside className="manual-sidebar">
        <div className="search-box">
          <Search size={14} className="text-slate-500" />
          <input type="text" placeholder="Buscar protocolos..." />
        </div>
        
        <nav className="manual-nav">
          {topics.map(topic => (
            <button 
              key={topic.id}
              className={`nav-item ${activeTopic === topic.id ? 'active' : ''}`}
              onClick={() => setActiveTopic(topic.id)}
            >
              <span className="icon">{topic.icon}</span>
              <span className="title">{topic.title}</span>
              <ChevronRight size={12} className="arrow" />
            </button>
          ))}
        </nav>
      </aside>

      <main className="manual-content scrollbar-custom">
        <div className="content-badge">
          <FileText size={12} /> ÁQUILA PRO / SECURITY_DOC_v3.4
        </div>
        <div className="markdown-viewer">
          {currentTopic.content.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i}>{line.replace('# ', '')}</h1>;
            if (line.startsWith('## ')) return <h2 key={i}>{line.replace('## ', '')}</h2>;
            if (line.startsWith('*')) return <em key={i} className="text-slate-400 block mt-2">{line.replace('*', '')}</em>;
            return <p key={i}>{line}</p>;
          })}
        </div>
      </main>
    </div>
  );
};
