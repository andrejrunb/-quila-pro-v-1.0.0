import React, { useState, useEffect } from 'react';
import { Search, Command, FileText, Users, Calendar, ShieldCheck, HelpCircle } from 'lucide-react';

export interface QuickActionsProps {
  onSelectAction?: (actionId: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelectAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const actions = [
    { id: 'chamada', icon: FileText, label: 'Lançar Chamada da Aula Atual', desc: 'Atalho C • Registro rápido sem biometria', tag: 'Docente' },
    { id: 'diario', icon: FileText, label: 'Abrir Diário de Classe', desc: 'Atalho D • Conteúdo e faltas', tag: 'Docente' },
    { id: 'matricula', icon: Users, label: 'Nova Matrícula Escolar', desc: 'Secretaria Acadêmica • Aluno novo', tag: 'Secretaria' },
    { id: 'grade', icon: Calendar, label: 'Otimizar Grade SA+GLS', desc: 'Coordenação • Resolver janelas', tag: 'Gestão' },
    { id: 'auditoria', icon: ShieldCheck, label: 'Trilha de Auditoria Zero-Bypass', desc: 'Logs de integridade SHA-256', tag: 'Segurança' },
    { id: 'ajuda', icon: HelpCircle, label: 'Central de Ajuda e Atalhos', desc: 'Pressione ? a qualquer momento', tag: 'Suporte' },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.desc.toLowerCase().includes(query.toLowerCase()) ||
    a.tag.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de Comandos"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-glow)] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
          <Search className="w-5 h-5 text-[var(--text-3)] mr-3 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            className="flex-1 bg-transparent text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)] text-base"
            placeholder="Digite um comando, turma ou ação (ex: chamada, matrícula)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-2)] bg-slate-800 px-2 py-1 rounded border border-slate-700">
            <Command size={11} /> K
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/50">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/70 text-left transition-colors cursor-pointer group"
                onClick={() => {
                  if (onSelectAction) onSelectAction(item.id);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-cyan-950/60 text-cyan-400 group-hover:bg-cyan-900/80 transition-colors">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-1)]">{item.label}</div>
                    <div className="text-xs text-[var(--text-2)]">{item.desc}</div>
                  </div>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-[var(--text-3)] border border-slate-700">
                  {item.tag}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--text-2)]">
              Nenhum comando encontrado para "{query}".
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-950 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--text-3)]">
          <span>Navegue com setas ou clique</span>
          <span>Esc para fechar</span>
        </div>
      </div>
    </div>
  );
};
