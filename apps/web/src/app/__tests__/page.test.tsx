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

// Mock do animejs para evitar problemas de animação em ambiente JSDOM
vi.mock('animejs', () => {
  return {
    animate: vi.fn(),
    stagger: vi.fn(),
    default: vi.fn(),
  };
});

// Mock do Lucide React
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
    expect(heading).toHaveTextContent(/Áquila/i);
    expect(heading).toHaveTextContent(/Pro/i);
  });

  it('deve renderizar os botões de Agendar Demo', () => {
    render(<Home />);
    const demoBtns = screen.getAllByText(/Agendar Demo/i);
    expect(demoBtns.length).toBeGreaterThan(0);
  });

  it('deve renderizar as abas de soluções por público', () => {
    render(<Home />);
    expect(screen.getAllByText(/Para Gestão & Coordenação/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Para Professores/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Para Pais/i).length).toBeGreaterThan(0);
  });

  it('deve renderizar os indicadores institucionais', () => {
    render(<Home />);
    expect(screen.getByText(/Escolas/i)).toBeInTheDocument();
    expect(screen.getByText(/Uptime/i)).toBeInTheDocument();
  });
});
