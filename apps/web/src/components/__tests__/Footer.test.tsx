import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Footer from '../Footer';

vi.mock('next/link', () => {
  return {
    default: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href}>{children}</a>;
    },
  };
});

describe('Footer Component', () => {
  it('deve renderizar o copyright de 2026', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026 Áquila Labs/i)).toBeInTheDocument();
  });

  it('deve renderizar as seções principais', () => {
    render(<Footer />);
    expect(screen.getByText(/Plataforma/i)).toBeInTheDocument();
    expect(screen.getByText(/Institucional/i)).toBeInTheDocument();
  });

  it('deve exibir o selo Powered by Antigravity', () => {
    render(<Footer />);
    expect(screen.getByText(/Powered by/i)).toBeInTheDocument();
    expect(screen.getByText(/Antigravity Engine/i)).toBeInTheDocument();
  });
});
