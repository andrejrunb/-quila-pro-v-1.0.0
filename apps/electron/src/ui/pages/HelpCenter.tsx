import React, { useState, useMemo } from 'react';
import {
  BookOpen, Search, Zap, Camera, Users, ShieldCheck, CreditCard, Globe,
  ChevronDown, ChevronUp, ExternalLink, Play, HelpCircle, Keyboard, ArrowLeft,
  BarChart3, Settings, Monitor, MessageSquare, UserCheck, GraduationCap, Shield,
  Bell, Brain, Eye, MapPin, FileText, Lock, Lightbulb, CheckCircle2,
} from 'lucide-react';
import './HelpCenter.css';

// ─── Types ─────────────────────────────────────────────────
interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  roles: string[];
  isNew?: boolean;
}

interface HelpCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

// ─── Data ──────────────────────────────────────────────────
const ROLES = [
  { id: 'all', label: 'Todos', icon: <Users size={14} /> },
  { id: 'admin', label: 'Direção', icon: <Shield size={14} /> },
  { id: 'coordinator', label: 'Coordenação', icon: <UserCheck size={14} /> },
  { id: 'teacher', label: 'Docente', icon: <GraduationCap size={14} /> },
  { id: 'secretary', label: 'Secretaria', icon: <FileText size={14} /> },
  { id: 'security', label: 'Segurança', icon: <Eye size={14} /> },
];

const CATEGORIES: HelpCategory[] = [
  { id: 'getting-started', label: 'Início Rápido', icon: <Zap size={18} />, color: '#f59e0b' },
  { id: 'students', label: 'Alunos & Frequência', icon: <Users size={18} />, color: '#3b82f6' },
  { id: 'cameras', label: 'Câmeras & Visão', icon: <Camera size={18} />, color: '#06b6d4' },
  { id: 'security', label: 'Segurança & SOC', icon: <ShieldCheck size={18} />, color: '#10b981' },
  { id: 'ai', label: 'Inteligência Artificial', icon: <Brain size={18} />, color: '#8b5cf6' },
  { id: 'reports', label: 'Relatórios', icon: <BarChart3 size={18} />, color: '#ec4899' },
  { id: 'config', label: 'Configurações', icon: <Settings size={18} />, color: '#64748b' },
  { id: 'alerts', label: 'Alertas & Notificações', icon: <Bell size={18} />, color: '#f97316' },
];

