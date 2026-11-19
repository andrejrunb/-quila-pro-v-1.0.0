import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  MapPin,
  Search,
  UserPlus,
  Users,
  HeartPulse,
  Camera,
  FileCheck2,
  Building2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react';
import { lookupCep } from '../../services/BrasilApiService';
import { isMvp01Active } from '../../config/mvpProfile';
import { StudentBatchImportManager } from './StudentBatchImportManager';
import { invokeMvp01 } from './Mvp01SecretariatSuite';

interface GuardianEntry {
  localId: string;
  guardianUserId: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  relationship: string;
  isLegalGuardian: boolean;
  canViewPortal: boolean;
  isEmergencyContact: boolean;
  canPickup: boolean;
  isFinancialResponsible: boolean;
  hasJudicialRestriction: boolean;
}

const createEmptyGuardian = (index: number): GuardianEntry => ({
  localId: `g-${Date.now()}-${index}`,
  guardianUserId: '',
  guardianName: '',
  guardianPhone: '',
  guardianEmail: '',
  relationship: index === 0 ? 'Mãe' : 'Responsável',
  isLegalGuardian: index === 0,
  canViewPortal: index === 0,
  isEmergencyContact: true,
  canPickup: index === 0,
  isFinancialResponsible: index === 0,
  hasJudicialRestriction: false,
});

function buildKey(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}-${hex}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateUniqueGuardianUserId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return buildKey('guard');
}

