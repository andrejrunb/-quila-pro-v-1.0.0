import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from '../Navbar';

vi.mock('next/link', () => {
  return {
    default: ({
      children,
      href,
      onClick,
      className,
    }: {
      children: React.ReactNode;
      href: string;
      onClick?: () => void;
      className?: string;
    }) => {
      return (
        <a href={href} onClick={onClick} className={className}>
          {children}
        </a>
      );
    },
  };
});

describe('Navbar Component', () => {
  it('deve renderizar o título Áquila Pro', () => {
    render(<Navbar />);
    expect(screen.getByText(/Áquila/i)).toBeInTheDocument();
    expect(screen.getByText(/Pro/i)).toBeInTheDocument();
  });

  it('deve exibir os botões de ação institucional', () => {
    render(<Navbar />);
    expect(screen.getByText(/Portais Educacionais/i)).toBeInTheDocument();
    expect(screen.getByText(/Acesso Soberano/i)).toBeInTheDocument();
  });

  it('deve possuir os links principais de navegação', () => {
    render(<Navbar />);
    expect(screen.getByText(/Intro/i)).toBeInTheDocument();
    expect(screen.getByText(/Vantagens/i)).toBeInTheDocument();
    expect(screen.getByText(/Tecnologia/i)).toBeInTheDocument();
    expect(screen.getByText(/ROI/i)).toBeInTheDocument();
    expect(screen.getByText(/Módulos/i)).toBeInTheDocument();
    expect(screen.getByText(/Segurança & LGPD/i)).toBeInTheDocument();
  });

  it('deve abrir e fechar o menu mobile com atributos de acessibilidade', () => {
    render(<Navbar />);
    const menuBtn = screen.getByRole('button', { name: /Menu/i });
    expect(menuBtn).toHaveAttribute('type', 'button');
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('mobile-nav-drawer')).toBeInTheDocument();

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
  });
});
