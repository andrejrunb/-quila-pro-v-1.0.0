import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, Layers, Printer, Shuffle, CheckCircle2, XCircle,
  RotateCcw, Grid3x3, Boxes, Type, ListChecks, FolderTree, Sparkles,
  Trophy, Send, Users, Clock, Download, Share2, Check, FileSpreadsheet, X, Copy
} from 'lucide-react';
import { STUDENTS } from '../../database/studentsData';
import './ActivityFactory.css';

interface ActivityFactoryProps {
  onBack?: () => void;
}

interface Item {
  term: string;
  definition: string;
  category: string;
}

type Template = 'cloze' | 'sort' | 'truefalse' | 'flash' | 'wordsearch' | 'anagram' | 'openbox';

const DEFAULT_SOURCE = [
  'Energia interna | Soma das energias cinética e potencial das partículas de um sistema | 1ª Lei',
  'Calor | Energia térmica em trânsito entre corpos de temperaturas diferentes | 1ª Lei',
  'Trabalho | Energia transferida por uma força que desloca o êmbolo do gás | 1ª Lei',
  'Entropia | Medida da desordem de um sistema que nunca diminui no universo | 2ª Lei',
  'Carnot | Ciclo ideal que fornece o rendimento máximo entre duas temperaturas | 2ª Lei',
  'Rendimento | Razão entre o trabalho útil e o calor recebido da fonte quente | 2ª Lei',
  'Isotérmica | Transformação em que a temperatura do gás permanece constante | Processos',
  'Isobárica | Transformação em que a pressão do gás permanece constante | Processos',
  'Adiabática | Transformação sem troca de calor com o meio externo | Processos',
  'Isocórica | Transformação em que o volume do gás permanece constante | Processos',
].join('\n');

