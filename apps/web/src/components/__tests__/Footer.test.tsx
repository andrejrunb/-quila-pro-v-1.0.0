import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Footer from '../Footer';

vi.mock('next/link', () => {
  return {
    default: ({
      children,
      href,
      ...rest
    }: {
      children: React.ReactNode;
      href: string;
      [key: string]: unknown;
    }) => {
      return (
        <a href={href} {...rest}>
          {children}
        </a>
      );
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

  it('não deve conter links vazios com href="#"', () => {
    const { container } = render(<Footer />);
    const deadLinks = container.querySelectorAll('a[href="#"]');
    expect(deadLinks.length).toBe(0);
  });
});
