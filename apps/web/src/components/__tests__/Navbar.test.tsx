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
    expect(screen.getByText(/School OS/i)).toBeInTheDocument();
  });

  it('deve exibir o link de Agendar Demo', () => {
    render(<Navbar />);
    const demoButton = screen.getByText(/Agendar Demo/i);
    expect(demoButton).toBeInTheDocument();
  });

  it('deve possuir os links principais de navegação', () => {
    render(<Navbar />);
    expect(screen.getByText(/Produto/i)).toBeInTheDocument();
    expect(screen.getByText(/Soluções/i)).toBeInTheDocument();
    expect(screen.getByText(/Segurança/i)).toBeInTheDocument();
  });
});