const ARTICLES: HelpArticle[] = [
  // ── INÍCIO RÁPIDO ──
  {
    id: 'qs-1', title: 'Primeiro acesso — O que fazer?',
    content: `Após o login inicial (usuário: **admin**, senha: **EagleSovereign2026#Admin**), siga estes passos:\n\n**1. Configurar a escola**\nVá em ⚙️ **Configurações → Geral** e preencha o nome e CNPJ da sua instituição.\n\n**2. Cadastrar turmas**\nAcesse o **Portal Administrativo → Turmas** e crie as turmas do período letivo.\n\n**3. Cadastrar alunos**\nEm **Gestão de Alunos**, cadastre manualmente ou importe uma planilha Excel (botão "Importar").\n\n**4. Adicionar câmeras**\nNo **Portal de Segurança → Câmeras**, adicione câmeras RTSP com o endereço:\n\`rtsp://usuario:senha@IP:554/stream1\`\n\n**5. Configurar IA**\nEm ⚙️ **Configurações → IA**, insira sua chave do Google AI Studio para habilitar relatórios inteligentes.`,
    category: 'getting-started', tags: ['setup', 'primeiro acesso', 'configuração'], roles: ['admin', 'coordinator'], isNew: false,
  },
  {
    id: 'qs-2', title: 'Como navegar entre os portais?',
    content: `O Áquila Pro organiza suas funcionalidades em **Portais por Perfil**:\n\n- **Portal Administrativo** — Gestão completa da escola (turmas, alunos, financeiro, governança).\n- **Portal do Professor** — Chamada inteligente, material pedagógico, diário de classe.\n- **Portal de Segurança** — Câmeras ao vivo, SOC, alertas e reconhecimento facial.\n- **Portal de Coordenação** — Evasão, comportamento, relatórios pedagógicos.\n- **Portal dos Pais** — Frequência dos filhos, mensagens e boletins.\n\nUse o **menu lateral esquerdo** para alternar entre os portais. O botão **←** (seta) no topo de cada tela sempre retorna ao Dashboard principal.`,
    category: 'getting-started', tags: ['navegação', 'portais', 'menu'], roles: ['admin', 'coordinator', 'teacher', 'secretary', 'security'],
  },
  {
    id: 'qs-3', title: 'Como criar novos usuários?',
    content: `Acesse **Portal Administrativo → Usuários** e clique em **"Adicionar Usuário"**.\n\nPreencha:\n- **Nome completo**\n- **Login** (será usado para acessar o sistema)\n- **Senha** (mínimo 6 caracteres)\n- **Perfil**: Administrador, Coordenador, Professor, Secretária, Segurança ou Pais\n\nCada perfil tem permissões específicas conforme a **Matriz RBAC** do sistema. Somente Administradores podem criar outros Administradores.`,
    category: 'getting-started', tags: ['usuários', 'login', 'permissões'], roles: ['admin'],
  },

  // ── ALUNOS & FREQUÊNCIA ──
  {
    id: 'stu-1', title: 'Como cadastrar alunos?',
    content: `Existem **duas formas** de cadastrar alunos:\n\n**Cadastro Manual**\n1. Vá em **Gestão de Alunos** no menu principal.\n2. Clique no botão **"+"** no canto superior direito.\n3. Preencha: Nome, WhatsApp dos pais, Turma.\n4. (Opcional) Faça upload da foto do aluno.\n\n**Importação em Massa (Excel)**\n1. Vá em **Portal Administrativo → Importar**.\n2. Faça upload de uma planilha .xlsx com colunas: Nome, Telefone, Turma.\n3. O sistema validará os dados e importará automaticamente.`,
    category: 'students', tags: ['cadastro', 'matrícula', 'importação'], roles: ['admin', 'secretary'],
  },
  {
    id: 'stu-2', title: 'Como funciona a chamada inteligente?',
    content: `O Áquila Pro faz a **chamada automaticamente** através de reconhecimento facial:\n\n1. As câmeras capturam os alunos ao entrarem na sala.\n2. O sistema compara com as fotos cadastradas.\n3. A presença é registrada automaticamente no banco de dados.\n\n**Chamada manual** também está disponível no **Portal do Professor → Chamada**, onde o docente pode marcar presença/falta manualmente.\n\n**Validação Científica**: O módulo de Auditoria Cruzada compara a chamada facial com a chamada manual para detectar discrepâncias.`,
    category: 'students', tags: ['chamada', 'frequência', 'presença', 'facial'], roles: ['teacher', 'coordinator'],
  },
  {
    id: 'stu-3', title: 'Como gerar relatório pedagógico por IA?',
    content: `Na **Gestão de Alunos**, cada aluno tem um botão com ícone de **varinha mágica (✨)**.\n\n1. Clique no botão ✨ ao lado do nome do aluno.\n2. Aguarde a IA processar os dados de frequência e comportamento.\n3. Um relatório pedagógico será gerado automaticamente.\n4. Você pode **editar** o texto antes de enviar.\n5. Use o botão **"Copiar"** para colar em um e-mail ou WhatsApp.\n\n⚠️ **Requisito**: A chave do Google AI Studio deve estar configurada em **Configurações → IA**.`,
    category: 'students', tags: ['relatório', 'IA', 'pedagógico', 'gemini'], roles: ['coordinator', 'teacher'], isNew: true,
  },

  // ── CÂMERAS ──
  {
    id: 'cam-1', title: 'Como adicionar câmeras RTSP?',
    content: `1. Acesse **Portal de Segurança → Configuração de Câmeras**.\n2. Clique em **"Adicionar Câmera"**.\n3. Preencha:\n   - **Nome**: Ex: "Entrada Principal"\n   - **URL RTSP**: \`rtsp://admin:senha@192.168.1.100:554/stream1\`\n   - **Localização**: Selecione a sala/área\n4. Clique em **"Salvar"**.\n5. O feed ao vivo aparecerá automaticamente no dashboard de câmeras.\n\n**Dica**: Use a função **"Descobrir Câmeras"** (ONVIF) para detectar câmeras na rede automaticamente.`,
    category: 'cameras', tags: ['câmera', 'RTSP', 'ONVIF', 'instalação'], roles: ['admin', 'security'],
  },
  {
    id: 'cam-2', title: 'A câmera está offline — O que fazer?',
    content: `Se uma câmera aparece como **offline** (ícone vermelho):\n\n1. **Verifique a conexão de rede** — A câmera precisa estar na mesma rede do servidor Áquila.\n2. **Teste o endereço RTSP** — Abra o VLC Media Player e cole a URL RTSP para verificar se o stream funciona.\n3. **Verifique credenciais** — Usuário e senha da câmera podem ter sido alterados.\n4. **Reinicie a câmera** — Desligue e ligue novamente.\n5. **Verifique o firewall** — A porta 554 (RTSP) precisa estar liberada.\n\nSe o problema persistir, acesse **Portal de Segurança → Diagnóstico** para logs detalhados.`,
    category: 'cameras', tags: ['offline', 'erro', 'conexão', 'troubleshooting'], roles: ['admin', 'security'],
  },

  // ── SEGURANÇA ──
  {
    id: 'sec-1', title: 'Como funciona o Centro de Comando (SOC)?',
    content: `O **SOC (Security Operations Center)** é o painel central de segurança:\n\n- **Feed ao vivo** — Visualize todas as câmeras simultaneamente.\n- **Alertas em tempo real** — Pessoas não identificadas, comportamentos suspeitos.\n- **Mapa de calor** — Movimentação no campus ao longo do dia.\n- **Linha do tempo** — Histórico de eventos por hora.\n\nAcesse via **Portal de Segurança → Central de Comando**.`,
    category: 'security', tags: ['SOC', 'comando', 'monitoramento', 'segurança'], roles: ['admin', 'security'],
  },
  {
    id: 'sec-2', title: 'Protocolo de Invasão — Lockdown',
    content: `Em caso de **emergência de segurança**:\n\n1. No **Centro de Comando**, clique no botão **🔴 LOCKDOWN**.\n2. O sistema travará todas as portas automatizadas (se integradas via IoT).\n3. Um alerta silencioso será enviado via WhatsApp para todos os coordenadores.\n4. As câmeras entrarão em modo de **gravação contínua de alta resolução**.\n5. O mapa de evacuação será exibido automaticamente.\n\n⚠️ **Importante**: Este protocolo deve ser testado periodicamente em simulações.`,
    category: 'security', tags: ['lockdown', 'emergência', 'invasão', 'protocolo'], roles: ['admin', 'security'],
  },

  // ── INTELIGÊNCIA ARTIFICIAL ──
  {
    id: 'ai-1', title: 'Como configurar a chave do Google Gemini?',
    content: `O Áquila Pro usa o **Google Gemini** para análises pedagógicas e visão computacional.\n\n1. Acesse **[AI Studio](https://aistudio.google.com/app/apikey)** e crie uma API Key.\n2. No Áquila, vá em ⚙️ **Configurações → IA**.\n3. Cole a chave no campo **"Gemini API Key"** (começa com \`AIza...\`).\n4. Clique em **"Salvar Configurações"**.\n\nA chave habilita:\n- ✅ Relatórios pedagógicos automáticos\n- ✅ Chat com o Córtex (Student AI Lab)\n- ✅ Análise de quadro branco (visão computacional)\n- ✅ Busca com Google Search Grounding`,
    category: 'ai', tags: ['gemini', 'api key', 'IA', 'configuração'], roles: ['admin'], isNew: true,
  },
  {
    id: 'ai-2', title: 'O Student AI Lab — Chat Pedagógico',
    content: `O **Student AI Lab** é um assistente de IA integrado ao contexto da escola:\n\n1. Acesse pelo menu lateral → **"AI Lab"**.\n2. Digite sua pergunta no chat.\n3. O Córtex responde usando:\n   - Dados locais da escola (frequência, notas, comportamento)\n   - Busca na internet (Google Search Grounding)\n\n**Exemplos de uso:**\n- "Quais alunos estão em risco de evasão?"\n- "Gere um resumo da frequência do 9ºA esta semana"\n- "Sugira atividades para engajar alunos desmotivados"`,
    category: 'ai', tags: ['chat', 'córtex', 'assistente', 'IA'], roles: ['coordinator', 'teacher'], isNew: true,
  },

  // ── RELATÓRIOS ──
  {
    id: 'rep-1', title: 'Como gerar relatórios de frequência?',
    content: `1. Acesse **Relatórios** no menu principal.\n2. Selecione o tipo: **Frequência por Turma**, **Individual** ou **Consolidado**.\n3. Defina o período (semana, mês, bimestre).\n4. Clique em **"Gerar"**.\n5. O relatório pode ser **exportado em PDF** ou **enviado por WhatsApp**.\n\n**Relatório Executivo**: O **Cockpit Executivo** (menu → Executive) exibe um painel visual com ROI, horas economizadas e score pedagógico.`,
    category: 'reports', tags: ['relatório', 'frequência', 'exportar', 'PDF'], roles: ['admin', 'coordinator', 'secretary'],
  },

  // ── CONFIGURAÇÕES ──
  {
    id: 'cfg-1', title: 'Privacidade e LGPD — Como funciona?',
    content: `O Áquila Pro foi projetado para **conformidade total com a LGPD**:\n\n- **Processamento local**: Nenhuma foto ou dado biométrico sai da rede da escola.\n- **Criptografia**: Vetores faciais protegidos com AES-256-GCM.\n- **Consentimento**: Biometria bloqueada para alunos sem Termo assinado.\n- **Retenção de dados**: Configure em **Configurações → Segurança** o prazo de retenção.\n- **Limpeza automática**: Dados expirados são removidos automaticamente.\n\nO termo de consentimento pode ser visualizado em **Configurações → Segurança → Ver Termo**.`,
    category: 'config', tags: ['LGPD', 'privacidade', 'consentimento', 'criptografia'], roles: ['admin'],
  },
  {
    id: 'cfg-2', title: 'Como fazer backup do banco de dados?',
    content: `**Backup Automático**\n1. Vá em ⚙️ **Configurações → Backup**.\n2. Ative **"Backup Automático"**.\n3. Defina o horário (recomendado: 02:00).\n\n**Backup Manual**\nO banco de dados SQLite fica em:\n\`C:\\Users\\[Usuario]\\AppData\\Local\\AquilaPro\\aquila.db\`\n\nCopie este arquivo para um local seguro.\n\n**Backup na Nuvem (AWS S3)**\nEm **Configurações → Backup**, configure suas credenciais AWS para backups automáticos criptografados.`,
    category: 'config', tags: ['backup', 'banco de dados', 'AWS', 'segurança'], roles: ['admin'],
  },

  // ── ALERTAS ──
  {
    id: 'alt-1', title: 'Como configurar alertas de WhatsApp?',
    content: `O Áquila Pro envia alertas automáticos via **WhatsApp** (Evolution API):\n\n1. Vá em **Portal Administrativo → WhatsApp**.\n2. Escaneie o QR Code com o WhatsApp do celular da escola.\n3. Configure os grupos:\n   - **Grupo de Notas** — Recebe alertas pedagógicos.\n   - **Grupo de Segurança** — Recebe alertas de câmeras e intrusão.\n4. Os alertas são enviados automaticamente quando:\n   - Um aluno falta 3 dias seguidos\n   - Uma pessoa não identificada é detectada\n   - Uma câmera fica offline`,
    category: 'alerts', tags: ['WhatsApp', 'alertas', 'notificação', 'automação'], roles: ['admin', 'coordinator'],
  },
];

