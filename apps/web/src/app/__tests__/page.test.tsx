import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '../page';

// Mock do Next/Image
vi.mock('next/image', () => {
  return {
    default: ({ src, alt }: { src: string; alt: string }) => {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={alt} />;
    },
  };
});

// Mock do Lucide React para evitar problemas de renderização de ícones complexos em JSDOM
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Shield: () => <div data-testid="icon-shield" />,
    Zap: () => <div data-testid="icon-zap" />,
    ArrowRight: () => <div data-testid="icon-arrow" />,
  };
});

describe('Home Page', () => {
  it('deve renderizar o título principal (H1)', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/O Sistema Operacional Escolar Soberano/i);
  });

  it('deve renderizar o botão de Agendar Conversa', () => {
    render(<Home />);
    expect(screen.getByText(/Agendar Conversa/i)).toBeInTheDocument();
  });

  it('deve renderizar as seções de benefícios', () => {
    render(<Home />);
    expect(screen.getByText(/Segurança & Presença/i)).toBeInTheDocument();
    expect(screen.getByText(/Transparência Real/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero Burocracia/i)).toBeInTheDocument();
  });

  it('deve renderizar os números de impacto', () => {
    render(<Home />);
    expect(screen.getByText((content) => content.startsWith('0.2'))).toBeInTheDocument();
    expect(screen.getByText(/Tempo de Presença/i)).toBeInTheDocument();
  });
});
