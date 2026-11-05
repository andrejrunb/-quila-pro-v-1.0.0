import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PortalProfessor from '../app/portal/professor/page';
import PortalPais from '../app/portal/pais/page';
import PortalAluno from '../app/portal/aluno/page';

describe('P2 UX & Portal Enhancements — Professor, Família e Aluno', () => {
  it('Portal do Professor: confirma chamada em < 90s via botão 1-click e exibe Preview A4 em Tempo Real', () => {
    render(<PortalProfessor />);

    const quickConfirmBtn = screen.getByTestId('quick-confirm-attendance-btn');
    fireEvent.click(quickConfirmBtn);
    expect(screen.getByRole('status').textContent).toContain('Chamada rápida (< 90s) confirmada');

    const examTab = screen.getByRole('tab', { name: /Preview A4 em Tempo Real/i });
    fireEvent.click(examTab);
    expect(screen.getByTestId('exam-foundry-a4-preview')).toBeTruthy();
    expect(screen.getByText(/CARTÃO OMR RÁPIDO/i)).toBeTruthy();
  });

  it('Portal da Família: exibe Onboarding LGPD de 3 passos, permite revogação/expurgo Art. 16 e separa Avisos de Conversas para o Jantar', () => {
    render(<PortalPais />);

    expect(screen.getByTestId('lgpd-onboarding-card')).toBeTruthy();
    const revokeBtn = screen.getByTestId('lgpd-revoke-purge-btn');
    fireEvent.click(revokeBtn);
    expect(screen.getByRole('status').textContent).toContain('Expurgo Art. 16 registrado');

    const dinnerTab = screen.getByRole('tab', { name: /Conversas para o Jantar/i });
    fireEvent.click(dinnerTab);
    expect(screen.getByTestId('dinner-conversations-panel')).toBeTruthy();
  });

  it('Portal do Aluno: exibe Modo Kumon 3 min (03:00) com controles acessíveis e gamificação leve', () => {
    render(<PortalAluno />);

    expect(screen.getByTestId('kumon-timer-card')).toBeTruthy();
    expect(screen.getByTestId('kumon-countdown-display').textContent).toBe('03:00');
    expect(screen.getByRole('tablist', { name: /Navegação do Portal do Aluno/i })).toBeTruthy();
  });
});