// ─── Keyboard Shortcuts ────────────────────────────────────
const SHORTCUTS = [
  { keys: 'Ctrl + K', desc: 'Busca rápida global' },
  { keys: 'Ctrl + 1-9', desc: 'Alternar entre abas do portal' },
  { keys: 'Esc', desc: 'Fechar modal / voltar' },
  { keys: 'F11', desc: 'Tela cheia' },
];

// ─── Component ─────────────────────────────────────────────
const HelpCenter: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState('all');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const filteredArticles = useMemo(() => {
    let result = ARTICLES;
    if (activeRole !== 'all') {
      result = result.filter((a) => a.roles.includes(activeRole));
    }
    if (activeCategory) {
      result = result.filter((a) => a.category === activeCategory);
    }
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query) ||
          a.tags.some((t) => t.toLowerCase().includes(query)),
      );
    }
    return result;
  }, [searchTerm, activeCategory, activeRole]);

  const toggleArticle = (id: string) => {
    setExpandedArticle(expandedArticle === id ? null : id);
  };

  return (
    <div className="help-center">
      {/* Header */}
      <div className="hc-header">
        <div className="hc-header-left">
          {onBack && (
            <button onClick={onBack} className="hc-back-btn" title="Voltar ao Dashboard">
              <ArrowLeft size={22} />
            </button>
          )}
          <div className="hc-header-icon">
            <BookOpen size={28} />
          </div>
          <div className="hc-header-text">
            <h1 className="hc-title">Central de Ajuda Áquila</h1>
            <p className="hc-subtitle">
              Guias práticos, manuais por perfil e respostas rápidas.
            </p>
          </div>
        </div>
        <div className="hc-version-badge">v2.1.0</div>
      </div>

      {/* Search */}
      <div className="hc-search-container">
        <div className="hc-search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar: câmera offline, relatório, cadastro de aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="hc-search-input"
            title="Buscar na Central de Ajuda"
            aria-label="Buscar na Central de Ajuda"
          />
          {searchTerm && (
            <button className="hc-search-clear" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
        {searchTerm && (
          <p className="hc-search-results">
            {filteredArticles.length} resultado{filteredArticles.length !== 1 ? 's' : ''} encontrado{filteredArticles.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Role Filter */}
      <div className="hc-role-filter">
        <span className="hc-role-label">Manual para:</span>
        {ROLES.map((role) => (
          <button
            key={role.id}
            className={`hc-role-pill ${activeRole === role.id ? 'hc-role-active' : ''}`}
            onClick={() => setActiveRole(role.id)}
          >
            {role.icon}
            <span>{role.label}</span>
          </button>
        ))}
      </div>

      {/* Category Pills */}
      <div className="hc-categories">
        <button
          className={`hc-cat-pill ${!activeCategory ? 'hc-cat-active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          Todos
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`hc-cat-pill ${activeCategory === cat.id ? 'hc-cat-active' : ''}`}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            style={{ '--cat-color': cat.color } as React.CSSProperties}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Articles (FAQ Accordion) */}
      <div className="hc-articles">
        {filteredArticles.length === 0 ? (
          <div className="hc-empty">
            <Search size={48} className="hc-empty-icon" />
            <p>Nenhum artigo encontrado{searchTerm ? ` para "${searchTerm}"` : ''}.</p>
            <button className="hc-btn-clear-search" onClick={() => { setSearchTerm(''); setActiveCategory(null); setActiveRole('all'); }}>
              Limpar filtros
            </button>
          </div>
        ) : (
          filteredArticles.map((article) => {
            const isExpanded = expandedArticle === article.id;
            const cat = CATEGORIES.find((c) => c.id === article.category);

            return (
              <div key={article.id} className={`hc-article ${isExpanded ? 'hc-article-expanded' : ''}`}>
                <button className="hc-article-header" onClick={() => toggleArticle(article.id)}>
                  <div className="hc-article-left">
                    <div className="hc-article-icon" style={{ color: cat?.color }}>
                      {cat?.icon}
                    </div>
                    <div className="hc-article-title-area">
                      <span className="hc-article-title">{article.title}</span>
                      {article.isNew && <span className="hc-new-badge">NOVO</span>}
                    </div>
                  </div>
                  <div className="hc-article-meta">
                    <div className="hc-article-roles">
                      {article.roles.slice(0, 3).map(r => {
                        const role = ROLES.find(rl => rl.id === r);
                        return role ? <span key={r} className="hc-role-micro" title={role.label}>{role.icon}</span> : null;
                      })}
                    </div>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="hc-article-body">
                    <div className="hc-article-content" dangerouslySetInnerHTML={{
                      __html: article.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/`(.*?)`/g, '<code>$1</code>')
                        .replace(/\n/g, '<br/>')
                    }} />
                    <div className="hc-article-tags">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="hc-tag"
                          onClick={(e) => { e.stopPropagation(); setSearchTerm(tag); }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Shortcuts Section */}
      <div className="hc-shortcuts-section">
        <button className="hc-shortcuts-toggle" onClick={() => setShowShortcuts(!showShortcuts)}>
          <Keyboard size={18} />
          <span>Atalhos do Teclado</span>
          {showShortcuts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showShortcuts && (
          <div className="hc-shortcuts-grid">
            {SHORTCUTS.map((s, i) => (
              <div key={i} className="hc-shortcut-item">
                <kbd className="hc-kbd">{s.keys}</kbd>
                <span>{s.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="hc-footer">
        <div className="hc-footer-card">
          <MessageSquare size={24} />
          <div>
            <h3>Suporte Técnico</h3>
            <p>suporte@aquilapro.ai</p>
          </div>
          <button className="hc-footer-btn" onClick={() => {
            if ((window as any).aquila) {
              (window as any).aquila.invoke('shell:open-external', 'mailto:suporte@aquilapro.ai');
            }
          }}>
            <ExternalLink size={14} /> Contato
          </button>
        </div>
        <div className="hc-footer-card">
          <Lightbulb size={24} />
          <div>
            <h3>Dúvidas Frequentes</h3>
            <p>{ARTICLES.length} artigos disponíveis</p>
          </div>
          <button className="hc-footer-btn" onClick={() => { setActiveCategory(null); setActiveRole('all'); setSearchTerm(''); }}>
            <CheckCircle2 size={14} /> Ver todos
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
