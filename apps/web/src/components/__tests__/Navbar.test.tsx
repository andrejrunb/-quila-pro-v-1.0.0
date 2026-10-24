import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from '../Navbar';

// Mock do Next/Link pois ele espera um provedor de roteador que não está presente no teste unitário
vi.mock('next/link', () => {
  return {
    default: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href}>{children}</a>;
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
  });
});