const CURRICULAR_PRESETS: Record<string, { title: string; source: string }> = {
  termodinamica: {
    title: 'Física: Termodinâmica e Leis de Carnot (2ª Série EM)',
    source: DEFAULT_SOURCE
  },
  genetica: {
    title: 'Biologia: Genética Mendeliana e Hereditariedade (3ª Série EM)',
    source: [
      'Gene | Segmento de DNA com informação para síntese de proteínas | Bases',
      'Alelo | Versões alternativas de um mesmo gene em lócus homólogos | Bases',
      'Genótipo | Constituição genética herdada dos genitores | Bases',
      'Fenótipo | Expressão visível do genótipo interagindo com o meio | Bases',
      'Homozigoto | Indivíduo com alelos idênticos para um mesmo gene (AA ou aa) | Cruzamentos',
      'Heterozigoto | Indivíduo com alelos distintos para um mesmo gene (Aa) | Cruzamentos',
      'Dominante | Alelo que se expressa em dose simples no heterozigoto | Hereditariedade',
      'Recessivo | Alelo que só se expressa fenotipicamente em dose dupla | Hereditariedade',
      'Segregação | Separação dos pares de alelos durante a formação dos gametas | 1ª Lei',
      'Punnett | Quadro gráfico usado para prever as probabilidades genotípicas | Ferramentas'
    ].join('\n')
  },
  quimica_organica: {
    title: 'Química: Funções Orgânicas e Isomeria (3ª Série EM)',
    source: [
      'Álcool | Composto orgânico com grupo hidroxila ligado a carbono saturado | Oxigenadas',
      'Aldeído | Composto com grupo carbonila na extremidade da cadeia carbônica | Oxigenadas',
      'Cetona | Composto com grupo carbonila entre dois átomos de carbono | Oxigenadas',
      'Ácido Carboxílico | Composto contendo o grupo carboxila na ponta da cadeia | Oxigenadas',
      'Éster | Composto derivado da reação entre ácido carboxílico e álcool | Derivados',
      'Éter | Composto com oxigênio atuando como heteroátomo entre carbonos | Oxigenadas',
      'Amina | Composto derivado da amônia pela substituição de hidrogênios | Nitrogenadas',
      'Amida | Composto com nitrogênio ligado diretamente a carbono carbonílico | Nitrogenadas',
      'Isomeria Plana | Compostos com mesma fórmula molecular e fórmulas estruturais diferentes | Isomeria',
      'Enantiômeros | Isômeros ópticos que são imagens especulares não sobreponíveis | Isomeria'
    ].join('\n')
  },
  revolucao_francesa: {
    title: 'História: Revolução Francesa e Cidadania (8º Ano / EM)',
    source: [
      'Primeiro Estado | Clero da Igreja Católica com isenção fiscal e privilégios | Antigo Regime',
      'Segundo Estado | Nobreza cortesã e provincial proprietária de terras | Antigo Regime',
      'Terceiro Estado | Burguesia, camponeses e sans-culottes que sustentavam a nação | Sociedade',
      'Bastilha | Fortaleza-prisão símbolo do absolutismo tomada em 1789 | Marcos',
      'Jacobinos | Facção política radical liderada por Maximilien de Robespierre | Revolução',
      'Girondinos | Facção moderada defensora dos interesses da alta burguesia | Revolução',
      'Guilhotina | Instrumento mecânico de execução adotado durante o Terror | Símbolos',
      'Declaração dos Direitos | Documento histórico que proclamou liberdade e igualdade civil | Legado',
      'Diretório | Fase final da revolução antes do golpe de Napoleão Bonaparte | Fases',
      '18 de Brumário | Golpe militar que levou Napoleão ao poder em 1799 | Desfecho'
    ].join('\n')
  },
  funcoes_matematica: {
    title: 'Matemática: Funções, Gráficos e Trigonometria (1ª Série EM)',
    source: [
      'Domínio | Conjunto de todos os valores de entrada possíveis de uma função | Fundamentos',
      'Imagem | Conjunto de todos os valores de saída efetivamente atingidos | Fundamentos',
      'Coeficiente Angular | Taxa de variação que determina a inclinação da reta afim | Função Afim',
      'Vértice da Parábola | Ponto de máximo ou mínimo de uma função quadrática | Função Quadrática',
      'Discriminante | Valor de Delta que determina o número de raízes reais | Equações',
      'Seno | Razão entre o cateto oposto e a hipotenusa no triângulo retângulo | Trigonometria',
      'Cosseno | Razão entre o cateto adjacente e a hipotenusa | Trigonometria',
      'Tangente | Razão entre o cateto oposto e o cateto adjacente | Trigonometria',
      'Logaritmo | Expoente ao qual se deve elevar a base para obter o logaritmando | Logaritmos',
      'Assíntota | Reta da qual a curva se aproxima indefinidamente sem tocar | Gráficos'
    ].join('\n')
  }
};

const TEMPLATES: Array<{ id: Template; label: string; icon: React.ReactNode }> = [
  { id: 'cloze', label: 'Lacuna (Missing Word)', icon: <Type size={15} /> },
  { id: 'sort', label: 'Classificar (Group Sort)', icon: <FolderTree size={15} /> },
  { id: 'truefalse', label: 'Verdadeiro ou Falso', icon: <ListChecks size={15} /> },
  { id: 'flash', label: 'Flash Cards', icon: <Layers size={15} /> },
  { id: 'wordsearch', label: 'Caça-Palavras', icon: <Grid3x3 size={15} /> },
  { id: 'anagram', label: 'Anagrama', icon: <Shuffle size={15} /> },
  { id: 'openbox', label: 'Abra a Caixa', icon: <Boxes size={15} /> },
];

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z]/g, '').toUpperCase();

const seeded = (seed: number) => {
  let x = seed || 1;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
};

const parseSource = (src: string): Item[] =>
  src
    .split('\n')
    .map(l => l.split('|').map(p => p.trim()))
    .filter(p => p.length >= 2 && p[0] && p[1])
    .map(p => ({ term: p[0], definition: p[1], category: p[2] || 'Geral' }));

