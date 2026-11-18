import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PortalSyncBanner } from '@/components/PortalSyncBanner';
import { TeacherHitlQueue } from '@/components/portals/TeacherHitlQueue';
import { StudentPracticeDrawer } from '@/components/portals/StudentPracticeDrawer';
import { ParentLgpdModal } from '@/components/portals/ParentLgpdModal';

describe('Portal HITL, LGPD and BFF sync components', () => {
  it('renders synced and local preview states in PortalSyncBanner', async () => {
    const onRefresh = vi.fn();
    const { rerender } = render(
      <PortalSyncBanner
        portalLabel="Portal Docente"
        loading={false}
        syncError={null}
        syncedFromDb={false}
        onRefresh={onRefresh}
        complianceNote="CNE 15/2026"
      />
    );

    expect(screen.getByText('Portal Docente • Prévia Local')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    rerender(
      <PortalSyncBanner
        portalLabel="Portal Docente"
        loading={false}
        syncError={null}
        syncedFromDb={true}
        onRefresh={onRefresh}
        complianceNote="CNE 15/2026"
      />
    );
    expect(screen.getByText('Portal Docente • Recebido pelo Servidor (Projeção BFF)')).toBeInTheDocument();

    rerender(
      <PortalSyncBanner
        portalLabel="Portal Docente"
        loading={false}
        syncError={null}
        syncedFromDb={true}
        syncState="pending_at_edge"
        onRefresh={onRefresh}
        complianceNote="CNE 15/2026"
      />
    );
    expect(screen.getByText('Portal Docente • Pendente na Escola (Edge)')).toBeInTheDocument();

    rerender(
      <PortalSyncBanner
        portalLabel="Portal Docente"
        loading={false}
        syncError="Falha de sincronização"
        syncedFromDb={true}
        syncState="applied_by_edge"
        onRefresh={onRefresh}
        complianceNote="CNE 15/2026"
      />
    );
    expect(
      screen.getByText('Portal Docente • Dado Desatualizado / Falha de Sincronização')
    ).toBeInTheDocument();
  });

  it('submits HITL grade review in TeacherHitlQueue (CNE/CP nº 15/2026)', async () => {
    const onApprove = vi.fn().mockResolvedValue(undefined);
    render(
      <TeacherHitlQueue
        submissions={[
          {
            id: 'sub_001',
            assessmentId: 'asm_001',
            studentId: 'std_005',
            autoScore: 5.0,
            finalScore: null,
            reviewStatus: 'draft_ai',
            feedback: 'Revisar questão 2',
          },
        ]}
        studentNamesById={{ std_005: 'Matheus Lima' }}
        onApproveSubmission={onApprove}
      />
    );

    expect(screen.getByText('Matheus Lima')).toBeInTheDocument();
    expect(screen.getByText('RASCUNHO_IA BLOQUEADO')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Revisar & Publicar Nota/i }));
    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledWith('sub_001', 5, 'Revisar questão 2');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Nota 5.0 publicada p/ Matheus Lima');
  });

  it('logs essay lab study session and closes drawer in StudentPracticeDrawer', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <StudentPracticeDrawer mode="essay_lab" onClose={onClose} onComplete={onComplete} />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: /Registrar Treino no Histórico/i })
    );
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(
        'essay_lab',
        expect.stringContaining('governança local')
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('submits LGPD Art. 14 guardian consent in ParentLgpdModal', async () => {
    const onGrant = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<ParentLgpdModal open={true} onClose={onClose} onGrantConsent={onGrant} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar Ciência e Consentimento (Auditável)' })
    );
    await waitFor(() => {
      expect(onGrant).toHaveBeenCalledWith('Sra. Patrícia Andrade', '123.456.789-00');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