export const SecretariatRegistrationManager: React.FC = () => {
  const [mode, setMode] = useState<'wizard' | 'csv'>('wizard');
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Dados carregados da base MVP 0.1 + legado
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [mvpClasses, setMvpClasses] = useState<any[]>([]);
  const [existingCandidates, setExistingCandidates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState<string | null>(null);

  // Etapa 2: Responsáveis separados por finalidade
  const [guardians, setGuardians] = useState<GuardianEntry[]>([createEmptyGuardian(0)]);

  // Etapa 3: Dados + Saúde restrita + Foto opcional + Endereço + Checklist + OCR
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    registrationCode: '',
    pickupNotes: '',
    healthSummaryRestricted: '',
    allergies: '',
    photoUrl: '',
    cep: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [docStatus, setDocStatus] = useState<'PENDENTE' | 'EM_ANALISE' | 'ACEITA' | 'RECUSADA'>('EM_ANALISE');
  const [docChecklist, setDocChecklist] = useState({
    certidaoOuRg: false,
    comprovanteResidencia: false,
    historicoEscolar: false,
    cartaoVacina: false,
  });
  const [ocrSnippet, setOcrSnippet] = useState('');
  const [ocrCandidate, setOcrCandidate] = useState<{
    name?: string;
    birthDate?: string;
    cep?: string;
    confirmed: boolean;
  } | null>(null);

  // Etapa 4: Oferta / Turma ou Enturmação Pendente
  const [academicYearId, setAcademicYearId] = useState('ay-2026-fund');
  const [stage, setStage] = useState<'FUNDAMENTAL' | 'MEDIO'>('FUNDAMENTAL');
  const [classId, setClassId] = useState('');
  const [pendingPlacement, setPendingPlacement] = useState(false);

  // Etapa 5: Rascunho, Validação e Confirmação Transacional
  const [draftRecord, setDraftRecord] = useState<any | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    blockingIssues: string[];
    warnings: string[];
  } | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => buildKey('confirm-enr'));

  const [cepStatus, setCepStatus] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  const [confirmationMeta, setConfirmationMeta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCatalog = async () => {
      const ovRes = await invokeMvp01<any>('getPortalOverview', { portal: 'secretariat' });
      const candidates: any[] = [];
      if (ovRes.ok && ovRes.data) {
        const years = ovRes.data.academicYears || [];
        const cls = ovRes.data.classes || [];
        setAcademicYears(years);
        setMvpClasses(cls);
        if (years.length > 0) {
          setAcademicYearId(years[0].id);
          setStage(years[0].stage === 'MEDIO' ? 'MEDIO' : 'FUNDAMENTAL');
        }
        if (cls.length > 0 && !classId) {
          setClassId(cls[0].id);
        }
        for (const e of ovRes.data.enrollments || []) {
          candidates.push({
            id: e.student_id,
            name: e.full_name,
            code: e.registration_code || e.student_id,
            classId: e.class_id,
            source: 'MVP 0.1',
          });
        }
      }
      try {
        const legacy = await (window as any).aquila?.invoke?.('get-students');
        if (Array.isArray(legacy)) {
          for (const s of legacy) {
            if (!candidates.some(c => c.id === s.id)) {
              candidates.push({
                id: s.id,
                name: s.name || 'Aluno',
                code: s.registrationNumber || s.id,
                classId: s.classId,
                source: 'Legado',
              });
            }
          }
        }
      } catch {
        // segue sem legado
      }
      setExistingCandidates(candidates);
    };
    loadCatalog();
  }, []);

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return existingCandidates.slice(0, 8);
    return existingCandidates
      .filter(
        c =>
          String(c.name || '').toLowerCase().includes(q) ||
          String(c.code || '').toLowerCase().includes(q) ||
          String(c.id || '').toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [existingCandidates, searchQuery]);

  const handleLookupCep = async () => {
    const digits = formData.cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      setCepStatus('Informe um CEP válido com 8 dígitos.');
      return;
    }
    setCepLoading(true);
    setCepStatus(null);
    const result = await lookupCep(digits);
    setCepLoading(false);
    if (!result) {
      setCepStatus('CEP não encontrado ou sem conexão no momento.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      street: result.street || prev.street,
      neighborhood: result.neighborhood || prev.neighborhood,
      city: result.city || prev.city,
      state: result.state || prev.state,
    }));
    setCepStatus(`Endereço preenchido automaticamente (${result.provider}).`);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExtractOcrCandidate = () => {
    const text = ocrSnippet.trim();
    if (!text) return;
    const cepMatch = text.match(/\b(\d{5}-?\d{3})\b/);
    const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\b/);
    const firstLine = text.split(/\r?\n/)[0]?.replace(/^(nome|aluno)\s*:\s*/i, '').trim();
    let parsedBirth: string | undefined;
    if (dateMatch?.[1]) {
      if (dateMatch[1].includes('/')) {
        const [d, m, y] = dateMatch[1].split('/');
        parsedBirth = `${y}-${m}-${d}`;
      } else {
        parsedBirth = dateMatch[1];
      }
    }
    setOcrCandidate({
      name: firstLine && firstLine.length >= 3 ? firstLine : undefined,
      birthDate: parsedBirth,
      cep: cepMatch?.[1],
      confirmed: false,
    });
  };

  const handleApplyOcrCandidate = () => {
    if (!ocrCandidate) return;
    setFormData(prev => ({
      ...prev,
      name: ocrCandidate.name || prev.name,
      birthDate: ocrCandidate.birthDate || prev.birthDate,
      cep: ocrCandidate.cep || prev.cep,
    }));
    setOcrCandidate(prev => (prev ? { ...prev, confirmed: true } : null));
  };

  const updateGuardian = (idx: number, patch: Partial<GuardianEntry>) => {
    setGuardians(prev =>
      prev.map((g, i) => {
        if (i !== idx) return g;
        const merged = { ...g, ...patch };
        if (merged.hasJudicialRestriction) {
          merged.canViewPortal = false;
          merged.canPickup = false;
        }
        return merged;
      })
    );
  };

  const buildDraftPayload = () => ({
    id: draftRecord?.id,
    studentId: selectedExistingStudentId || null,
    studentName: formData.name.trim(),
    academicYearId,
    stage,
    classId: pendingPlacement ? null : classId.trim() || null,
    status: (pendingPlacement ? 'EM_CONFERENCIA' : 'EM_CONFERENCIA') as 'EM_CONFERENCIA',
    docStatus,
    docChecklist: {
      ...docChecklist,
      ocrConfirmedByHuman: ocrCandidate ? ocrCandidate.confirmed : true,
    },
    payload: {
      birthDate: formData.birthDate || null,
      registrationCode: formData.registrationCode || null,
      photoUrl: formData.photoUrl || null,
      healthSummaryRestricted: formData.healthSummaryRestricted || null,
      allergies: formData.allergies || null,
      pickupNotes: formData.pickupNotes || null,
      address: {
        cep: formData.cep,
        street: formData.street,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
      },
      guardians,
    },
    expectedVersion: draftRecord?.version,
  });

  const handleSaveDraft = async () => {
    setError(null);
    if (!formData.name.trim()) {
      setError('Informe o nome completo do estudante antes de salvar.');
      return null;
    }
    setSubmitting(true);
    const res = await invokeMvp01('saveEnrollmentDraft', buildDraftPayload());
    setSubmitting(false);
    if (!res.ok) {
      if (res.code !== 'BRIDGE_UNAVAILABLE') {
        setError(res.error);
      }
      return null;
    }
    setDraftRecord(res.data);
    return res.data;
  };

  const handleValidateDraft = async () => {
    const saved = draftRecord || (await handleSaveDraft());
    if (!saved?.id) return;
    setSubmitting(true);
    setError(null);
    const res = await invokeMvp01('validateEnrollmentDraft', { draftId: saved.id });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setValidationResult(res.data);
  };

  const persistGuardiansForStudent = async (studentId: string): Promise<string[]> => {
    const errors: string[] = [];
    for (let i = 0; i < guardians.length; i++) {
      const g = guardians[i];
      if (!g.guardianName.trim()) continue;
      const guardianUserId = g.guardianUserId.trim() || generateUniqueGuardianUserId();
      const linkRes = await invokeMvp01('saveGuardianLink', {
        studentId,
        guardianUserId,
        guardianName: g.guardianName.trim(),
        guardianPhone: g.guardianPhone.trim() || undefined,
        guardianEmail: g.guardianEmail.trim() || undefined,
        relationship: g.relationship || 'Responsável',
        isLegalGuardian: g.isLegalGuardian,
        canViewPortal: g.canViewPortal,
        isEmergencyContact: g.isEmergencyContact,
        canPickup: g.canPickup,
        isFinancialResponsible: g.isFinancialResponsible,
        hasJudicialRestriction: g.hasJudicialRestriction,
      });
      if (!linkRes.ok) {
        errors.push(`${g.guardianName.trim()}: ${linkRes.error}`);
      }
    }
    return errors;
  };

  const handleConfirmRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.name.trim()) {
      setError('Nome completo do estudante é obrigatório.');
      return;
    }

    const primaryGuardianPhone = guardians.find(g => g.guardianPhone.trim())?.guardianPhone.trim();

    // Se usuário escolheu Enturmação Pendente, apenas salva rascunho em conferência
    if (pendingPlacement) {
      const saved = await handleSaveDraft();
      if (saved) {
        setCreatedStudentId(saved.id);
        setConfirmationMeta('Pré-matrícula salva com enturmação pendente em Conferência (Secretaria).');
      }
      return;
    }

    const mvp01Active = isMvp01Active();
    const isKnownMvpClass = mvpClasses.some(c => c.id === classId.trim());
    const hasMvpBridge = Boolean((window as any).aquila?.mvp01?.confirmEnrollmentDraft);

    if (mvp01Active && hasMvpBridge) {
      if (!classId.trim()) {
        setError('Selecione uma turma ativa válida no MVP 0.1 ou marque "Enturmação Pendente".');
        return;
      }
      if (mvpClasses.length > 0 && !isKnownMvpClass) {
        setError('Turma selecionada não pertence ao catálogo ativo do MVP 0.1. Escolha uma turma válida ou marque "Enturmação Pendente".');
        return;
      }

      setSubmitting(true);
      const draftRes = await invokeMvp01('saveEnrollmentDraft', buildDraftPayload());
      if (!draftRes.ok) {
        setSubmitting(false);
        setError(draftRes.error);
        return;
      }
      const savedDraft = draftRes.data;
      setDraftRecord(savedDraft);

      const confirmRes = await invokeMvp01('confirmEnrollmentDraft', {
        draftId: savedDraft.id,
        expectedVersion: savedDraft.version,
        idempotencyKey,
      });

      if (!confirmRes.ok) {
        setSubmitting(false);
        setError(confirmRes.error);
        return;
      }

      const newStudentId = confirmRes.data?.studentId;
      let guardianErrors: string[] = [];
      if (newStudentId) {
        guardianErrors = await persistGuardiansForStudent(newStudentId);
      }
      setSubmitting(false);

      setCreatedStudentId(newStudentId || confirmRes.data?.enrollmentId);
      setConfirmationMeta(
        `Matrícula confirmada transacionalmente (${confirmRes.data?.enrollmentId}) • Chave idempotente: ${idempotencyKey}`
      );
      if (guardianErrors.length > 0) {
        setError(
          `Matrícula confirmada, mas houve falha ao vincular responsável(is): ${guardianErrors.join(' | ')}`
        );
      }
      setIdempotencyKey(buildKey('confirm-enr'));
      setDraftRecord(null);
      setValidationResult(null);
      return;
    }

    if (mvp01Active) {
      setError('A ponte IPC do MVP 0.1 não está disponível no momento para confirmar a matrícula.');
      return;
    }

    // Fallback legado estrito compatível com createStudent({ name, classId, parentPhone }) quando MVP 0.1 está desativado
    if (!classId.trim()) {
      setError('Informe ou selecione a turma para efetivar o cadastro.');
      return;
    }

    try {
      setSubmitting(true);
      const legacyPayload: { name: string; classId: string; parentPhone?: string } = {
        name: formData.name.trim(),
        classId: classId.trim(),
      };
      if (primaryGuardianPhone) {
        legacyPayload.parentPhone = primaryGuardianPhone;
      }
      const result = await (window as any).aquila?.createStudent?.(legacyPayload);
      setSubmitting(false);
      if (!result?.success) {
        setError(result?.error || 'Não foi possível cadastrar o aluno.');
        return;
      }
      setCreatedStudentId(result.studentId);
      setConfirmationMeta('Cadastro efetivado via contrato padrão da secretaria.');
      setError(null);
      setCepStatus(null);
    } catch {
      setSubmitting(false);
      setError('Não foi possível cadastrar o aluno.');
    }
  };

  const stepItems = [
    { id: 1 as const, label: '1. Buscar Existente' },
    { id: 2 as const, label: '2. Responsáveis' },
    { id: 3 as const, label: '3. Dados, Saúde & Docs' },
    { id: 4 as const, label: '4. Oferta / Turma' },
    { id: 5 as const, label: '5. Confirmar' },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fade-in text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserPlus className="text-emerald-500" size={24} />
          <div>
            <h2 className="text-xl font-bold">Alunos, Matrículas & Importação</h2>
            <p className="text-xs text-zinc-400">
              Assistente em 5 etapas com busca prévia, responsáveis por finalidade, área restrita de saúde, CEP BrasilAPI e confirmação transacional idempotente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('wizard')}
            className={`sec-tab-btn ${mode === 'wizard' ? 'active' : ''}`}
          >
            <UserPlus size={14} />
            <span>Assistente de Matrícula</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('csv')}
            className={`sec-tab-btn ${mode === 'csv' ? 'active' : ''}`}
          >
            <UploadCloud size={14} />
            <span>Importação CSV em Lote</span>
          </button>
        </div>
      </div>

      {mode === 'csv' ? (
        <StudentBatchImportManager />
      ) : (
        <>
          {/* Stepper */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {stepItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStep(item.id)}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                  step === item.id
                    ? 'bg-emerald-500/20 border-emerald-500 text-white'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form
              onSubmit={handleConfirmRegistration}
              className="lg:col-span-2 flex flex-col gap-4 bg-white/5 p-5 rounded-2xl border border-white/10"
            >
              {/* ETAPA 1 */}
              {step === 1 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <Search size={16} /> Etapa 1 — Buscar antes de cadastrar (Evitar Duplicidade)
                  </h3>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome, código de matrícula ou ID..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-emerald-500"
                  />
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                    {filteredCandidates.map(cand => (
                      <div
                        key={cand.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          selectedExistingStudentId === cand.id
                            ? 'bg-emerald-500/15 border-emerald-500'
                            : 'bg-black/40 border-white/10'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white">{cand.name}</div>
                          <div className="text-zinc-400">
                            Código: {cand.code} • Turma: {cand.classId || 'Sem turma'} ({cand.source})
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExistingStudentId(cand.id);
                            setFormData(prev => ({ ...prev, name: cand.name }));
                            setStep(2);
                          }}
                          className="sec-btn primary"
                        >
                          Usar Prontuário
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    {selectedExistingStudentId ? (
                      <button
                        type="button"
                        onClick={() => setSelectedExistingStudentId(null)}
                        className="sec-btn"
                      >
                        Limpar vínculo existente (Novo aluno)
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-400">
                        Nenhuma duplicidade selecionada — prosseguir como novo estudante.
                      </span>
                    )}
                    <button type="button" onClick={() => setStep(2)} className="sec-btn primary">
                      Avançar para Responsáveis
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 2 */}
              {step === 2 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <Users size={16} /> Etapa 2 — Responsáveis Separados por Finalidade
                    </h3>
                    <button
                      type="button"
                      onClick={() => setGuardians(prev => [...prev, createEmptyGuardian(prev.length)])}
                      className="sec-btn"
                    >
                      <Plus size={13} /> Adicionar Responsável / Contato
                    </button>
                  </div>

                  {guardians.map((g, idx) => (
                    <div key={g.localId} className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Vínculo Familiar #{idx + 1}</span>
                        {guardians.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setGuardians(prev => prev.filter((_, i) => i !== idx))}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Remover
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Nome completo"
                          value={g.guardianName}
                          onChange={e => updateGuardian(idx, { guardianName: e.target.value })}
                          className="md:col-span-2 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="Telefone / WhatsApp"
                          value={g.guardianPhone}
                          onChange={e => updateGuardian(idx, { guardianPhone: e.target.value })}
                          className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <select
                          value={g.relationship}
                          onChange={e => updateGuardian(idx, { relationship: e.target.value })}
                          className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                        >
                          <option value="Mãe">Mãe</option>
                          <option value="Pai">Pai</option>
                          <option value="Tutor Legal">Tutor Legal</option>
                          <option value="Avó/Avô">Avó / Avô</option>
                          <option value="Emergência">Contato Emergência</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="email"
                          placeholder="E-mail do responsável"
                          value={g.guardianEmail}
                          onChange={e => updateGuardian(idx, { guardianEmail: e.target.value })}
                          className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="ID Usuário Portal (opcional)"
                          value={g.guardianUserId}
                          onChange={e => updateGuardian(idx, { guardianUserId: e.target.value })}
                          className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={g.isLegalGuardian}
                            onChange={e => updateGuardian(idx, { isLegalGuardian: e.target.checked })}
                          />
                          <span>Responsável Legal</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={g.hasJudicialRestriction}
                            checked={g.canViewPortal}
                            onChange={e => updateGuardian(idx, { canViewPortal: e.target.checked })}
                          />
                          <span>Acesso ao Portal</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={g.isEmergencyContact}
                            onChange={e => updateGuardian(idx, { isEmergencyContact: e.target.checked })}
                          />
                          <span>Contato de Emergência</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={g.hasJudicialRestriction}
                            checked={g.canPickup}
                            onChange={e => updateGuardian(idx, { canPickup: e.target.checked })}
                          />
                          <span>Autorizado a Buscar</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={g.isFinancialResponsible}
                            onChange={e => updateGuardian(idx, { isFinancialResponsible: e.target.checked })}
                          />
                          <span>Responsável Financeiro</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-red-300">
                          <input
                            type="checkbox"
                            checked={g.hasJudicialRestriction}
                            onChange={e => updateGuardian(idx, { hasJudicialRestriction: e.target.checked })}
                          />
                          <span>Restrição Judicial</span>
                        </label>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between pt-2">
                    <button type="button" onClick={() => setStep(1)} className="sec-btn">Voltar</button>
                    <button type="button" onClick={() => setStep(3)} className="sec-btn primary">
                      Avançar para Dados, Saúde & Documentos
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 3 */}
              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <FileCheck2 size={16} /> Etapa 3 — Dados, Área Restrita de Saúde, Foto & Checklist Documental
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-[11px] text-zinc-400 font-bold uppercase mb-1 block">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 font-bold uppercase mb-1 block">Nascimento</label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Código de matrícula / RA (opcional)"
                      value={formData.registrationCode}
                      onChange={e => setFormData({ ...formData, registrationCode: e.target.value })}
                      className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Observações de portaria/retirada"
                      value={formData.pickupNotes}
                      onChange={e => setFormData({ ...formData, pickupNotes: e.target.value })}
                      className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  {/* Área Restrita de Saúde */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <HeartPulse size={14} /> Área Restrita de Saúde & Alergias
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-amber-200">
                        Acesso restrito — nunca exibido em boletins ou listas gerais
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Alergias / restrições alimentares"
                        value={formData.allergies}
                        onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Resumo clínico de atendimento escolar"
                        value={formData.healthSummaryRestricted}
                        onChange={e => setFormData({ ...formData, healthSummaryRestricted: e.target.value })}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Foto Opcional + CEP BrasilAPI */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2">
                      <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Camera size={14} className="text-emerald-400" /> Foto de Prontuário (Opcional)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="text-xs text-zinc-400"
                      />
                      {formData.photoUrl && (
                        <img
                          src={formData.photoUrl}
                          alt="Prévia do aluno"
                          className="w-16 h-16 object-cover rounded-lg border border-white/15"
                        />
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2">
                      <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                        <MapPin size={12} className="text-emerald-400" /> CEP (BrasilAPI / ViaCEP)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="00000-000"
                          maxLength={9}
                          value={formData.cep}
                          onChange={e => setFormData({ ...formData, cep: e.target.value })}
                          onBlur={() => { if (formData.cep.replace(/\D/g, '').length === 8) handleLookupCep(); }}
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={handleLookupCep}
                          disabled={cepLoading}
                          className="sec-btn"
                        >
                          <Search size={12} /> {cepLoading ? 'Buscando...' : 'Buscar CEP'}
                        </button>
                      </div>
                      {cepStatus && <p className="text-[11px] text-emerald-400">{cepStatus}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Logradouro"
                      value={formData.street}
                      onChange={e => setFormData({ ...formData, street: e.target.value })}
                      className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={formData.neighborhood}
                      onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="UF"
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white uppercase"
                    />
                  </div>

                  {/* Checklist Documental + OCR Sugestão Candidata */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">Checklist Documental</span>
                      <select
                        value={docStatus}
                        onChange={e => setDocStatus(e.target.value as any)}
                        className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white"
                      >
                        <option value="PENDENTE">PENDENTE</option>
                        <option value="EM_ANALISE">EM ANÁLISE</option>
                        <option value="ACEITA">ACEITA (Conferida)</option>
                        <option value="RECUSADA">RECUSADA</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={docChecklist.certidaoOuRg}
                          onChange={e => setDocChecklist(p => ({ ...p, certidaoOuRg: e.target.checked }))}
                        />
                        <span>Certidão / RG</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={docChecklist.comprovanteResidencia}
                          onChange={e => setDocChecklist(p => ({ ...p, comprovanteResidencia: e.target.checked }))}
                        />
                        <span>Comprov. Residência</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={docChecklist.historicoEscolar}
                          onChange={e => setDocChecklist(p => ({ ...p, historicoEscolar: e.target.checked }))}
                        />
                        <span>Histórico Escolar</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={docChecklist.cartaoVacina}
                          onChange={e => setDocChecklist(p => ({ ...p, cartaoVacina: e.target.checked }))}
                        />
                        <span>Vacinação</span>
                      </label>
                    </div>

                    <div className="border-t border-white/10 pt-2.5 flex flex-col gap-2">
                      <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                        <Sparkles size={12} /> Leitura OCR (Apenas Sugestão Candidata — Requer Conferência Humana)
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ocrSnippet}
                          onChange={e => setOcrSnippet(e.target.value)}
                          placeholder="Cole texto extraído de documento (ex: Maria Clara • 2013-05-10 • 70040-010)"
                          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                        <button type="button" onClick={handleExtractOcrCandidate} className="sec-btn">
                          Gerar Sugestão OCR
                        </button>
                      </div>
                      {ocrCandidate && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <strong>Sugestão Candidata:</strong>{' '}
                            Nome: {ocrCandidate.name || '—'} • Nascimento: {ocrCandidate.birthDate || '—'} • CEP: {ocrCandidate.cep || '—'}
                          </div>
                          <button
                            type="button"
                            onClick={handleApplyOcrCandidate}
                            className="sec-btn primary"
                          >
                            {ocrCandidate.confirmed ? 'Conferido e Aplicado' : 'Confirmar Conferência Humana e Aplicar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button type="button" onClick={() => setStep(2)} className="sec-btn">Voltar</button>
                    <button type="button" onClick={() => setStep(4)} className="sec-btn primary">
                      Avançar para Oferta / Turma
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 4 */}
              {step === 4 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <Building2 size={16} /> Etapa 4 — Oferta, Turma ou Enturmação Pendente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 font-bold uppercase mb-1 block">Ano Letivo</label>
                      <select
                        value={academicYearId}
                        onChange={e => setAcademicYearId(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {academicYears.length > 0 ? (
                          academicYears.map(ay => (
                            <option key={ay.id} value={ay.id}>
                              {ay.year} — {ay.stage} ({ay.status})
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="ay-2026-fund">2026 — FUNDAMENTAL</option>
                            <option value="ay-2026-med">2026 — MEDIO</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 font-bold uppercase mb-1 block">Etapa</label>
                      <select
                        value={stage}
                        onChange={e => setStage(e.target.value as any)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="FUNDAMENTAL">Ensino Fundamental</option>
                        <option value="MEDIO">Ensino Médio</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-amber-300 cursor-pointer p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <input
                      type="checkbox"
                      checked={pendingPlacement}
                      onChange={e => setPendingPlacement(e.target.checked)}
                    />
                    <span>Manter com Enturmação Pendente (salva pré-matrícula em conferência sem alocar vaga agora)</span>
                  </label>

                  {!pendingPlacement && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 font-bold uppercase mb-1 block">Turma Ativa</label>
                        <select
                          value={classId}
                          onChange={e => setClassId(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value="">-- Selecionar / Digitar ID ao lado --</option>
                          {mvpClasses.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.occupied ?? 0}/{c.capacity} vagas)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 font-bold uppercase mb-1 block">ID da Turma *</label>
                        <input
                          type="text"
                          value={classId}
                          onChange={e => setClassId(e.target.value)}
                          placeholder="Ex: class-7a"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <button type="button" onClick={() => setStep(3)} className="sec-btn">Voltar</button>
                    <button type="button" onClick={() => setStep(5)} className="sec-btn primary">
                      Avançar para Confirmação
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 5 */}
              {step === 5 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <ShieldCheck size={16} /> Etapa 5 — Validação & Confirmação Transacional Idempotente
                  </h3>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs flex flex-col gap-1.5">
                    <div><strong>Estudante:</strong> {formData.name || 'Não informado'}</div>
                    <div><strong>Etapa / Ano:</strong> {stage} • {academicYearId}</div>
                    <div><strong>Turma:</strong> {pendingPlacement ? 'Enturmação Pendente (Rascunho em Conferência)' : (classId || 'Não informada')}</div>
                    <div><strong>Documentação:</strong> {docStatus}</div>
                    <div><strong>Responsáveis configurados:</strong> {guardians.filter(g => g.guardianName.trim()).length}</div>
                    <div className="font-mono text-[10px] text-zinc-400">Chave de Idempotência: {idempotencyKey}</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSaveDraft}
                      className="sec-btn"
                    >
                      Salvar Rascunho
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleValidateDraft}
                      className="sec-btn"
                    >
                      Validar Pré-Matrícula
                    </button>
                  </div>

                  {validationResult && (
                    <div className="p-3 rounded-xl bg-black/50 border border-white/15 text-xs flex flex-col gap-1">
                      <div className={`font-bold ${validationResult.valid ? 'text-emerald-300' : 'text-red-300'}`}>
                        {validationResult.valid
                          ? 'Pré-matrícula validada e apta para confirmação.'
                          : 'Existem pendências bloqueantes:'}
                      </div>
                      {validationResult.blockingIssues.map((issue, idx) => (
                        <div key={idx} className="text-red-300 flex items-center gap-1">
                          <AlertTriangle size={12} /> {issue}
                        </div>
                      ))}
                      {validationResult.warnings.map((warn, idx) => (
                        <div key={idx} className="text-amber-300">Aviso: {warn}</div>
                      ))}
                    </div>
                  )}

                  {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button type="button" onClick={() => setStep(4)} className="sec-btn">Voltar</button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 text-sm"
                    >
                      <Check size={16} />
                      {submitting
                        ? 'Processando...'
                        : pendingPlacement
                        ? 'Salvar Pré-Matrícula Pendente'
                        : 'Efetivar Cadastro'}
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Painel Lateral de Status */}
            <div className="flex flex-col gap-4">
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex flex-col gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Situação da Matrícula
                </h4>
                {createdStudentId ? (
                  <>
                    <p role="status" className="text-emerald-400 text-sm font-semibold">
                      Aluno cadastrado. Identificador: <span className="font-mono">{createdStudentId}</span>
                    </p>
                    {confirmationMeta && (
                      <p className="text-xs text-zinc-300">{confirmationMeta}</p>
                    )}
                  </>
                ) : (
                  <p className="text-zinc-400 text-xs">
                    O cadastro não cria credenciais de acesso. Convites de uso único para responsáveis são emitidos na aba Usuários &amp; Logins.
                  </p>
                )}
                {draftRecord && (
                  <div className="mt-2 p-2.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-zinc-300">
                    Rascunho ativo: <span className="font-mono">{draftRecord.id}</span> (v{draftRecord.version})
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