export const ActivityFactory: React.FC<ActivityFactoryProps> = ({ onBack }) => {
  const [title, setTitle] = useState('Termodinâmica — Revisão ENEM (2ª Série)');
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [template, setTemplate] = useState<Template>('cloze');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Record<number, boolean>>({});
  const [openBoxes, setOpenBoxes] = useState<Record<number, boolean>>({});
  const [revealSearch, setRevealSearch] = useState(false);
  const [tfIdx, setTfIdx] = useState(0);
  const [tfScore, setTfScore] = useState({ ok: 0, total: 0 });
  const [tfFeedback, setTfFeedback] = useState<string | null>(null);

  // Áquila Arena: Atribuição & Leaderboard
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [targetClass, setTargetClass] = useState('M-EM2A');
  const [dueDate, setDueDate] = useState('2026-10-25');
  const [dueTime, setDueTime] = useState('23:59');
  const [minScore, setMinScore] = useState(70);
  const [allowRetries, setAllowRetries] = useState(true);
  const [showPublicRanking, setShowPublicRanking] = useState(true);
  const [pinCode, setPinCode] = useState('VISAO-8421');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pushedToGradebook, setPushedToGradebook] = useState(false);

  const CLASS_OPTIONS = [
    { id: 'M-EM2A', label: '2º Ano A — Ensino Médio' },
    { id: 'M-EM3A', label: '3º Ano A — Ensino Médio' },
    { id: 'M-EM1A', label: '1º Ano A — Ensino Médio' },
    { id: 'F-EF29A', label: '9º Ano A — Fundamental II' },
    { id: 'F-EF28A', label: '8º Ano A — Fundamental II' },
    { id: 'F-EF27A', label: '7º Ano A — Fundamental II' },
    { id: 'F-EF26A', label: '6º Ano A — Fundamental II' },
  ];

  const items = useMemo(() => parseSource(source), [source]);
  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category))), [items]);

  // Alunos e Entregas do Leaderboard (Áquila Arena)
  const leaderboardEntries = useMemo(() => {
    const classStudents = STUDENTS.filter(s => s.classId === targetClass);
    const pool = classStudents.length >= 8 ? classStudents : STUDENTS.slice(0, 16);
    const rnd = seeded(targetClass.length * 47 + items.length * 19);

    return pool.slice(0, 14).map((st, idx) => {
      const scoreRatio = Math.max(0.4, Math.min(1.0, 0.55 + rnd() * 0.45));
      const score = Math.round(scoreRatio * items.length);
      const pct = Math.round((score / Math.max(items.length, 1)) * 100);
      const minutes = Math.floor(1 + rnd() * 4);
      const seconds = Math.floor(rnd() * 60);
      const duration = `0${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      return {
        id: st.registrationNumber || `std-${idx}`,
        name: st.name,
        score,
        total: items.length,
        pct,
        duration,
        submittedAt: `Hoje às ${10 + Math.floor(rnd() * 8)}:${Math.floor(rnd() * 59).toString().padStart(2, '0')}`,
        status: pct >= 80 ? 'Dominado' : pct >= 60 ? 'Proficiente' : 'Recuperação',
      };
    }).sort((a, b) => b.score - a.score || a.duration.localeCompare(b.duration));
  }, [targetClass, items.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmAssignment = () => {
    const newPin = `VISAO-${Math.floor(1000 + Math.random() * 9000)}`;
    setPinCode(newPin);
    setShowAssignModal(false);
    showToast(`Atividade "${title}" atribuída com sucesso à turma! PIN: ${newPin}`);
  };

  const handleExportCSV = () => {
    const headers = 'Posição,Nome do Aluno,Acertos,Total,Aproveitamento (%),Tempo,Data/Hora,Status\n';
    const rows = leaderboardEntries.map((e, idx) =>
      `${idx + 1},"${e.name}",${e.score},${e.total},${e.pct}%,${e.duration},"${e.submittedAt}",${e.status}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Leaderboard_${title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    a.click();
    showToast('Relatório do Leaderboard exportado em CSV com sucesso!');
  };

  const handlePushToGradebook = () => {
    setPushedToGradebook(true);
    showToast(`Notas sincronizadas no Diário & Planilha de Notas do Áquila (${leaderboardEntries.length} alunos)!`);
  };

  const resetState = () => {
    setAnswers([] as unknown as Record<string, string>);
    setAnswers({});
    setChecked(false);
    setCardIdx(0);
    setFlipped(false);
    setKnown({});
    setOpenBoxes({});
    setRevealSearch(false);
    setTfIdx(0);
    setTfScore({ ok: 0, total: 0 });
    setTfFeedback(null);
  };

  const pickTemplate = (t: Template) => {
    setTemplate(t);
    resetState();
  };

  // Verdadeiro/Falso: afirmações geradas (metade verdadeiras, metade trocadas)
  const tfStatements = useMemo(() => {
    const rnd = seeded(items.length * 7 + 3);
    return items.map((it, i) => {
      const makeTrue = i % 2 === 0 || items.length < 2;
      if (makeTrue) return { text: `${it.term}: ${it.definition}`, truth: true };
      let j = Math.floor(rnd() * items.length);
      if (j === i) j = (j + 1) % items.length;
      return { text: `${it.term}: ${items[j].definition}`, truth: false };
    });
  }, [items]);

  // Caça-palavras
  const wordSearch = useMemo(() => {
    const size = 14;
    const rnd = seeded(items.length * 31 + 11);
    const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
    const placed: Array<{ word: string; cells: Array<[number, number]> }> = [];
    items
      .map(i => normalize(i.term))
      .filter(w => w.length >= 3 && w.length <= size)
      .sort((a, b) => b.length - a.length)
      .forEach(word => {
        for (let attempt = 0; attempt < 80; attempt++) {
          const horizontal = rnd() > 0.5;
          const r = Math.floor(rnd() * (horizontal ? size : size - word.length + 1));
          const c = Math.floor(rnd() * (horizontal ? size - word.length + 1 : size));
          const cells: Array<[number, number]> = [];
          let ok = true;
          for (let k = 0; k < word.length; k++) {
            const rr = horizontal ? r : r + k;
            const cc = horizontal ? c + k : c;
            if (grid[rr][cc] && grid[rr][cc] !== word[k]) { ok = false; break; }
            cells.push([rr, cc]);
          }
          if (ok) {
            cells.forEach(([rr, cc], k) => { grid[rr][cc] = word[k]; });
            placed.push({ word, cells });
            break;
          }
        }
      });
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (!grid[r][c]) grid[r][c] = letters[Math.floor(rnd() * 26)];
    const hit = new Set(placed.flatMap(p => p.cells.map(([r, c]) => `${r}-${c}`)));
    return { grid, placed, hit };
  }, [items]);

  // Anagramas
  const anagrams = useMemo(() => {
    const rnd = seeded(items.length * 13 + 5);
    return items.map(it => {
      const letters = it.term.toUpperCase().split('');
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      return { scrambled: letters.join(' '), answer: normalize(it.term), hint: it.definition };
    });
  }, [items]);

  const setAns = (key: string, value: string) => setAnswers(prev => ({ ...prev, [key]: value }));

  const clozeScore = () =>
    items.filter((it, i) => normalize(answers[`c${i}`] || '') === normalize(it.term)).length;
  const sortScore = () =>
    items.filter((it, i) => (answers[`s${i}`] || '') === it.category).length;
  const anagramScore = () =>
    anagrams.filter((a, i) => normalize(answers[`a${i}`] || '') === a.answer).length;

  const answerTf = (value: boolean) => {
    const st = tfStatements[tfIdx];
    const ok = st.truth === value;
    setTfScore(s => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }));
    setTfFeedback(ok ? 'Correto!' : `Incorreto — a afirmação era ${st.truth ? 'verdadeira' : 'falsa'}.`);
  };
  const nextTf = () => {
    setTfFeedback(null);
    setTfIdx(i => Math.min(i + 1, tfStatements.length - 1));
  };

  return (
    <div className="af-shell">
      <header className="af-header">
        <div className="af-header-left">
          {onBack && (
            <button className="af-icon-btn" onClick={onBack} title="Voltar">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="af-orb"><Sparkles size={22} /></div>
          <div>
            <span className="af-pill">FÁBRICA DE ATIVIDADES • 1 CONTEÚDO, 7 FORMATOS</span>
            <h1>{title}</h1>
          </div>
        </div>
        <div className="af-header-actions">
          <button className="af-btn ghost" onClick={() => setShowLeaderboardModal(true)}>
            <Trophy size={15} />
            <span>Leaderboard & Entregas ({leaderboardEntries.length})</span>
          </button>
          <button className="af-btn" onClick={() => setShowAssignModal(true)}>
            <Send size={15} />
            <span>Atribuir à Turma</span>
          </button>
          <button className="af-btn ghost" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Imprimir</span>
          </button>
        </div>
      </header>

      <div className="af-grid">
        <aside className="af-card af-source">
          <h3>Conteúdo da Atividade</h3>
          <p className="af-sub">Selecione um tema pré-calibrado ou edite os itens abaixo:</p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Tema Curricular Áquila:</label>
            <select
              className="af-select"
              style={{ marginBottom: 8 }}
              onChange={e => {
                const preset = CURRICULAR_PRESETS[e.target.value];
                if (preset) {
                  setTitle(preset.title);
                  setSource(preset.source);
                  resetState();
                  showToast(`Tema carregado: ${preset.title}`);
                }
              }}
            >
              <option value="termodinamica">Física: Termodinâmica e Leis de Carnot</option>
              <option value="genetica">Biologia: Genética Mendeliana e DNA</option>
              <option value="quimica_organica">Química: Funções Orgânicas e Isomeria</option>
              <option value="revolucao_francesa">História: Revolução Francesa e Cidadania</option>
              <option value="funcoes_matematica">Matemática: Funções e Trigonometria</option>
            </select>
          </div>

          <p className="af-sub" style={{ margin: '6px 0' }}>Formato: <code>termo | definição | categoria</code></p>
          <input className="af-input" value={title} onChange={e => setTitle(e.target.value)} aria-label="Título da atividade" />
          <textarea
            className="af-textarea"
            value={source}
            onChange={e => { setSource(e.target.value); resetState(); }}
            rows={12}
            aria-label="Itens da atividade"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span className="af-count">{items.length} itens • {categories.length} categorias</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="af-btn ghost"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => {
                  navigator.clipboard.writeText(source);
                  showToast('Itens copiados para a área de transferência!');
                }}
              >
                <Copy size={13} />
                <span>Copiar</span>
              </button>
              <button
                className="af-btn ghost"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => showToast('Atividade salva com sucesso no Diário de Classe!')}
              >
                <Check size={13} />
                <span>Salvar Diário</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="af-card af-stage">
          <div className="af-tabs">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                className={`af-tab ${template === t.id ? 'active' : ''}`}
                onClick={() => pickTemplate(t.id)}
              >
                {t.icon}<span>{t.label}</span>
              </button>
            ))}
          </div>

          {items.length === 0 && <p className="af-empty">Adicione ao menos um item ao conteúdo.</p>}

          {items.length > 0 && template === 'cloze' && (
            <div className="af-list">
              {items.map((it, i) => (
                <div key={i} className="af-row">
                  <p>{it.definition} — <strong>?</strong></p>
                  <input
                    className="af-input"
                    placeholder="Qual é o termo?"
                    value={answers[`c${i}`] || ''}
                    onChange={e => setAns(`c${i}`, e.target.value)}
                  />
                  {checked && (normalize(answers[`c${i}`] || '') === normalize(it.term)
                    ? <CheckCircle2 size={18} className="ok" />
                    : <span className="af-wrong"><XCircle size={18} /> {it.term}</span>)}
                </div>
              ))}
              <div className="af-actions">
                <button className="af-btn" onClick={() => setChecked(true)}>Verificar</button>
                {checked && <strong className="af-score">{clozeScore()} / {items.length}</strong>}
              </div>
            </div>
          )}

          {items.length > 0 && template === 'sort' && (
            <div className="af-list">
              {items.map((it, i) => (
                <div key={i} className="af-row">
                  <p><strong>{it.term}</strong> — {it.definition}</p>
                  <select
                    className="af-input"
                    value={answers[`s${i}`] || ''}
                    onChange={e => setAns(`s${i}`, e.target.value)}
                    aria-label={`Categoria de ${it.term}`}
                  >
                    <option value="">Escolha o grupo…</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {checked && ((answers[`s${i}`] || '') === it.category
                    ? <CheckCircle2 size={18} className="ok" />
                    : <span className="af-wrong"><XCircle size={18} /> {it.category}</span>)}
                </div>
              ))}
              <div className="af-actions">
                <button className="af-btn" onClick={() => setChecked(true)}>Verificar</button>
                {checked && <strong className="af-score">{sortScore()} / {items.length}</strong>}
              </div>
            </div>
          )}

          {items.length > 0 && template === 'truefalse' && (
            <div className="af-center">
              <span className="af-count">Afirmação {tfIdx + 1} de {tfStatements.length} • Acertos {tfScore.ok}/{tfScore.total}</span>
              <p className="af-big">{tfStatements[tfIdx].text}</p>
              {tfFeedback === null ? (
                <div className="af-actions">
                  <button className="af-btn ok-btn" onClick={() => answerTf(true)}>Verdadeiro</button>
                  <button className="af-btn bad-btn" onClick={() => answerTf(false)}>Falso</button>
                </div>
              ) : (
                <div className="af-actions">
                  <strong>{tfFeedback}</strong>
                  {tfIdx < tfStatements.length - 1 && <button className="af-btn" onClick={nextTf}>Próxima</button>}
                </div>
              )}
            </div>
          )}

          {items.length > 0 && template === 'flash' && (
            <div className="af-center">
              <span className="af-count">Cartão {cardIdx + 1} de {items.length} • Sabia: {Object.values(known).filter(Boolean).length}</span>
              <div className={`af-flash ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
                {flipped ? items[cardIdx].definition : items[cardIdx].term}
              </div>
              <div className="af-actions">
                <button className="af-btn ghost" onClick={() => { setKnown(k => ({ ...k, [cardIdx]: false })); setFlipped(false); setCardIdx(i => (i + 1) % items.length); }}>
                  Revisar depois
                </button>
                <button className="af-btn ok-btn" onClick={() => { setKnown(k => ({ ...k, [cardIdx]: true })); setFlipped(false); setCardIdx(i => (i + 1) % items.length); }}>
                  Eu sabia
                </button>
              </div>
            </div>
          )}

          {items.length > 0 && template === 'wordsearch' && (
            <div className="af-ws-wrap">
              <div className="af-ws-grid">
                {wordSearch.grid.map((row, r) => (
                  <div key={r} className="af-ws-row">
                    {row.map((ch, c) => (
                      <span key={c} className={`af-ws-cell ${revealSearch && wordSearch.hit.has(`${r}-${c}`) ? 'hit' : ''}`}>{ch}</span>
                    ))}
                  </div>
                ))}
              </div>
              <div className="af-ws-list">
                <h4>Encontre {wordSearch.placed.length} palavras</h4>
                <ul>{wordSearch.placed.map(p => <li key={p.word}>{p.word}</li>)}</ul>
                <button className="af-btn" onClick={() => setRevealSearch(v => !v)}>
                  {revealSearch ? 'Ocultar respostas' : 'Mostrar respostas'}
                </button>
              </div>
            </div>
          )}

          {items.length > 0 && template === 'anagram' && (
            <div className="af-list">
              {anagrams.map((a, i) => (
                <div key={i} className="af-row">
                  <p><strong className="af-scramble">{a.scrambled}</strong><br /><small>Dica: {a.hint}</small></p>
                  <input
                    className="af-input"
                    placeholder="Palavra correta"
                    value={answers[`a${i}`] || ''}
                    onChange={e => setAns(`a${i}`, e.target.value)}
                  />
                  {checked && (normalize(answers[`a${i}`] || '') === a.answer
                    ? <CheckCircle2 size={18} className="ok" />
                    : <span className="af-wrong"><XCircle size={18} /> {items[i].term}</span>)}
                </div>
              ))}
              <div className="af-actions">
                <button className="af-btn" onClick={() => setChecked(true)}>Verificar</button>
                {checked && <strong className="af-score">{anagramScore()} / {items.length}</strong>}
              </div>
            </div>
          )}

          {items.length > 0 && template === 'openbox' && (
            <div className="af-boxes">
              {items.map((it, i) => (
                <button
                  key={i}
                  className={`af-box ${openBoxes[i] ? 'open' : ''}`}
                  onClick={() => setOpenBoxes(b => ({ ...b, [i]: !b[i] }))}
                >
                  {openBoxes[i]
                    ? <><small>{it.definition}</small><strong>{it.term}</strong></>
                    : <span>{i + 1}</span>}
                </button>
              ))}
            </div>
          )}

          {items.length > 0 && !['flash', 'truefalse', 'wordsearch', 'openbox'].includes(template) && checked && (
            <button className="af-btn ghost" onClick={resetState}>
              <RotateCcw size={14} /><span>Refazer</span>
            </button>
          )}
        </main>
      </div>

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1100 }}>
          <div className="af-toast">
            <Check size={16} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* MODAL 1: ATRIBUIR ATIVIDADE À TURMA (ÁQUILA ARENA) */}
      {showAssignModal && (
        <div className="af-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="af-modal-card" onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <div className="af-modal-title-group">
                <div className="af-modal-icon-badge">
                  <Send size={18} />
                </div>
                <div>
                  <h3>Atribuir Atividade à Turma</h3>
                  <span className="af-sub" style={{ margin: 0 }}>Configure prazo, critérios e código de acesso dos alunos</span>
                </div>
              </div>
              <button className="af-close-btn" onClick={() => setShowAssignModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="af-modal-body">
              <div className="af-form-grid">
                <div className="af-form-field">
                  <label>Turma do Colégio Visão</label>
                  <select
                    className="af-select"
                    value={targetClass}
                    onChange={e => setTargetClass(e.target.value)}
                  >
                    {CLASS_OPTIONS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="af-form-field">
                  <label>Nota Mínima de Maestria</label>
                  <select
                    className="af-select"
                    value={minScore}
                    onChange={e => setMinScore(Number(e.target.value))}
                  >
                    <option value={60}>60% (Básico • SAEB / Prova Brasil)</option>
                    <option value={70}>70% (Padrão Colégio Visão)</option>
                    <option value={80}>80% (Proficiente • Recomendado)</option>
                    <option value={90}>90% (Excelente • Foco ENEM / Medicina)</option>
                  </select>
                </div>
              </div>

              <div className="af-form-grid">
                <div className="af-form-field">
                  <label>Data Limite (Prazo)</label>
                  <input
                    type="date"
                    className="af-select"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                  />
                </div>

                <div className="af-form-field">
                  <label>Horário Limite</label>
                  <input
                    type="time"
                    className="af-select"
                    value={dueTime}
                    onChange={e => setDueTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="af-checkbox-row">
                <label className="af-check-item">
                  <input
                    type="checkbox"
                    checked={allowRetries}
                    onChange={e => setAllowRetries(e.target.checked)}
                  />
                  <span>Permitir tentativas ilimitadas (Modo Estudo e Memorização Espaçada)</span>
                </label>
                <label className="af-check-item">
                  <input
                    type="checkbox"
                    checked={showPublicRanking}
                    onChange={e => setShowPublicRanking(e.target.checked)}
                  />
                  <span>Exibir Ranking / Leaderboard gamificado para os alunos</span>
                </label>
              </div>

              <div className="af-pin-card">
                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: '#f8fafc' }}>
                    Código PIN de Entrada Rápida
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Os alunos inserem este PIN no Portal do Aluno para responder imediatamente.
                  </span>
                </div>
                <div className="af-pin-code">{pinCode}</div>
              </div>
            </div>

            <div className="af-modal-footer">
              <button className="af-btn ghost" onClick={() => setShowAssignModal(false)}>
                Cancelar
              </button>
              <button className="af-btn" onClick={handleConfirmAssignment}>
                <Check size={16} />
                <span>Confirmar Atribuição</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESULTADOS & LEADERBOARD (ÁQUILA ARENA) */}
      {showLeaderboardModal && (
        <div className="af-modal-overlay" onClick={() => setShowLeaderboardModal(false)}>
          <div className="af-modal-card" style={{ maxWidth: 860 }} onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <div className="af-modal-title-group">
                <div className="af-modal-icon-badge" style={{ background: 'rgba(234, 179, 8, 0.18)', color: '#facc15', borderColor: 'rgba(234, 179, 8, 0.35)' }}>
                  <Trophy size={18} />
                </div>
                <div>
                  <h3>Leaderboard & Resultados da Turma</h3>
                  <span className="af-sub" style={{ margin: 0 }}>
                    {CLASS_OPTIONS.find(c => c.id === targetClass)?.label || targetClass} • Atividade: {title}
                  </span>
                </div>
              </div>
              <button className="af-close-btn" onClick={() => setShowLeaderboardModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="af-modal-body">
              {/* KPIs de Desempenho da Turma */}
              <div className="af-kpis">
                <div className="af-kpi-item">
                  <span className="af-kpi-val">{leaderboardEntries.length}</span>
                  <span className="af-kpi-lbl">ALUNOS ENTREGARAM</span>
                </div>
                <div className="af-kpi-item">
                  <span className="af-kpi-val" style={{ color: '#38bdf8' }}>
                    {Math.round(leaderboardEntries.reduce((acc, c) => acc + c.pct, 0) / Math.max(leaderboardEntries.length, 1))}%
                  </span>
                  <span className="af-kpi-lbl">APROVEITAMENTO MÉDIO</span>
                </div>
                <div className="af-kpi-item">
                  <span className="af-kpi-val" style={{ color: '#facc15' }}>
                    {leaderboardEntries.filter(e => e.pct >= minScore).length} / {leaderboardEntries.length}
                  </span>
                  <span className="af-kpi-lbl">ATINGIRAM A META ({minScore}%)</span>
                </div>
                <div className="af-kpi-item">
                  <span className="af-kpi-val" style={{ color: '#a78bfa' }}>02:34</span>
                  <span className="af-kpi-lbl">TEMPO MÉDIO GASTO</span>
                </div>
              </div>

              {/* Tabela do Leaderboard */}
              <div className="af-leaderboard-wrap">
                <table className="af-lb-table">
                  <thead>
                    <tr>
                      <th className="af-rank-col">POS</th>
                      <th>NOME DO ALUNO</th>
                      <th>ACERTOS</th>
                      <th>APROVEITAMENTO</th>
                      <th>TEMPO</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardEntries.map((row, idx) => (
                      <tr key={row.id}>
                        <td className="af-rank-col">
                          {idx === 0 ? <span className="af-medal-1">🥇 1º</span>
                            : idx === 1 ? <span className="af-medal-2">🥈 2º</span>
                            : idx === 2 ? <span className="af-medal-3">🥉 3º</span>
                            : `${idx + 1}º`}
                        </td>
                        <td>
                          <strong>{row.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: {row.id} • {row.submittedAt}</div>
                        </td>
                        <td>
                          <strong>{row.score}</strong> / {row.total}
                        </td>
                        <td>
                          <span className={`af-score-pill ${row.pct >= 80 ? 'af-score-high' : row.pct >= 60 ? 'af-score-mid' : 'af-score-low'}`}>
                            {row.pct}%
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
                            <Clock size={13} />
                            <span>{row.duration}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: row.status === 'Dominado' ? '#34d399' : row.status === 'Proficiente' ? '#fbbf24' : '#f87171'
                          }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="af-modal-footer" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="af-btn ghost" onClick={handleExportCSV}>
                  <Download size={15} />
                  <span>Exportar CSV</span>
                </button>
                <button className="af-btn ghost" onClick={handlePushToGradebook} disabled={pushedToGradebook}>
                  <FileSpreadsheet size={15} />
                  <span>{pushedToGradebook ? 'Notas Sincronizadas no Diário!' : 'Lançar Notas no Diário'}</span>
                </button>
              </div>
              <button className="af-btn" onClick={() => setShowLeaderboardModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityFactory;
