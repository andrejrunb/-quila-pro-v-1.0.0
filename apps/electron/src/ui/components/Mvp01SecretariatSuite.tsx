import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  UserPlus,
  Copy,
  Check,
  Ban,
  Users,
  ArrowRightLeft,
  Sliders,
  Lock,
  Unlock,
  FileText,
  Search,
  Send,
  ShieldAlert,
  CloudSync,
  CheckCircle2,
  KeyRound,
  Plus,
  BookOpen,
} from 'lucide-react';
import { TeacherClassLinkManager } from './TeacherClassLinkManager';
import { GradeWeightConfig } from './GradeWeightConfig';
import { SecretariatBoletimManager } from './SecretariatBoletimManager';
import { TutelaryCouncilReport } from './TutelaryCouncilReport';
import { UserManagement } from '../pages/UserManagement';

export interface Mvp01MembershipItem {
  membershipId: string;
  userId: string;
  personName: string | null;
  email: string | null;
  schoolId: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  validUntil: string | null;
}

export interface Mvp01ContextData {
  userId: string;
  schoolId: string;
  membershipId: string;
  activeRole: string;
  availableMemberships: Mvp01MembershipItem[];
  assignedClasses: Array<{ classId: string; subject: string }>;
  authorizedStudentIds: string[];
  coordinationClassIds: string[];
  ownStudentId?: string | null;
}

export interface ConsistencyIssueItem {
  id: string;
  affectedRecord: string;
  ruleApplied: string;
  severity: 'BLOQUEIO' | 'AVISO';
  howToFix: string;
  responsible: string;
  lastRunAt: string;
}

export interface Mvp01ConsistencyResult {
  runAt?: string;
  totalIssues?: number;
  blockingCount: number;
  warningCount: number;
  items?: ConsistencyIssueItem[];
  issues?: ConsistencyIssueItem[];
}

export interface Mvp01SecretariatOverviewData {
  portal: 'secretariat';
  school: { id: string; name: string; cnpj?: string; city?: string; state?: string } | null;
  academicYears: any[];
  academicPeriods: any[];
  classes: any[];
  enrollmentDrafts: any[];
  enrollments: any[];
  issuedDocuments: any[];
  consistency?: Mvp01ConsistencyResult;
}

export async function invokeMvp01<T = any>(
  method: string,
  payload?: any
): Promise<{ ok: true; data: T } | { ok: false; error: string; code?: string }> {
  const api = (window as any).aquila?.mvp01;
  if (!api || typeof api[method] !== 'function') {
    return {
      ok: false,
      error: 'Fundação mvp01 indisponível nesta sessão.',
      code: 'BRIDGE_UNAVAILABLE',
    };
  }
  try {
    const res = payload !== undefined ? await api[method](payload) : await api[method]();
    if (res && typeof res === 'object' && 'success' in res) {
      if (res.success) {
        return { ok: true, data: res.data as T };
      }
      return {
        ok: false,
        error: res.error || res.message || 'Falha ao executar operação.',
        code: res.code,
      };
    }
    return { ok: true, data: res as T };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Erro de comunicação IPC.' };
  }
}

export function formatRoleLabel(role: string): string {
  const map: Record<string, string> = {
    admin: 'Administrador',
    director: 'Direção (Leitura)',
    diretoria: 'Direção (Leitura)',
    secretary: 'Secretaria',
    secretaria: 'Secretaria',
    coordinator: 'Coordenação',
    coordenacao: 'Coordenação',
    teacher: 'Professor(a)',
    docente: 'Professor(a)',
    parent: 'Responsável',
    student: 'Estudante',
  };
  return map[String(role || '').toLowerCase()] || role;
}

