import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PortalAluno from '../app/portal/aluno/page';
import PortalPais from '../app/portal/pais/page';
import PortalProfessor from '../app/portal/professor/page';
import { StudentPracticeDrawer } from '../components/portals/StudentPracticeDrawer';
import { ParentLgpdModal } from '../components/portals/ParentLgpdModal';
import * as usePortalDataModule from '@/lib/usePortalData';

describe('Fase 2 Fatia 3 — Alinhamento UI Portais & CNE/CP nº 15/2026', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Portal do Aluno: bloqueia TODAS as superfícies IA (Tutor + Redação + Flashcards) via aiPolicy.blocked e mantém Sprint focus_sprint_3min liberado', async () => {
    const mutateSpy = vi.fn().mockResolvedValue({ ok: true, data: { earnedXp: 50 } });
    const reloadSpy = vi.fn();

    vi.spyOn(usePortalDataModule, 'usePortalWorkspace').mockReturnValue({
      data: {
        student: {
          id: 'std_006',
          name: 'Sofia Martins',
          registrationNumber: '2026-0006',
        },
        activeClass: {
          id: 'cls_2ef',
          name: '2º Ano EF',
          grade: 2,
          roomId: 'SALA 02',
        },
        latestAttendance: {
          status: 'present',
          detectedBy: 'qr_badge',
          date: '2026-11-12',
        },
        grades: [
          {
            id: 'grd_sofia_1',
            studentId: 'std_006',
            classId: 'cls_2ef',
            subject: 'Alfabetização & Leitura',
            evaluationType: 'prova',
            score: 9.5,
            maxScore: 10,
            period: '4bim',
            status: 'published',
            propagationStatus: 'applied_by_edge',
            edgeCommandId: 'cmd_grd_sofia_1',
          },
        ],
        schedules: [],
        missions: [],
        xpPoints: 180,
        coins: 40,
        streakDays: 3,
        recentSessions: [],
        aiPolicy: {
          blocked: true,
          stage: 'Anos Iniciais EF (2º ano)',
          ageYears: 7,
          reason: 'Parecer CNE/CP nº 15/2026: estudantes até o 5º ano EF não podem usar IA autônoma.',
        },
        syncStatus: {
          state: 'received_by_server',
          pendingCommandCount: 0,
          lastSyncedAt: null,
          staleReason: null,
        },
      } satisfies usePortalDataModule.StudentWorkspaceData,
      loading: false,
      syncError: null,
      reload: reloadSpy,
      mutate: mutateSpy,
    });

    render(<PortalAluno />);

    // Modo Kumon 3 min (não-IA) permanece habilitado e envia modo canônico focus_sprint_3min
    const sprintBtn = screen.getByRole('button', { name: 'Registrar Sprint Kumon' });
    expect(sprintBtn).not.toBeDisabled();
    fireEvent.click(sprintBtn);

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith(
        'logStudySession',
        expect.objectContaining({
          mode: 'focus_sprint_3min',
        })
      );
    });

    // Nenhuma lista comparativa mock com Lucas/Matheus aparece quando há workspace real
    expect(screen.queryByText(/Matheus Lima/i)).not.toBeInTheDocument();

    // Aba Tutor IA bloqueia Tutor chat, Redação Nota 1000 E Flashcards SRS
    fireEvent.click(screen.getByRole('tab', { name: /Tutor IA Áquila/i }));
    expect(screen.getByTestId('tutor-cne-blocked-panel')).toBeInTheDocument();
    expect(screen.getByTestId('ai-labs-cne-blocked-notice')).toBeInTheDocument();

    const blockedAiButtons = screen.getAllByRole('button', { name: /Bloqueado \(CNE\/CP nº 15\/2026\)/i });
    expect(blockedAiButtons).toHaveLength(2);
    for (const btn of blockedAiButtons) {
      expect(btn).toBeDisabled();
    }

    // Aba Boletim permite contestar nota publicada (mín. 10 caracteres)
    fireEvent.click(screen.getByRole('tab', { name: /Boletim & Desempenho/i }));
    fireEvent.click(screen.getByRole('button', { name: /Contestar Nota/i }));
    const reasonInput = screen.getByPlaceholderText(/Explique o motivo do pedido de revisão/i);
    fireEvent.change(reasonInput, { target: { value: 'Solicito revisão da questão 2.' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar Contestação/i }));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith(
        'contestGrade',
        expect.objectContaining({
          gradeId: 'grd_sofia_1',
          reason: 'Solicito revisão da questão 2.',
        })
      );
    });
  });

  it('Portal do Aluno: falha fechada em 403/syncError sem vazar PII mock e StudentPracticeDrawer respeita aiPolicyBlocked', () => {
    vi.spyOn(usePortalDataModule, 'usePortalWorkspace').mockReturnValue({
      data: null,
      loading: false,
      syncError: 'Acesso negado ao estudante solicitado (HTTP 403).',
      reload: vi.fn(),
      mutate: vi.fn(),
    });

    render(<PortalAluno />);
    expect(screen.getByTestId('student-access-blocked')).toBeInTheDocument();
    expect(screen.queryByText('Lucas Andrade')).not.toBeInTheDocument();

    render(
      <StudentPracticeDrawer
        mode="essay_lab"
        aiPolicyBlocked={true}
        aiPolicyReason="Bloqueio etário CNE 15/2026 ativo."
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText(/Bloqueado pelo Parecer CNE\/CP nº 15\/2026/i)).toBeInTheDocument();
    expect(screen.getByText('Bloqueio etário CNE 15/2026 ativo.')).toBeInTheDocument();
  });

  it('Portal da Família: exibe contestação de ocorrência + erro 409, contestGrade, LGPD protocolo e PIX PENDING_EDGE_RECONCILIATION', async () => {
    const mutateSpy = vi.fn().mockImplementation(async (action: string, payload: Record<string, unknown>) => {
      if (action === 'signOccurrence' && payload.manifestationType === 'DISAGREEMENT_CONTESTATION') {
        return {
          ok: false,
          status: 409,
          error: 'Conflito (409): manifestação divergente já registrada anteriormente.',
        };
      }
      if (action === 'contestGrade') {
        return {
          ok: true,
          status: 200,
          data: { ok: true, commandId: 'cmd_contest_01', syncStatus: 'pending_at_edge' },
        };
      }
      if (action === 'confirmPixPayment') {
        return {
          ok: true,
          status: 200,
          data: {
            ok: true,
            invoiceId: 'inv_001',
            status: 'paid',
            commandId: 'cmd_pix_01',
            reconciliationState: 'PENDING_EDGE_RECONCILIATION',
          },
        };
      }
      return { ok: true, data: {} };
    });

    vi.spyOn(usePortalDataModule, 'usePortalWorkspace').mockReturnValue({
      data: {
        guardianName: 'Sra. Patrícia Andrade',
        students: [
          { id: 'std_001', name: 'Lucas Andrade', registrationNumber: '2026-0842', classId: 'cls_2b' },
        ],
        activeStudent: {
          id: 'std_001',
          name: 'Lucas Andrade',
          registrationNumber: '2026-0842',
          classId: 'cls_2b',
        },
        activeClass: { id: 'cls_2b', name: '2º Ano B', roomId: 'SALA 08' },
        attendanceTimeline: [],
        attendanceRate: 98.0,
        dinnerConversations: [],
        grades: [
          {
            id: 'grd_001',
            studentId: 'std_001',
            classId: 'cls_2b',
            subject: 'Física Aplicada',
            evaluationType: 'prova',
            score: 8.5,
            maxScore: 10,
            period: '4bim',
            status: 'published',
            propagationStatus: 'applied_by_edge',
            edgeCommandId: 'cmd_g1_applied',
            contestationStatus: 'none',
          },
        ],
        invoices: [
          {
            id: 'inv_001',
            description: 'Mensalidade Novembro 2026',
            amount: 148000,
            dueDate: '2026-11-10',
            status: 'pending',
            pixPayload: 'pix-demo-payload',
            receiptHashSha256: null,
          },
        ],
        occurrences: [
          {
            id: 'occ_001',
            category: 'pedagogical',
            severity: 'medium',
            title: 'Ocorrência de Laboratório',
            description: 'Ajuste de prazo experimental.',
            signedAt: null,
            signatureHashSha256: null,
            createdAt: '2026-11-12T10:00:00Z',
            propagationStatus: 'pending_at_edge',
            edgeCommandId: 'cmd_occ_01',
          },
        ],
        notifications: [],
        biometricConsent: {
          enabled: false,
          status: 'revoked',
          documentVersion: 'v2.1-ANPD-2026',
          propagationStatus: 'pending_at_edge',
          consentLogId: 'cns_999',
          edgeCommandId: 'cmd_lgpd_999',
          latestReceiptSha256: 'abc123',
        },
        syncStatus: {
          state: 'pending_at_edge',
          pendingCommandCount: 2,
          lastSyncedAt: null,
          staleReason: null,
        },
      } satisfies usePortalDataModule.ParentWorkspaceData,
      loading: false,
      syncError: null,
      reload: vi.fn(),
      mutate: mutateSpy,
    });

    render(<PortalPais />);

    // Protocolo e comando LGPD visíveis
    expect(screen.getByText(/Protocolo cns_999/i)).toBeInTheDocument();
    expect(screen.getByText(/2 fila Edge/i)).toBeInTheDocument();

    // Contestação de nota publicada
    fireEvent.click(screen.getByRole('tab', { name: /Boletim & Rendimento/i }));
    fireEvent.click(screen.getByRole('button', { name: /Contestar Nota/i }));
    fireEvent.change(
      screen.getByPlaceholderText(/Descreva o motivo da revisão\/contestação/i),
      { target: { value: 'Soma dos pontos da questão 3 divergente.' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Enviar Contestação/i }));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith('contestGrade', {
        gradeId: 'grd_001',
        reason: 'Soma dos pontos da questão 3 divergente.',
      });
    });

    // Ocorrências -> Contestação envia motivo >= 5 chars e exibe erro 409 inline
    fireEvent.click(screen.getByRole('tab', { name: /Ocorrências & Assinaturas/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Contestar$/i }));
    fireEvent.change(
      screen.getByPlaceholderText(/Explique o ponto de discordância/i),
      { target: { value: 'O estudante entregou o relatório no prazo.' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Enviar Contestação/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Conflito \(409\)/i);
    });

    // Financeiro PIX -> mostra Pendente Conciliação no Edge em vez de "Pago e Conciliado"
    fireEvent.click(screen.getByRole('tab', { name: /Financeiro & PIX/i }));
    fireEvent.click(screen.getByRole('button', { name: /Gerar PIX QR Code/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Pagamento PIX/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Pendente Conciliação no Edge/i).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/Pago e Conciliado/i)).not.toBeInTheDocument();
  });

  it('ParentLgpdModal mantém modal aberto e exibe erro ao receber CPF repetido inválido ou erro 400 do servidor', async () => {
    const onClose = vi.fn();
    const onGrant = vi.fn().mockResolvedValue({ ok: false, error: 'CPF inválido no BFF.' });

    render(
      <ParentLgpdModal
        open={true}
        onClose={onClose}
        defaultGuardianName="Responsável Teste"
        defaultGuardianCpf="111.111.111-11"
        onGrantConsent={onGrant}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Registrar Ciência e Consentimento/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/CPF inválido/i);
    expect(onClose).not.toHaveBeenCalled();

    // CPF diferente mas BFF rejeita
    fireEvent.change(screen.getByLabelText(/CPF do Responsável/i), {
      target: { value: '123.456.789-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Registrar Ciência e Consentimento/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('CPF inválido no BFF.');
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Portal do Professor: exibe lastDiarySync, não vaza mock em Radar/Notas vazios, e valida maxScore/evaluationType em saveGradesBatch', async () => {
    const mutateSpy = vi.fn().mockResolvedValue({
      ok: true,
      data: { count: 1, auditHash: 'hash1234567890abcdef', commandId: 'cmd_grade_batch', syncStatus: 'pending_at_edge' },
    });

    vi.spyOn(usePortalDataModule, 'usePortalWorkspace').mockReturnValue({
      data: {
        teacherName: 'Prof. Ricardo Silva',
        classes: [{ id: 'cls_2b', name: '2º Ano B', grade: 11, shift: 'Manhã', year: 2026, roomId: 'SALA 08' }],
        activeClass: { id: 'cls_2b', name: '2º Ano B', grade: 11, shift: 'Manhã', year: 2026, roomId: 'SALA 08' },
        roster: [
          {
            id: 'std_real_1',
            name: 'Aluno Real Turma',
            registrationNumber: '2026-999',
            seat: 'A1',
            status: 'present',
            detectedBy: 'qr_badge',
            confidence: 1,
            entryTime: '07:10',
          },
        ],
        diaries: [],
        assessments: [],
        pendingSubmissions: [],
        occurrences: [],
        grades: [
          {
            id: 'grd_real_1',
            studentId: 'std_real_1',
            classId: 'cls_2b',
            subject: 'Física Aplicada',
            evaluationType: 'prova',
            score: 7.5,
            maxScore: 10,
            period: '4bim',
            status: 'published',
            propagationStatus: 'applied_by_edge',
            edgeCommandId: 'cmd_grd_ok',
            contestationStatus: 'contested',
            contestationReason: 'Revisar questão 4.',
          },
        ],
        date: '2026-11-12',
        lastAttendanceSync: {
          commandId: 'cmd_att_10',
          status: 'applied_by_edge',
          updatedAt: '2026-11-12T10:00:00Z',
          edgeAckAt: '2026-11-12T10:01:00Z',
        },
        lastDiarySync: {
          commandId: 'cmd_dry_20',
          status: 'pending_at_edge',
          updatedAt: '2026-11-12T10:02:00Z',
          edgeAckAt: null,
        },
        syncStatus: {
          state: 'pending_at_edge',
          pendingCommandCount: 1,
          lastSyncedAt: '2026-11-12T10:01:00Z',
          staleReason: null,
        },
      } satisfies usePortalDataModule.TeacherWorkspaceData,
      loading: false,
      syncError: null,
      reload: vi.fn(),
      mutate: mutateSpy,
    });

    render(<PortalProfessor />);

    expect(screen.getByTestId('teacher-last-diary-sync')).toHaveTextContent(/Pendente na Escola/i);

    // Radar vazio no workspace real NÃO deve exibir mocks rad-1..rad-3
    fireEvent.click(screen.getByRole('tab', { name: /Radar de Atenção Pedagógica/i }));
    expect(screen.getByText(/Nenhuma ocorrência ou alerta pedagógico ativo/i)).toBeInTheDocument();
    expect(screen.queryByText('Matheus Lima')).not.toBeInTheDocument();

    // Notas: exibe contestação, valida score <= maxScore, e envia evaluationType + maxScore
    fireEvent.click(screen.getByRole('tab', { name: /Notas Bimestrais/i }));
    expect(screen.getByText(/Contestada: Revisar questão 4\./i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Tipo de avaliação/i), {
      target: { value: 'trabalho' },
    });
    fireEvent.change(screen.getByLabelText(/Nota máxima da avaliação/i), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByLabelText(/Nota de Aluno Real Turma/i), {
      target: { value: '25' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Salvar & Publicar Notas/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/informe valor entre 0 e 20/i);
    expect(mutateSpy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Nota de Aluno Real Turma/i), {
      target: { value: '18' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Salvar & Publicar Notas/i }));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith(
        'saveGradesBatch',
        expect.objectContaining({
          evaluationType: 'trabalho',
          maxScore: 20,
          entries: [{ studentId: 'std_real_1', score: 18 }],
        })
      );
    });
  });
});
