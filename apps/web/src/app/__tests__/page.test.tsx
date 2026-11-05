import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '../page';

vi.mock('next/image', () => {
  return {
    default: ({ src, alt }: { src: string; alt: string }) => {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={alt} />;
    },
  };
});

vi.mock('animejs', () => {
  return {
    animate: vi.fn(),
    stagger: vi.fn(),
    default: vi.fn(),
  };
});

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

  it('não deve renderizar Navbar ou Footer duplicados dentro de page.tsx (responsabilidade exclusiva do RootLayout)', () => {
    const { container } = render(<Home />);
    expect(container.querySelectorAll('nav').length).toBe(0);
    expect(container.querySelectorAll('footer').length).toBe(0);
  });

  it('deve expor todas as âncoras de seção referenciadas pela navegação (#hero, #benefits, #tech, #roi, #pricing, #contact)', () => {
    const { container } = render(<Home />);
    expect(container.querySelector('#hero')).not.toBeNull();
    expect(container.querySelector('#benefits')).not.toBeNull();
    expect(container.querySelector('#tech')).not.toBeNull();
    expect(container.querySelector('#roi')).not.toBeNull();
    expect(container.querySelector('#pricing')).not.toBeNull();
    expect(container.querySelector('#contact')).not.toBeNull();
  });
});
