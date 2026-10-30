import React, { useCallback, useEffect, useState } from 'react';
import { BookMarked, Plus, RefreshCw, Share2, ExternalLink, ShieldAlert } from 'lucide-react';
import './GeminiNotebookPanel.css';

interface NotebookItem {
  title: string;
  notebookId: string;
  emoji?: string;
  metadata?: { userRole?: string; isShared?: boolean; isShareable?: boolean };
}

interface Status {
  enabled: boolean;
  configured: boolean;
  location: string;
  projectNumber: string | null;
}

interface Props {
  userId: string;
  /** Sugestões de título prontas (ex.: assuntos de estudo do aluno). Nunca incluir dados pessoais. */
  suggestedTopics?: string[];
}

const api = () => (window as any).aquila?.geminiNotebook;

export const GeminiNotebookPanel: React.FC<Props> = ({ userId, suggestedTopics = [] }) => {
  const [status, setStatus] = useState<Status | null>(null);
  const [items, setItems] = useState<NotebookItem[]>([]);
  const [title, setTitle] = useState('');
  const [shareFor, setShareFor] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('PROJECT_ROLE_READER');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const refresh = useCallback(async () => {
    const a = api();
    if (!a) return;
    const s: Status = await a.status();
    setStatus(s);
    if (!s.configured) return;
    const r = await a.list(20);
    if (r?.ok) setItems(r.data?.notebooks || []);
    else if (r) setMsg({ kind: 'err', text: r.error || 'Falha ao listar.' });
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const create = async (t: string) => {
    setBusy(true);
    setMsg(null);
    const r = await api()?.create(userId, t);
    setBusy(false);
    if (r?.ok) {
      setTitle('');
      setMsg({ kind: 'ok', text: `Caderno "${r.data?.title}" criado!` });
      refresh();
    } else {
      setMsg({ kind: 'err', text: r?.error || 'Falha ao criar.' });
    }
  };

  const share = async (notebookId: string) => {
    setBusy(true);
    const r = await api()?.share(userId, notebookId, [{ email: shareEmail.trim(), role: shareRole }]);
    setBusy(false);
    if (r?.ok) {
      setMsg({ kind: 'ok', text: 'Caderno compartilhado.' });
      setShareFor(null);
      setShareEmail('');
      refresh();
    } else {
      setMsg({ kind: 'err', text: r?.error || 'Falha ao compartilhar.' });
    }
  };

  const openUrl = (id: string) =>
    `https://notebook.cloud.google.com/${status?.location}/notebook/${id}?project=${status?.projectNumber}`;

  return (
    <section className="gnb-card" data-testid="gemini-notebook-panel">
      <header className="gnb-head">
        <h3 className="gnb-title">
          <BookMarked size={18} /> Cadernos Gemini
        </h3>
        <button className="gnb-icon-btn" onClick={() => refresh()} title="Atualizar" aria-label="Atualizar cadernos">
          <RefreshCw size={14} />
        </button>
      </header>

      {status && !status.configured && (
        <div className="gnb-note">
          <ShieldAlert size={16} />
          <span>
            {status.enabled
              ? 'Falta informar o projeto Google Cloud (AQUILA_GCP_PROJECT_NUMBER).'
              : 'Integração desligada por padrão: seus dados ficam só no servidor da escola. A coordenação precisa habilitar o Gemini Notebook.'}
          </span>
        </div>
      )}

      {status?.configured && (
        <>
          <div className="gnb-create">
            <input
              value={title}
              maxLength={120}
              placeholder="Ex.: Cinemática — revisão para o ENEM"
              onChange={e => setTitle(e.target.value)}
              aria-label="Título do novo caderno"
            />
            <button className="gnb-btn" disabled={busy || !title.trim()} onClick={() => create(title)}>
              <Plus size={14} /> Criar caderno
            </button>
          </div>
          <p className="gnb-hint">Não coloque nome, CPF ou e-mail de pessoas no título.</p>

          {suggestedTopics.length > 0 && (
            <div className="gnb-chips">
              {suggestedTopics.map(t => (
                <button key={t} className="gnb-chip" disabled={busy} onClick={() => create(t)}>
                  + {t}
                </button>
              ))}
            </div>
          )}

          <ul className="gnb-list">
            {items.length === 0 && <li className="gnb-empty">Nenhum caderno visto recentemente.</li>}
            {items.map(n => (
              <li key={n.notebookId} className="gnb-item">
                <div className="gnb-item-main">
                  <span className="gnb-emoji">{n.emoji || '📓'}</span>
                  <div>
                    <strong>{n.title || 'Sem título'}</strong>
                    <small>{n.metadata?.isShared ? 'Compartilhado' : 'Só você'}</small>
                  </div>
                </div>
                <div className="gnb-item-actions">
                  <a className="gnb-icon-btn" href={openUrl(n.notebookId)} target="_blank" rel="noreferrer" title="Abrir no Gemini">
                    <ExternalLink size={14} />
                  </a>
                  {n.metadata?.isShareable !== false && (
                    <button className="gnb-icon-btn" title="Compartilhar" onClick={() => setShareFor(shareFor === n.notebookId ? null : n.notebookId)}>
                      <Share2 size={14} />
                    </button>
                  )}
                </div>
                {shareFor === n.notebookId && (
                  <div className="gnb-share">
                    <input type="email" placeholder="e-mail do professor" value={shareEmail} onChange={e => setShareEmail(e.target.value)} />
                    <select value={shareRole} onChange={e => setShareRole(e.target.value)} aria-label="Permissão">
                      <option value="PROJECT_ROLE_READER">Leitura</option>
                      <option value="PROJECT_ROLE_WRITER">Edição</option>
                    </select>
                    <button className="gnb-btn" disabled={busy || !shareEmail.includes('@')} onClick={() => share(n.notebookId)}>
                      Enviar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {msg && <div className={`gnb-msg ${msg.kind}`}>{msg.text}</div>}
    </section>
  );
};

export default GeminiNotebookPanel;