function formatDateTimePt(iso?: string | null): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildIdempotencyKey(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ============================================================================
// ABA 1: VISÃO GERAL + VERIFICAÇÃO DE CONSISTÊNCIA
// ============================================================================

interface OverviewProps {
  overview: Mvp01SecretariatOverviewData | null;
  legacyStudents: any[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onNavigateTab: (tabId: string) => void;
}

export const Mvp01SecretariatOverview: React.FC<OverviewProps> = ({
  overview,
  legacyStudents,
  searchTerm,
  setSearchTerm,
  loading,
  onRefresh,
  onNavigateTab,
}) => {
  const [consistency, setConsistency] = useState<Mvp01ConsistencyResult | null>(
    overview?.consistency || null
  );
  const [runningCheck, setRunningCheck] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    if (overview?.consistency) {
      setConsistency(overview.consistency);
    }
  }, [overview?.consistency]);

  const handleRunConsistency = async () => {
    setRunningCheck(true);
    setCheckError(null);
    const res = await invokeMvp01<Mvp01ConsistencyResult>('runConsistencyVerification');
    setRunningCheck(false);
    if (!res.ok) {
      setCheckError(res.error);
      return;
    }
    setConsistency(res.data);
  };

  const issues: ConsistencyIssueItem[] =
    consistency?.items || consistency?.issues || [];
  const blockingCount =
    consistency?.blockingCount ?? issues.filter(i => i.severity === 'BLOQUEIO').length;
  const warningCount =
    consistency?.warningCount ?? issues.filter(i => i.severity === 'AVISO').length;

  const activeEnrollments = (overview?.enrollments || []).filter(e => e.status === 'ATIVA');
  const pendingDrafts = (overview?.enrollmentDrafts || []).filter(
    d => d.status !== 'CONFIRMADA' && d.status !== 'CANCELADA'
  );
  const activeClasses = (overview?.classes || []).filter(c => c.status === 'ACTIVE');
  const totalOccupied = activeClasses.reduce((acc, c) => acc + Number(c.occupied || 0), 0);
  const totalCapacity = activeClasses.reduce((acc, c) => acc + Number(c.capacity || 0), 0);
  const activeDocs = (overview?.issuedDocuments || []).filter(d => d.status === 'ACTIVE');

  const combinedRecords = useMemo(() => {
    const mvpRows = (overview?.enrollments || []).map(e => ({
      id: e.student_id || e.id,
      name: e.full_name || 'Estudante',
      code: e.registration_code || e.id,
      classId: e.class_id || 'Enturmação Pendente',
      status: e.status || 'ATIVA',
    }));
    if (mvpRows.length > 0) return mvpRows;
    return legacyStudents.map(s => ({
      id: s.id,
      name: s.name || 'Aluno',
      code: s.registrationNumber || s.id,
      classId: s.classId || 'Sem turma',
      status: 'LEGADO',
    }));
  }, [overview?.enrollments, legacyStudents]);

  const filteredRecords = combinedRecords.filter(
    r =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.code).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {/* KPIs Reais MVP 0.1 */}
      <div className="sec-kpi-grid">
        <div className="sec-kpi-pod">
          <div className="sec-kpi-meta">
            <span className="sec-kpi-label">MATRÍCULAS ATIVAS</span>
            <span className="sec-kpi-value">{activeEnrollments.length}</span>
            <span className="sec-kpi-delta">
              {pendingDrafts.length} pré-matrícula(s) em conferência
            </span>
          </div>
          <div className="sec-kpi-icon">
            <Users size={18} />
          </div>
        </div>

        <div className="sec-kpi-pod">
          <div className="sec-kpi-meta">
            <span className="sec-kpi-label">TURMAS & OCUPAÇÃO</span>
            <span className="sec-kpi-value" style={{ color: '#10B981' }}>
              {activeClasses.length} ({totalOccupied}/{totalCapacity || 0})
            </span>
            <span className="sec-kpi-delta">Vagas ocupadas / capacidade</span>
          </div>
          <div className="sec-kpi-icon">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="sec-kpi-pod">
          <div className="sec-kpi-meta">
            <span className="sec-kpi-label">DOCUMENTOS ATIVOS</span>
            <span className="sec-kpi-value">{activeDocs.length}</span>
            <span className="sec-kpi-delta">Com token e hash SHA-256</span>
          </div>
          <div className="sec-kpi-icon">
            <FileText size={18} />
          </div>
        </div>

        <div className="sec-kpi-pod">
          <div className="sec-kpi-meta">
            <span className="sec-kpi-label">VERIFICAÇÃO DE CONSISTÊNCIA</span>
            <span
              className="sec-kpi-value"
              style={{ color: blockingCount > 0 ? '#EF4444' : warningCount > 0 ? '#F59E0B' : '#10B981' }}
            >
              {blockingCount} BLOQ • {warningCount} AVISO
            </span>
            <span className="sec-kpi-delta">
              Última execução: {formatDateTimePt(consistency?.runAt || issues[0]?.lastRunAt)}
            </span>
          </div>
          <div className="sec-kpi-icon">
            <ShieldCheck size={18} />
          </div>
        </div>
      </div>

      {/* Painel Verificação de Consistência */}
      <section className="sec-vault-section">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <div className="sec-section-title" style={{ marginBottom: 2 }}>
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Verificação de Consistência</span>
            </div>
            <p className="text-xs text-slate-400">
              Checagem operacional de matrículas sem turma, capacidade excedida, documentação pendente, turmas sem docente, vínculo familiar e sincronização.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="sec-btn primary"
              onClick={handleRunConsistency}
              disabled={runningCheck}
            >
              <RefreshCw size={13} className={runningCheck ? 'animate-spin' : ''} />
              <span>{runningCheck ? 'Verificando...' : 'Executar Verificação de Consistência'}</span>
            </button>
            <button type="button" className="sec-btn" onClick={onRefresh}>
              <CloudSync size={13} />
              <span>Atualizar Dados</span>
            </button>
          </div>
        </div>

        {checkError && (
          <div className="p-2.5 mb-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            {checkError}
          </div>
        )}

        {issues.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
            <span>Nenhuma inconsistência detectada na execução mais recente.</span>
            <span className="font-mono text-[11px] text-slate-400">
              Executado em: {formatDateTimePt(consistency?.runAt)}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px]">
                  <th className="py-2 pr-3">Registro afetado</th>
                  <th className="py-2 pr-3">Regra aplicada</th>
                  <th className="py-2 pr-3">Gravidade</th>
                  <th className="py-2 pr-3">Como corrigir</th>
                  <th className="py-2 pr-3">Responsável</th>
                  <th className="py-2">Última execução</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => (
                  <tr key={issue.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2.5 pr-3 font-semibold text-white">{issue.affectedRecord}</td>
                    <td className="py-2.5 pr-3 text-slate-300">{issue.ruleApplied}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] ${
                          issue.severity === 'BLOQUEIO'
                            ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {issue.severity === 'BLOQUEIO' ? <AlertOctagon size={11} /> : <AlertTriangle size={11} />}
                        {issue.severity}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300">{issue.howToFix}</td>
                    <td className="py-2.5 pr-3 text-emerald-300 font-medium">{issue.responsible}</td>
                    <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                      {formatDateTimePt(issue.lastRunAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Atalhos Rápidos das 8 Abas */}
      <section className="sec-vault-section">
        <div className="sec-section-title">
          <UserPlus size={16} className="text-emerald-400" />
          <span>Acessos Diretos da Secretaria</span>
        </div>
        <div className="sec-doc-grid">
          <div className="sec-doc-card cursor-pointer" onClick={() => onNavigateTab('usuarios')}>
            <div className="sec-doc-left">
              <div className="sec-doc-icon"><KeyRound size={16} /></div>
              <div className="sec-doc-info">
                <span className="sec-doc-name">Usuários & Convites</span>
                <span className="sec-doc-meta">Convite de uso único e vínculos</span>
              </div>
            </div>
            <span className="sec-btn">Abrir</span>
          </div>
          <div className="sec-doc-card cursor-pointer" onClick={() => onNavigateTab('cadastro')}>
            <div className="sec-doc-left">
              <div className="sec-doc-icon"><UserPlus size={16} /></div>
              <div className="sec-doc-info">
                <span className="sec-doc-name">Alunos & Matrículas</span>
                <span className="sec-doc-meta">Assistente em 5 etapas + CSV</span>
              </div>
            </div>
            <span className="sec-btn">Abrir</span>
          </div>
          <div className="sec-doc-card cursor-pointer" onClick={() => onNavigateTab('grade-horaria')}>
            <div className="sec-doc-left">
              <div className="sec-doc-icon"><BookOpen size={16} /></div>
              <div className="sec-doc-info">
                <span className="sec-doc-name">Grade Horária Áquila</span>
                <span className="sec-doc-meta">Edição manual, conflitos e publicação</span>
              </div>
            </div>
            <span className="sec-btn">Abrir</span>
          </div>
        </div>
      </section>

      {/* Busca e Prontuários */}
      <div className="sec-search-container">
        <Search size={16} className="text-emerald-400" />
        <input
          type="text"
          placeholder="Filtrar prontuário por nome do aluno ou código de matrícula..."
          className="sec-search-input"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <section className="sec-vault-section">
        <div className="sec-section-title">
          <FileText size={16} className="text-emerald-400" />
          <span>Prontuários Acadêmicos ({filteredRecords.length})</span>
        </div>
        <div className="sec-doc-grid">
          {loading ? (
            <div className="col-span-full text-center text-xs text-slate-400 py-4">Carregando prontuários...</div>
          ) : filteredRecords.length > 0 ? (
            filteredRecords.slice(0, 12).map(rec => (
              <div key={rec.id} className="sec-doc-card">
                <div className="sec-doc-left">
                  <div className="sec-doc-icon"><FileText size={16} /></div>
                  <div className="sec-doc-info">
                    <span className="sec-doc-name">{rec.name}</span>
                    <span className="sec-doc-meta">
                      Código: {rec.code} • Turma: {rec.classId} • {rec.status}
                    </span>
                  </div>
                </div>
                <CloudSync size={16} className="text-emerald-400" />
              </div>
            ))
          ) : (
            <p className="col-span-full text-zinc-500 text-center py-4 text-xs">
              Nenhum prontuário encontrado para o filtro atual.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// ABA 2: USUÁRIOS & LOGINS (CONVITE DE USO ÚNICO SEM SENHA PERMANENTE)
// ============================================================================

interface InvitationRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  token?: string;
  activationLink?: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  createdAt: string;
}

interface UsersPanelProps {
  context: Mvp01ContextData | null;
  onBackToOverview: () => void;
}

function mapBackendInvitation(raw: any): InvitationRecord {
  return {
    id: String(raw.id),
    name: String(raw.person_name || raw.personName || raw.name || raw.email || 'Convidado'),
    email: String(raw.email || ''),
    role: String(raw.role || 'teacher'),
    token: raw.token || raw.inviteToken || undefined,
    activationLink: raw.activationLink || undefined,
    expiresAt: String(raw.expires_at || raw.expiresAt || ''),
    status: (raw.status || 'PENDING') as InvitationRecord['status'],
    createdAt: String(raw.created_at || raw.createdAt || ''),
  };
}

export const Mvp01SecretariatUsersPanel: React.FC<UsersPanelProps> = ({
  context,
  onBackToOverview,
}) => {
  const [invites, setInvites] = useState<InvitationRecord[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [usingPreviewFallback, setUsingPreviewFallback] = useState(false);
  const [legacyUsers, setLegacyUsers] = useState<any[]>([]);
  const [showFullUserMgmt, setShowFullUserMgmt] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'teacher' | 'coordinator' | 'secretary' | 'parent' | 'director'>('teacher');
  const [validityHours, setValidityHours] = useState<number>(48);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const loadLegacyUsers = async () => {
    try {
      const list = await (window as any).aquila?.invoke?.('get-users');
      setLegacyUsers(Array.isArray(list) ? list : []);
    } catch {
      setLegacyUsers([]);
    }
  };

  const loadInvitations = async () => {
    const api = (window as any).aquila?.mvp01;
    if (!api || typeof api.listUserInvitations !== 'function') {
      setUsingPreviewFallback(true);
      return;
    }
    setInvitesLoading(true);
    const res = await invokeMvp01<any[]>('listUserInvitations');
    setInvitesLoading(false);
    if (!res.ok) {
      if (res.code === 'BRIDGE_UNAVAILABLE') {
        setUsingPreviewFallback(true);
      } else {
        setInviteError(res.error);
      }
      return;
    }
    setUsingPreviewFallback(false);
    const items = Array.isArray(res.data) ? res.data : [];
    setInvites(prev => {
      const sessionSecrets = new Map(
        prev
          .filter(p => p.token || p.activationLink)
          .map(p => [p.id, { token: p.token, activationLink: p.activationLink }])
      );
      return items.map(item => {
        const mapped = mapBackendInvitation(item);
        const secret = sessionSecrets.get(mapped.id);
        return secret
          ? { ...mapped, token: mapped.token || secret.token, activationLink: mapped.activationLink || secret.activationLink }
          : mapped;
      });
    });
  };

  useEffect(() => {
    loadLegacyUsers();
    loadInvitations();
  }, [context?.schoolId]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setInviteError(null);
    setFeedback(null);

    const now = new Date();
    const expires = new Date(now.getTime() + validityHours * 3600 * 1000);
    const api = (window as any).aquila?.mvp01;

    if (api && typeof api.createUserInvitation === 'function') {
      const res = await invokeMvp01<any>('createUserInvitation', {
        name: inviteName.trim(),
        personName: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        validityHours,
        expiresAt: expires.toISOString(),
      });
      if (!res.ok) {
        setInviteError(res.error);
        return;
      }
      const created = mapBackendInvitation(res.data?.invitation || res.data || {
        id: res.data?.invitationId || res.data?.id || `inv-${Date.now()}`,
        person_name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        expires_at: res.data?.expiresAt || expires.toISOString(),
        status: 'PENDING',
        created_at: now.toISOString(),
        token: res.data?.inviteToken || res.data?.token,
        activationLink: res.data?.activationLink,
      });
      setInvites(prev => [created, ...prev.filter(i => i.id !== created.id)]);
      setInviteName('');
      setInviteEmail('');
      setFeedback(
        `Convite de uso único emitido no servidor para ${created.email} (válido até ${formatDateTimePt(created.expiresAt)}). Nenhuma senha permanente foi gerada.`
      );
      await loadInvitations();
      return;
    }

    // Fallback apenas em memória para modo web/preview (sem gravar tokens em localStorage)
    setUsingPreviewFallback(true);
    const token = buildIdempotencyKey('inv').replace(/[^a-zA-Z0-9-]/g, '');
    const record: InvitationRecord = {
      id: `inv-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      token,
      expiresAt: expires.toISOString(),
      status: 'PENDING',
      createdAt: now.toISOString(),
    };
    setInvites(prev => [record, ...prev]);
    setInviteName('');
    setInviteEmail('');
    setFeedback(
      `Convite de uso único emitido em memória (preview) para ${record.email} (válido até ${formatDateTimePt(record.expiresAt)}). Nenhuma senha permanente foi gerada.`
    );
  };

  const handleRevokeInvite = async (id: string) => {
    setInviteError(null);
    const api = (window as any).aquila?.mvp01;
    if (api && typeof api.revokeUserInvitation === 'function') {
      const res = await invokeMvp01('revokeUserInvitation', { invitationId: id, id });
      if (!res.ok) {
        setInviteError(res.error);
        return;
      }
      setFeedback(`Convite ${id} revogado no servidor.`);
      await loadInvitations();
      return;
    }
    setInvites(prev => prev.map(i => (i.id === id ? { ...i, status: 'REVOKED' } : i)));
  };

  const handleCopyKit = async (inv: InvitationRecord) => {
    const activationTarget =
      inv.activationLink || (inv.token ? `aquila://ativar?token=${inv.token}` : null);
    if (!activationTarget) {
      setInviteError('O token de uso único só fica visível no momento da emissão por segurança (hash armazenado no servidor). Reemita o convite se precisar de um novo link.');
      return;
    }
    const kitText =
      `Convite de Acesso Áquila Pro (${formatRoleLabel(inv.role)})\n` +
      `Destinatário: ${inv.name} (${inv.email})\n` +
      `Link de primeiro acesso (uso único): ${activationTarget}\n` +
      `Validade: ${formatDateTimePt(inv.expiresAt)}\n` +
      `Observação: Defina sua senha pessoal no primeiro acesso. Este kit não contém senha permanente.`;
    try {
      await navigator.clipboard?.writeText(kitText);
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setFeedback(kitText);
    }
  };

  const handleRevokeLegacyUser = async (u: any) => {
    if (u.username === 'admin') return;
    if (!window.confirm(`Revogar acesso de ${u.name || u.username}?`)) return;
    try {
      const res = await (window as any).aquila?.invoke?.('delete-user', u.id);
      if (res?.success) {
        setFeedback(`Acesso de ${u.name || u.username} revogado.`);
        loadLegacyUsers();
      }
    } catch {
      setFeedback('Não foi possível revogar o usuário.');
    }
  };

  if (showFullUserMgmt) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Gerenciamento completo de usuários & LGPD</span>
          <button
            type="button"
            className="sec-btn"
            onClick={() => {
              setShowFullUserMgmt(false);
              loadLegacyUsers();
            }}
          >
            Voltar aos Convites de Uso Único
          </button>
        </div>
        <UserManagement onBack={() => setShowFullUserMgmt(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <KeyRound className="text-emerald-400" size={20} />
            Usuários, Convites de Uso Único & Vínculos
          </h2>
          <p className="text-xs text-slate-400">
            Emita convites de uso único com validade definida. Nenhuma senha permanente é gerada ou exposta no Kit de Boas-Vindas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="sec-btn primary"
            onClick={() => setShowFullUserMgmt(true)}
          >
            <Users size={13} />
            <span>Abrir Gestão RBAC / LGPD Completa</span>
          </button>
          <button type="button" className="sec-btn" onClick={onBackToOverview}>
            Voltar à Visão Geral
          </button>
        </div>
      </div>

      {inviteError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          {inviteError}
        </div>
      )}

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
          {feedback}
        </div>
      )}

      {usingPreviewFallback && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200">
          Modo preview/web: canais de convite no servidor não detectados; convites exibidos somente em memória (nunca gravados em localStorage).
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gerador de Convite */}
        <form
          onSubmit={handleCreateInvite}
          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserPlus size={15} className="text-emerald-400" />
            Emitir Convite de Uso Único
          </h3>
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-200">
            Segurança: O Kit de Boas-Vindas contém apenas token de uso único com expiração. O usuário cria sua própria senha no primeiro acesso.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder="Ex: Profa. Juliana Lima"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">E-mail Institucional *</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="juliana@escola.edu.br"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Papel do Vínculo</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as any)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
              >
                <option value="teacher">Professor(a)</option>
                <option value="coordinator">Coordenação</option>
                <option value="secretary">Secretaria</option>
                <option value="parent">Responsável Legal / Família</option>
                <option value="director">Direção (Somente Leitura)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Validade do Convite</label>
              <select
                value={validityHours}
                onChange={e => setValidityHours(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
              >
                <option value={24}>24 horas (1 dia)</option>
                <option value={48}>48 horas (2 dias)</option>
                <option value={168}>7 dias</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2"
          >
            <Send size={14} /> Gerar Convite Sem Senha Permanente
          </button>
        </form>

        {/* Lista de Convites */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Convites Emitidos ({invites.length})</h3>
            <button type="button" onClick={loadInvitations} className="sec-btn">
              <RefreshCw size={12} className={invitesLoading ? 'animate-spin' : ''} />
              <span>Atualizar</span>
            </button>
          </div>
          {invites.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {invitesLoading ? 'Carregando convites...' : 'Nenhum convite emitido ainda. Gere um convite de uso único ao lado.'}
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {invites.map(inv => {
                const isExpired = inv.status === 'PENDING' && Date.parse(inv.expiresAt) < Date.now();
                const displayStatus =
                  inv.status === 'REVOKED'
                    ? 'REVOGADO'
                    : inv.status === 'ACCEPTED'
                    ? 'UTILIZADO'
                    : isExpired || inv.status === 'EXPIRED'
                    ? 'EXPIRADO'
                    : 'ATIVO (USO ÚNICO)';
                return (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">
                        {inv.name} <span className="text-slate-400 font-normal">({inv.email})</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          displayStatus.startsWith('ATIVO')
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : displayStatus === 'UTILIZADO'
                            ? 'bg-blue-500/15 text-blue-300'
                            : 'bg-red-500/15 text-red-300'
                        }`}
                      >
                        {displayStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-3">
                      <span>Papel: {formatRoleLabel(inv.role)}</span>
                      <span>Expira: {formatDateTimePt(inv.expiresAt)}</span>
                      <span className="font-mono">
                        {inv.token ? `Token: ${inv.token.slice(0, 14)}…` : 'Hash protegido no servidor'}
                      </span>
                    </div>
                    {displayStatus.startsWith('ATIVO') && (
                      <div className="flex items-center gap-2 mt-1">
                        {(inv.token || inv.activationLink) && (
                          <button
                            type="button"
                            onClick={() => handleCopyKit(inv)}
                            className="sec-btn"
                          >
                            {copiedId === inv.id ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedId === inv.id ? 'Kit Copiado' : 'Copiar Kit (Sem Senha)'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="sec-btn"
                          style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#FCA5A5' }}
                        >
                          <Ban size={12} />
                          <span>Revogar</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Vínculos Ativos da Sessão / Escola */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
        <h3 className="text-sm font-bold text-white">Vínculos & Acessos Cadastrados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(context?.availableMemberships || []).map(mem => (
            <div key={mem.membershipId} className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white">{mem.personName || mem.userId}</div>
                <div className="text-slate-400">
                  {formatRoleLabel(mem.role)} • {mem.email || mem.userId}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold text-[10px]">
                {mem.status}
              </span>
            </div>
          ))}
          {legacyUsers.map(u => (
            <div key={u.id} className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white">{u.name || u.username}</div>
                <div className="text-slate-400">
                  {formatRoleLabel(u.role)} • @{u.username}
                </div>
              </div>
              <button
                type="button"
                disabled={u.username === 'admin'}
                onClick={() => handleRevokeLegacyUser(u)}
                className="sec-btn"
                style={{ opacity: u.username === 'admin' ? 0.45 : 1 }}
              >
                <Ban size={12} />
                <span>Revogar</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ABA 4: TURMAS & VÍNCULOS (CRIAÇÃO, ENTURMAÇÃO, REMANEJAMENTO E DOCENTES)
// ============================================================================

interface ClassesPanelProps {
  overview: Mvp01SecretariatOverviewData | null;
  onRefresh: () => Promise<void>;
}

export const Mvp01SecretariatClassesPanel: React.FC<ClassesPanelProps> = ({
  overview,
  onRefresh,
}) => {
  const academicYears = overview?.academicYears || [];
  const classes = overview?.classes || [];
  const enrollments = (overview?.enrollments || []).filter(e => e.status === 'ATIVA');
  const pendingDrafts = (overview?.enrollmentDrafts || []).filter(
    d => d.status !== 'CONFIRMADA' && d.status !== 'CANCELADA'
  );

  // Criar Turma
  const [newClassYearId, setNewClassYearId] = useState<string>(academicYears[0]?.id || '');
  const [newClassStage, setNewClassStage] = useState<'FUNDAMENTAL' | 'MEDIO'>('FUNDAMENTAL');
  const [newClassName, setNewClassName] = useState('');
  const [newClassShift, setNewClassShift] = useState('MATUTINO');
  const [newClassRoom, setNewClassRoom] = useState('');
  const [newClassCap, setNewClassCap] = useState<number>(30);

  // Remanejamento preservando histórico
  const [transferEnrollmentId, setTransferEnrollmentId] = useState('');
  const [transferTargetClassId, setTransferTargetClassId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferHistoryLog, setTransferHistoryLog] = useState<string[]>([]);

  // Enturmar rascunho pendente
  const [draftToEnroll, setDraftToEnroll] = useState('');
  const [draftTargetClassId, setDraftTargetClassId] = useState('');

  // Vínculo docente/coordenação MVP 0.1
  const [assignClassId, setAssignClassId] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('user-demo-multi');
  const [assignTeacherName, setAssignTeacherName] = useState('Prof. Ricardo Mendes');
  const [assignSubject, setAssignSubject] = useState('Matemática');
  const [assignCoordUserId, setAssignCoordUserId] = useState('user-demo-coord');

  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!newClassYearId && academicYears[0]?.id) setNewClassYearId(academicYears[0].id);
    if (!assignClassId && classes[0]?.id) setAssignClassId(classes[0].id);
  }, [academicYears, classes, newClassYearId, assignClassId]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassYearId) return;
    setBusy(true);
    setStatusMsg(null);
    const res = await invokeMvp01('saveClassAssignment', {
      classData: {
        academicYearId: newClassYearId,
        stage: newClassStage,
        name: newClassName.trim(),
        shift: newClassShift,
        room: newClassRoom.trim() || undefined,
        capacity: Number(newClassCap) || 30,
        status: 'ACTIVE',
      },
    });
    setBusy(false);
    if (!res.ok) {
      setStatusMsg({ type: 'err', text: res.error });
      return;
    }
    setNewClassName('');
    setNewClassRoom('');
    setStatusMsg({ type: 'ok', text: `Turma criada com sucesso (ID: ${res.data?.classId}).` });
    await onRefresh();
  };

  const handleTransferStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferEnrollmentId || !transferTargetClassId || transferReason.trim().length < 3) {
      setStatusMsg({
        type: 'err',
        text: 'Selecione a matrícula ativa, a turma de destino e informe um motivo (mín. 3 caracteres).',
      });
      return;
    }
    setBusy(true);
    setStatusMsg(null);
    const res = await invokeMvp01('transferStudentClass', {
      enrollmentId: transferEnrollmentId,
      targetClassId: transferTargetClassId,
      reason: transferReason.trim(),
      idempotencyKey: buildIdempotencyKey('transfer'),
    });
    setBusy(false);
    if (!res.ok) {
      setStatusMsg({ type: 'err', text: res.error });
      return;
    }
    const enr = enrollments.find(x => x.id === transferEnrollmentId);
    const targetCls = classes.find(c => c.id === transferTargetClassId);
    const entry = `${enr?.full_name || transferEnrollmentId}: turma anterior encerrada com histórico preservado -> nova turma ${targetCls?.name || transferTargetClassId} (${transferReason.trim()})`;
    setTransferHistoryLog(prev => [entry, ...prev]);
    setTransferReason('');
    setStatusMsg({
      type: 'ok',
      text: 'Remanejamento concluído com preservação integral do histórico da turma anterior.',
    });
    await onRefresh();
  };

  const handleConfirmPendingDraft = async () => {
    const draft = pendingDrafts.find(d => d.id === draftToEnroll);
    if (!draft || !draftTargetClassId) return;
    setBusy(true);
    setStatusMsg(null);
    const updateRes = await invokeMvp01('saveEnrollmentDraft', {
      id: draft.id,
      studentId: draft.student_id,
      studentName: draft.student_name,
      academicYearId: draft.academic_year_id,
      stage: draft.stage,
      classId: draftTargetClassId,
      status: 'EM_CONFERENCIA',
      docStatus: draft.doc_status || 'ACEITA',
      expectedVersion: draft.version,
    });
    if (!updateRes.ok) {
      setBusy(false);
      setStatusMsg({ type: 'err', text: updateRes.error });
      return;
    }
    const updated = updateRes.data;
    const confirmRes = await invokeMvp01('confirmEnrollmentDraft', {
      draftId: updated.id,
      expectedVersion: updated.version,
      idempotencyKey: buildIdempotencyKey('enr-draft'),
    });
    setBusy(false);
    if (!confirmRes.ok) {
      setStatusMsg({ type: 'err', text: confirmRes.error });
      return;
    }
    setDraftToEnroll('');
    setStatusMsg({
      type: 'ok',
      text: `Estudante ${draft.student_name} enturmado com sucesso (Matrícula ${confirmRes.data?.enrollmentId}).`,
    });
    await onRefresh();
  };

  const handleSaveTeacherAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignClassId || !assignTeacherId.trim() || !assignSubject.trim()) return;
    setBusy(true);
    setStatusMsg(null);
    const res = await invokeMvp01('saveClassAssignment', {
      teachingAssignment: {
        teacherUserId: assignTeacherId.trim(),
        teacherName: assignTeacherName.trim() || undefined,
        classId: assignClassId,
        subject: assignSubject.trim(),
        academicYearId: classes.find(c => c.id === assignClassId)?.academic_year_id,
        active: true,
      },
    });
    setBusy(false);
    if (!res.ok) {
      setStatusMsg({ type: 'err', text: res.error });
      return;
    }
    setStatusMsg({
      type: 'ok',
      text: `Docente ${assignTeacherName || assignTeacherId} vinculado em ${assignSubject}.`,
    });
    await onRefresh();
  };

  const handleSaveCoordAssignment = async () => {
    if (!assignClassId || !assignCoordUserId.trim()) return;
    setBusy(true);
    setStatusMsg(null);
    const cls = classes.find(c => c.id === assignClassId);
    const res = await invokeMvp01('saveClassAssignment', {
      coordinationAssignment: {
        coordinatorUserId: assignCoordUserId.trim(),
        classId: assignClassId,
        stage: cls?.stage || null,
        active: true,
      },
    });
    setBusy(false);
    if (!res.ok) {
      setStatusMsg({ type: 'err', text: res.error });
      return;
    }
    setStatusMsg({
      type: 'ok',
      text: `Coordenação (${assignCoordUserId}) vinculada à turma ${cls?.name || assignClassId}.`,
    });
    await onRefresh();
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs border ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Turmas Ativas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {classes.map(cls => (
          <div key={cls.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{cls.name}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
                {cls.status}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {cls.stage || 'Etapa'} • {cls.shift || 'Turno'} • {cls.room || 'Sala padrão'}
            </div>
            <div className="text-xs text-slate-200 mt-1">
              Ocupação: <strong>{cls.occupied ?? 0}</strong> / {cls.capacity} vagas
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Criar Turma */}
        <form
          onSubmit={handleCreateClass}
          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus size={15} className="text-emerald-400" />
            Criar Nova Turma (Capacidade / Ano / Etapa)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newClassYearId}
              onChange={e => setNewClassYearId(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            >
              {academicYears.map(ay => (
                <option key={ay.id} value={ay.id}>
                  {ay.year} — {ay.stage}
                </option>
              ))}
            </select>
            <select
              value={newClassStage}
              onChange={e => setNewClassStage(e.target.value as any)}
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="FUNDAMENTAL">Ensino Fundamental</option>
              <option value="MEDIO">Ensino Médio</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              required
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              placeholder="Nome (ex: 8A)"
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            />
            <select
              value={newClassShift}
              onChange={e => setNewClassShift(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="MATUTINO">Matutino</option>
              <option value="VESPERTINO">Vespertino</option>
              <option value="INTEGRAL">Integral</option>
            </select>
            <input
              type="number"
              min={1}
              max={100}
              value={newClassCap}
              onChange={e => setNewClassCap(Number(e.target.value))}
              placeholder="Capacidade"
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
          <input
            type="text"
            value={newClassRoom}
            onChange={e => setNewClassRoom(e.target.value)}
            placeholder="Sala física (opcional, ex: Sala 105)"
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 rounded-xl"
          >
            Salvar Turma
          </button>
        </form>

        {/* Remanejamento Preservando Histórico */}
        <form
          onSubmit={handleTransferStudent}
          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ArrowRightLeft size={15} className="text-amber-400" />
            Remanejamento de Turma (Preserva Histórico Anterior)
          </h3>
          <p className="text-[11px] text-slate-400">
            Encerra o vínculo vigente com data/hora e registra novo vínculo na turma de destino sem apagar notas ou chamadas anteriores.
          </p>
          <select
            value={transferEnrollmentId}
            onChange={e => setTransferEnrollmentId(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
          >
            <option value="">-- Selecione o aluno matriculado --</option>
            {enrollments.map(enr => (
              <option key={enr.id} value={enr.id}>
                {enr.full_name} • Turma atual: {classes.find(c => c.id === enr.class_id)?.name || enr.class_id || 'Sem turma'}
              </option>
            ))}
          </select>
          <select
            value={transferTargetClassId}
            onChange={e => setTransferTargetClassId(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
          >
            <option value="">-- Selecione a turma de destino --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.occupied ?? 0}/{c.capacity})
              </option>
            ))}
          </select>
          <input
            type="text"
            value={transferReason}
            onChange={e => setTransferReason(e.target.value)}
            placeholder="Motivo do remanejamento (mín. 3 caracteres) *"
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 rounded-xl"
          >
            Executar Remanejamento Preservando Histórico
          </button>
          {transferHistoryLog.length > 0 && (
            <div className="text-[11px] text-emerald-300 bg-black/30 rounded-lg p-2">
              {transferHistoryLog[0]}
            </div>
          )}
        </form>
      </div>

      {/* Enturmação de Rascunhos Pendentes + Vínculos MVP 0.1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-white">
            Enturmar Pré-Matrículas Pendentes ({pendingDrafts.length})
          </h3>
          {pendingDrafts.length === 0 ? (
            <p className="text-xs text-slate-400">Nenhuma pré-matrícula aguardando enturmação.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <select
                value={draftToEnroll}
                onChange={e => setDraftToEnroll(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="">-- Selecione pré-matrícula --</option>
                {pendingDrafts.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.student_name} ({d.status} • Doc: {d.doc_status})
                  </option>
                ))}
              </select>
              <select
                value={draftTargetClassId}
                onChange={e => setDraftTargetClassId(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="">-- Turma de destino --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.occupied ?? 0}/{c.capacity})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || !draftToEnroll || !draftTargetClassId}
                onClick={handleConfirmPendingDraft}
                className="sec-btn primary"
              >
                Confirmar Enturmação
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSaveTeacherAssignment}
          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
        >
          <h3 className="text-sm font-bold text-white">Atribuir Docente / Coordenação na Base MVP 0.1</h3>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={assignClassId}
              onChange={e => setAssignClassId(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={assignSubject}
              onChange={e => setAssignSubject(e.target.value)}
              placeholder="Disciplina"
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={assignTeacherId}
              onChange={e => setAssignTeacherId(e.target.value)}
              placeholder="ID do Docente (ex: user-demo-multi)"
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            />
            <input
              type="text"
              value={assignTeacherName}
              onChange={e => setAssignTeacherName(e.target.value)}
              placeholder="Nome do Docente"
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="sec-btn primary">
              Vincular Docente
            </button>
            <input
              type="text"
              value={assignCoordUserId}
              onChange={e => setAssignCoordUserId(e.target.value)}
              placeholder="ID Coordenação"
              className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white flex-1"
            />
            <button type="button" disabled={busy} onClick={handleSaveCoordAssignment} className="sec-btn">
              Vincular Coordenação
            </button>
          </div>
        </form>
      </div>

      {/* Matriz Legada Preservada */}
      <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
        <TeacherClassLinkManager />
      </div>
    </div>
  );
};

// ============================================================================
// ABA 6: PESOS & AVALIAÇÕES VERSIONADOS + FECHAR/REABRIR PERÍODO
// ============================================================================

interface GradingPanelProps {
  overview: Mvp01SecretariatOverviewData | null;
  onRefresh: () => Promise<void>;
}

export const Mvp01SecretariatGradingPanel: React.FC<GradingPanelProps> = ({
  overview,
  onRefresh,
}) => {
  const classes = overview?.classes || [];
  const periods = overview?.academicPeriods || [];

  const [classId, setClassId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [n1Weight, setN1Weight] = useState<number>(40);
  const [n2Weight, setN2Weight] = useState<number>(40);
  const [n3Weight, setN3Weight] = useState<number>(20);
  const [scaleMax, setScaleMax] = useState<number>(10);
  const [passingGrade, setPassingGrade] = useState<number>(6);
  const [roundingRule, setRoundingRule] = useState('HALF_UP_0_5');
  const [recoveryRule, setRecoveryRule] = useState('MAX_WITH_RECOVERY');
  const [reopenReasons, setReopenReasons] = useState<Record<string, string>>({});
  const [savedPolicies, setSavedPolicies] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSavePolicyVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const sum = n1Weight + n2Weight + n3Weight;
    if (sum <= 0) {
      setFeedback({ type: 'err', text: 'A soma dos pesos deve ser maior que zero.' });
      return;
    }
    const res = await invokeMvp01('saveGradingPolicyVersion', {
      classId: classId || null,
      subject: subject.trim() || null,
      weights: {
        n1: Number((n1Weight / sum).toFixed(2)),
        n2: Number((n2Weight / sum).toFixed(2)),
        n3: Number((n3Weight / sum).toFixed(2)),
      },
      scaleMax,
      roundingRule,
      passingGrade,
      recoveryRule,
    });
    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error });
      return;
    }
    setSavedPolicies(prev => [res.data, ...prev]);
    setFeedback({
      type: 'ok',
      text: `Versão v${res.data?.version_number || 'nova'} da política avaliativa salva (${res.data?.id}).`,
    });
  };

  const handleClosePeriod = async (periodId: string) => {
    setFeedback(null);
    const res = await invokeMvp01('closeAcademicPeriod', { periodId });
    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error });
      return;
    }
    setFeedback({ type: 'ok', text: `Período ${res.data?.name || periodId} fechado para lançamentos.` });
    await onRefresh();
  };

  const handleReopenPeriod = async (periodId: string) => {
    const reason = (reopenReasons[periodId] || '').trim();
    if (reason.length < 5) {
      setFeedback({
        type: 'err',
        text: 'Informe um motivo de reabertura com pelo menos 5 caracteres.',
      });
      return;
    }
    setFeedback(null);
    const res = await invokeMvp01('reopenAcademicPeriod', { periodId, reason });
    if (!res.ok) {
      setFeedback({ type: 'err', text: res.error });
      return;
    }
    setReopenReasons(prev => ({ ...prev, [periodId]: '' }));
    setFeedback({ type: 'ok', text: `Período ${res.data?.name || periodId} reaberto com justificativa registrada.` });
    await onRefresh();
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs border ${
            feedback.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Diferenciação explícita 0.0 / PENDENTE / DISPENSADO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
          <div className="font-bold text-red-300 mb-1">Nota 0.0 (GRADED)</div>
          <p className="text-slate-300">
            Nota numérica efetivamente lançada após avaliação realizada. Entra no cálculo ponderado da média.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
          <div className="font-bold text-amber-300 mb-1">Pendente — &quot;—&quot; (PENDING)</div>
          <p className="text-slate-300">
            Avaliação ainda não lançada. Nunca é convertida automaticamente em 0.0 no boletim.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
          <div className="font-bold text-blue-300 mb-1">Dispensado (EXEMPT)</div>
          <p className="text-slate-300">
            Estudante formalmente dispensado da atividade/componente. Não penaliza a média final.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Versionamento de Política */}
        <form
          onSubmit={handleSavePolicyVersion}
          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders size={15} className="text-purple-400" />
            Nova Versão de Política de Avaliação
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={classId}
              onChange={e => setClassId(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="">Padrão Institucional (Todas as Turmas)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Disciplina (vazio = todas)"
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Peso N1 (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={n1Weight}
                onChange={e => setN1Weight(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Peso N2 (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={n2Weight}
                onChange={e => setN2Weight(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Peso N3 (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={n3Weight}
                onChange={e => setN3Weight(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Escala Máx.</label>
              <input
                type="number"
                min={1}
                value={scaleMax}
                onChange={e => setScaleMax(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Média Mín.</label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={scaleMax}
                value={passingGrade}
                onChange={e => setPassingGrade(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Arredondamento</label>
              <select
                value={roundingRule}
                onChange={e => setRoundingRule(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white"
              >
                <option value="HALF_UP_0_5">0,5 (HALF_UP)</option>
                <option value="HALF_UP_0_1">0,1 (Decimal)</option>
                <option value="NONE">Exato</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Recuperação</label>
              <select
                value={recoveryRule}
                onChange={e => setRecoveryRule(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-white"
              >
                <option value="MAX_WITH_RECOVERY">Maior Nota</option>
                <option value="WEIGHTED_AVERAGE">Média c/ Recup.</option>
              </select>
            </div>
          </div>

          <button type="submit" className="sec-btn primary" style={{ height: 34 }}>
            Publicar Nova Versão da Política
          </button>

          {savedPolicies.length > 0 && (
            <div className="text-[11px] text-slate-300 bg-black/40 p-2.5 rounded-lg">
              Última versão publicada: <strong>v{savedPolicies[0].version_number}</strong> • {savedPolicies[0].id}
            </div>
          )}
        </form>

        {/* Períodos Letivos */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock size={15} className="text-amber-400" />
            Fechamento & Reabertura de Períodos Letivos
          </h3>
          <div className="flex flex-col gap-2">
            {periods.map(p => (
              <div key={p.id} className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{p.name}</span>{' '}
                    <span className="text-slate-400">
                      ({p.start_date || '—'} a {p.end_date || '—'})
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      p.status === 'OPEN'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-red-500/15 text-red-300'
                    }`}
                  >
                    {p.status === 'OPEN' ? 'ABERTO' : 'FECHADO'}
                  </span>
                </div>
                {p.reopen_reason && (
                  <div className="text-[11px] text-amber-300">
                    Último motivo de reabertura: {p.reopen_reason}
                  </div>
                )}
                {p.status === 'OPEN' ? (
                  <button
                    type="button"
                    onClick={() => handleClosePeriod(p.id)}
                    className="sec-btn"
                    style={{ alignSelf: 'flex-start', borderColor: 'rgba(245,158,11,0.4)', color: '#FCD34D' }}
                  >
                    <Lock size={12} />
                    <span>Fechar Período</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={reopenReasons[p.id] || ''}
                      onChange={e => setReopenReasons(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="Motivo obrigatório para reabrir (mín. 5 chars)"
                      className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleReopenPeriod(p.id)}
                      className="sec-btn primary"
                    >
                      <Unlock size={12} />
                      <span>Reabrir com Motivo</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configurador legado preservado */}
      <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
        <GradeWeightConfig />
      </div>
    </div>
  );
};

// ============================================================================
// ABA 8: RELATÓRIOS & DOCUMENTOS (TOKEN, HASH SHA-256, REVOGAÇÃO & COMUNICADOS)
// ============================================================================

interface DocumentsPanelProps {
  overview: Mvp01SecretariatOverviewData | null;
  onRefresh: () => Promise<void>;
}

export const Mvp01SecretariatDocumentsPanel: React.FC<DocumentsPanelProps> = ({
  overview,
  onRefresh,
}) => {
  const [subView, setSubView] = useState<'mvp-docs' | 'lote-boletins' | 'conselho-tutelar'>('mvp-docs');
  const enrollments = overview?.enrollments || [];
  const classes = overview?.classes || [];
  const issuedDocuments = overview?.issuedDocuments || [];

  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>(enrollments[0]?.id || '');
  const [docType, setDocType] = useState<
    'DECLARACAO_MATRICULA' | 'DECLARACAO_FREQUENCIA' | 'FICHA_INDIVIDUAL' | 'BOLETIM'
  >('DECLARACAO_MATRICULA');
  const [lastIssued, setLastIssued] = useState<any>(null);

  const [verifyTokenInput, setVerifyTokenInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const [revokeReasons, setRevokeReasons] = useState<Record<string, string>>({});

  // Comunicados
  const [commTitle, setCommTitle] = useState('');
  const [commBody, setCommBody] = useState('');
  const [commScope, setCommScope] = useState<'ALL_SCHOOL' | 'CLASS' | 'STUDENT'>('ALL_SCHOOL');
  const [commClassId, setCommClassId] = useState('');
  const [commStudentId, setCommStudentId] = useState('');
  const [commAuthReq, setCommAuthReq] = useState(false);

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!selectedEnrollmentId && enrollments[0]?.id) {
      setSelectedEnrollmentId(enrollments[0].id);
    }
  }, [enrollments, selectedEnrollmentId]);

  const handleIssueDocument = async () => {
    const enr = enrollments.find(e => e.id === selectedEnrollmentId);
    if (!enr) {
      setMsg({ type: 'err', text: 'Selecione uma matrícula válida para emitir o documento.' });
      return;
    }
    setMsg(null);
    const res = await invokeMvp01('issueDocument', {
      studentId: enr.student_id,
      enrollmentId: enr.id,
      docType,
      idempotencyKey: buildIdempotencyKey('doc'),
    });
    if (!res.ok) {
      setMsg({ type: 'err', text: res.error });
      return;
    }
    setLastIssued(res.data);
    setVerifyTokenInput(res.data?.verificationToken || '');
    setMsg({
      type: 'ok',
      text: `Documento emitido com Token ${res.data?.verificationToken} e Hash SHA-256 registrado.`,
    });
    await onRefresh();
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTokenInput.trim()) return;
    setMsg(null);
    const res = await invokeMvp01('verifyDocumentToken', { token: verifyTokenInput.trim() });
    if (!res.ok) {
      setMsg({ type: 'err', text: res.error });
      return;
    }
    setVerifyResult(res.data);
  };

  const handleRevokeDocument = async (documentId: string) => {
    const reason = (revokeReasons[documentId] || '').trim();
    if (reason.length < 3) {
      setMsg({ type: 'err', text: 'Informe o motivo da revogação (mín. 3 caracteres).' });
      return;
    }
    setMsg(null);
    const res = await invokeMvp01('revokeDocument', { documentId, reason });
    if (!res.ok) {
      setMsg({ type: 'err', text: res.error });
      return;
    }
    setRevokeReasons(prev => ({ ...prev, [documentId]: '' }));
    setMsg({ type: 'ok', text: `Documento ${documentId} revogado com sucesso.` });
    await onRefresh();
  };

  const handlePublishCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commTitle.trim() || !commBody.trim()) return;
    if (commScope === 'CLASS' && !commClassId.trim()) {
      setMsg({ type: 'err', text: 'Selecione a turma destinatária antes de publicar o comunicado.' });
      return;
    }
    if (commScope === 'STUDENT' && !commStudentId.trim()) {
      setMsg({ type: 'err', text: 'Selecione o estudante destinatário antes de publicar o comunicado.' });
      return;
    }
    setMsg(null);
    const res = await invokeMvp01('publishCommunication', {
      title: commTitle.trim(),
      body: commBody.trim(),
      targetScope: commScope,
      ...(commScope === 'CLASS' ? { targetClassId: commClassId.trim() } : {}),
      ...(commScope === 'STUDENT' ? { targetStudentId: commStudentId.trim() } : {}),
      requiresAuthorization: commAuthReq,
    });
    if (!res.ok) {
      setMsg({ type: 'err', text: res.error });
      return;
    }
    setCommTitle('');
    setCommBody('');
    setCommAuthReq(false);
    setMsg({ type: 'ok', text: `Comunicado oficial publicado (${res.data?.id}).` });
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`sec-tab-btn ${subView === 'mvp-docs' ? 'active' : ''}`}
            onClick={() => setSubView('mvp-docs')}
          >
            <ShieldCheck size={14} />
            <span>Emissão, Token & Verificação de Integridade</span>
          </button>
          <button
            type="button"
            className={`sec-tab-btn ${subView === 'lote-boletins' ? 'active' : ''}`}
            onClick={() => setSubView('lote-boletins')}
          >
            <FileText size={14} />
            <span>Boletins em Lote / PDF</span>
          </button>
          <button
            type="button"
            className={`sec-tab-btn ${subView === 'conselho-tutelar' ? 'active' : ''}`}
            onClick={() => setSubView('conselho-tutelar')}
          >
            <ShieldAlert size={14} />
            <span>Conselho Tutelar (LDB)</span>
          </button>
        </div>
      </div>

      {subView === 'lote-boletins' && <SecretariatBoletimManager />}
      {subView === 'conselho-tutelar' && <TutelaryCouncilReport />}

      {subView === 'mvp-docs' && (
        <>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs text-blue-200">
            <strong>Verificação de Integridade e Autenticidade do Registro:</strong> Cada documento recebe Token de Verificação e Hash SHA-256 do snapshot emitido. Este controle verifica integridade interna no Áquila Pro e <strong>não configura assinatura eletrônica qualificada (ICP-Brasil)</strong>.
          </div>

          {msg && (
            <div
              className={`p-3 rounded-xl text-xs border ${
                msg.type === 'ok'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {msg.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Emissor */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white">Emitir Documento Oficial</h3>
              <select
                value={selectedEnrollmentId}
                onChange={e => setSelectedEnrollmentId(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="">-- Selecione a matrícula / estudante --</option>
                {enrollments.map(enr => (
                  <option key={enr.id} value={enr.id}>
                    {enr.full_name} ({enr.registration_code || enr.student_id}) — Matrícula {enr.id}
                  </option>
                ))}
              </select>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value as any)}
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="DECLARACAO_MATRICULA">Declaração de Matrícula</option>
                <option value="DECLARACAO_FREQUENCIA">Declaração de Frequência</option>
                <option value="FICHA_INDIVIDUAL">Ficha Individual</option>
                <option value="BOLETIM">Boletim Escolar</option>
              </select>
              <button type="button" onClick={handleIssueDocument} className="sec-btn primary" style={{ height: 34 }}>
                <FileText size={14} /> Emitir Documento & Gerar Token
              </button>

              {lastIssued && (
                <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/30 text-xs flex flex-col gap-1">
                  <div className="font-bold text-emerald-300">
                    Emitido: {lastIssued.docType} (v{lastIssued.version}) • Status: {lastIssued.status === 'ACTIVE' ? 'ATIVO' : lastIssued.status}
                  </div>
                  <div className="font-mono text-[11px] text-white break-all">
                    Token: {lastIssued.verificationToken}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 break-all">
                    SHA-256: {lastIssued.contentHashSha256}
                  </div>
                </div>
              )}
            </div>

            {/* Conferência por Token (sem expor dados sensíveis) */}
            <form
              onSubmit={handleVerifyToken}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
            >
              <h3 className="text-sm font-bold text-white">Consultar Autenticidade por Token</h3>
              <p className="text-[11px] text-slate-400">
                Retorna exclusivamente status (ATIVO/REVOGADO), tipo, hash SHA-256 e emissor — sem expor notas ou dados clínicos.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyTokenInput}
                  onChange={e => setVerifyTokenInput(e.target.value)}
                  placeholder="Cole o Token de Verificação..."
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
                <button type="submit" className="sec-btn primary" style={{ height: 34 }}>
                  <Search size={13} /> Verificar
                </button>
              </div>

              {verifyResult && (
                <div className="p-3 rounded-xl bg-black/50 border border-white/15 text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      {verifyResult.status === 'NOT_FOUND'
                        ? 'Token não encontrado'
                        : `${verifyResult.docType} (v${verifyResult.version})`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        verifyResult.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-red-500/15 text-red-300'
                      }`}
                    >
                      {verifyResult.status === 'ACTIVE'
                        ? 'ATIVO'
                        : verifyResult.status === 'REVOKED'
                        ? 'REVOGADO'
                        : 'INVÁLIDO'}
                    </span>
                  </div>
                  {verifyResult.status !== 'NOT_FOUND' && (
                    <>
                      <div className="text-[11px] text-slate-300">
                        Escola: {verifyResult.schoolName || verifyResult.schoolId} • Emissor: {verifyResult.issuerName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Emitido em: {formatDateTimePt(verifyResult.issuedAt)}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 break-all">
                        SHA-256: {verifyResult.contentHashSha256}
                      </div>
                      {verifyResult.revokedReason && (
                        <div className="text-[11px] text-red-300">
                          Motivo da revogação: {verifyResult.revokedReason}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Lista de Documentos Emitidos + Revogação */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white">Documentos Emitidos ({issuedDocuments.length})</h3>
            {issuedDocuments.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum documento emitido ainda.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {issuedDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-white">{doc.doc_type} (v{doc.version})</span>{' '}
                        <span className="text-slate-400">• Aluno: {doc.student_id}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          doc.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-red-500/15 text-red-300'
                        }`}
                      >
                        {doc.status === 'ACTIVE' ? 'ATIVO' : 'REVOGADO'}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-300 break-all">
                      Token: {doc.verification_token} • SHA-256: {doc.content_hash_sha256}
                    </div>
                    {doc.status === 'ACTIVE' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={revokeReasons[doc.id] || ''}
                          onChange={e => setRevokeReasons(prev => ({ ...prev, [doc.id]: e.target.value }))}
                          placeholder="Motivo da revogação (mín. 3 chars)"
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRevokeDocument(doc.id)}
                          className="sec-btn"
                          style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#FCA5A5' }}
                        >
                          <Ban size={12} /> Revogar Documento
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comunicados Oficiais */}
          <form
            onSubmit={handlePublishCommunication}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send size={15} className="text-emerald-400" />
              Publicar Comunicado Oficial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                required
                value={commTitle}
                onChange={e => setCommTitle(e.target.value)}
                placeholder="Título do comunicado"
                className="md:col-span-2 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
              />
              <select
                value={commScope}
                onChange={e => setCommScope(e.target.value as any)}
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="ALL_SCHOOL">Toda a Escola</option>
                <option value="CLASS">Turma Específica</option>
                <option value="STUDENT">Estudante Específico</option>
              </select>
            </div>
            {commScope === 'CLASS' && (
              <select
                value={commClassId}
                onChange={e => setCommClassId(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="">-- Selecione a turma --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {commScope === 'STUDENT' && (
              <select
                value={commStudentId}
                onChange={e => setCommStudentId(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="">-- Selecione o estudante --</option>
                {enrollments.map(e => (
                  <option key={e.id} value={e.student_id}>{e.full_name}</option>
                ))}
              </select>
            )}
            <textarea
              required
              rows={2}
              value={commBody}
              onChange={e => setCommBody(e.target.value)}
              placeholder="Texto oficial do comunicado..."
              className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commAuthReq}
                  onChange={e => setCommAuthReq(e.target.checked)}
                />
                Exige autorização formal do responsável legal
              </label>
              <button type="submit" className="sec-btn primary" style={{ height: 32 }}>
                <Send size={13} /> Publicar Comunicado
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};
