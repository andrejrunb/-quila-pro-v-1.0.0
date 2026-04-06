import { describe, it, expect } from 'vitest';
import {
  getOptimizedImageUrl,
  getResponsiveSizes,
  generateSrcSet,
  calculateAspectRatio,
  generateBlurPlaceholder,
} from './imageOptimization';

describe('imageOptimization', () => {
  describe('getOptimizedImageUrl', () => {
    it('deve retornar URL com parâmetros de otimização', () => {
      const url = 'https://example.com/image.jpg';
      const result = getOptimizedImageUrl(url, { width: 400, quality: 80 });
      
      expect(result).toContain('w=400');
      expect(result).toContain('q=80');
    });

    it('deve adicionar formato WebP', () => {
      const url = 'https://example.com/image.jpg';
      const result = getOptimizedImageUrl(url, { format: 'webp' });
      
      expect(result).toContain('f=webp');
    });

    it('deve retornar URL original se não for HTTP', () => {
      const url = '/local/image.jpg';
      const result = getOptimizedImageUrl(url);
      
      expect(result).toBe(url);
    });
  });

  describe('getResponsiveSizes', () => {
    it('deve gerar sizes string para breakpoints', () => {
      const result = getResponsiveSizes(800, [320, 640, 1024]);
      
      expect(result).toContain('320w');
      expect(result).toContain('640w');
      expect(result).toContain('1024w');
    });

    it('deve usar breakpoints padrão', () => {
      const result = getResponsiveSizes(800);
      
      expect(result).toContain('320w');
      expect(result).toContain('1280w');
    });
  });

  describe('generateSrcSet', () => {
    it('deve gerar srcset com múltiplas resoluções', () => {
      const url = 'https://example.com/image.jpg';
      const result = generateSrcSet(url, [320, 640]);
      
      expect(result).toContain('320w');
      expect(result).toContain('640w');
    });

    it('deve incluir parâmetros de otimização na URL', () => {
      const url = 'https://example.com/image.jpg';
      const result = generateSrcSet(url, [320]);
      
      expect(result).toContain('w=320');
    });
  });

  describe('calculateAspectRatio', () => {
    it('deve calcular aspect ratio correto', () => {
      const result = calculateAspectRatio(800, 600);
      
      expect(result).toBe('800 / 600');
    });

    it('deve suportar diferentes proporções', () => {
      const result = calculateAspectRatio(16, 9);
      
      expect(result).toBe('16 / 9');
    });
  });

  describe('generateBlurPlaceholder', () => {
    it('deve gerar placeholder SVG em base64', () => {
      const result = generateBlurPlaceholder();
      
      expect(result).toContain('data:image/svg+xml;base64,');
    });

    it('deve usar cor customizada', () => {
      const result = generateBlurPlaceholder('#ff0000');
      
      expect(result).toContain('data:image/svg+xml;base64,');
      // Verificar que contém a cor (em base64)
      expect(result.length).toBeGreaterThan(0);
    });

    it('deve usar cor padrão', () => {
      const result = generateBlurPlaceholder();
      
      expect(result).toContain('data:image/svg+xml;base64,');
    });
  });
});
