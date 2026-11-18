import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PortalAluno from '../app/portal/aluno/page';
import SegurancaLGPD from '../app/seguranca-lgpd/page';
import * as usePortalDataModule from '@/lib/usePortalData';

describe('Conformidade CNE/CP nº 15/2026 nos Portais Online', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('bloqueia acesso autônomo ao Tutor IA para Anos Iniciais (1º ao 5º ano EF) e Educação Infantil', () => {
    vi.spyOn(usePortalDataModule, 'usePortalWorkspace').mockReturnValue({
      data: {
        student: {
          id: 'stu-3ef',
          name: 'Sofia Martins',
          registrationNumber: '20260301',
        },
        activeClass: {
          id: 'cls-3ef',
          name: '3º Ano A — Fundamental I',
          grade: 3,
          roomId: 'SALA 03',
        },
        missions: [],
        grades: [],
        latestAttendance: null,
        schedules: [],
        recentSessions: [],
        xpPoints: 1200,
        streakDays: 5,
        coins: 90,
      } satisfies usePortalDataModule.StudentWorkspaceData,
      loading: false,
      syncError: null,
      reload: vi.fn(),
      mutate: vi.fn(),
    });

    render(<PortalAluno />);
    const tutorTab = screen.getByRole('tab', { name: /Tutor IA Áquila/i });
    fireEvent.click(tutorTab);

    expect(
      screen.getByText(/Tutor IA Autônomo Bloqueado para Educação Infantil e 1º–5º Ano EF/i)
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Pergunte ao Tutor IA/i)).not.toBeInTheDocument();
  });

  it('mantém Tutor IA mediado com aviso CNE/CP nº 15/2026 no Ensino Médio (incluindo 3º Ano A / grade 12)', () => {
    vi.spyOn(usePortalDataModule, 'usePortalWorkspace').mockReturnValue({
      data: {
        student: {
          id: 'stu-em',
          name: 'Gabriel Rocha',
          registrationNumber: '20261001',
        },
        activeClass: {
          id: 'cls-3em',
          name: '3º Ano A',
          grade: 12,
          roomId: 'SALA 12',
        },
        missions: [],
        grades: [],
        latestAttendance: null,
        schedules: [],
        recentSessions: [],
        xpPoints: 2400,
        streakDays: 10,
        coins: 320,
      } satisfies usePortalDataModule.StudentWorkspaceData,
      loading: false,
      syncError: null,
      reload: vi.fn(),
      mutate: vi.fn(),
    });

    render(<PortalAluno />);
    const tutorTab = screen.getByRole('tab', { name: /Tutor IA Áquila/i });
    fireEvent.click(tutorTab);

    expect(screen.getByPlaceholderText(/Pergunte ao Tutor IA/i)).toBeInTheDocument();
    expect(screen.getByText(/DOU 11\/11\/2026/i)).toBeInTheDocument();
  });

  it('exibe marco homologado CNE/CP nº 15/2026 na página de Segurança & LGPD', () => {
    render(<SegurancaLGPD />);
    expect(screen.getAllByText(/Parecer CNE\/CP nº 15\/2026/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/10\/11\/2026/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Bloqueio Etário até 5º Ano EF/i)).toBeInTheDocument();
  });
});
