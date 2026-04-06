/**
 * Utilitários para otimização de imagens
 */

/**
 * Gera URL com parâmetros de otimização para CDN
 * Exemplo: https://cdn.example.com/image.jpg?w=400&q=80&f=webp
 */
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  }
): string {
  if (!url.startsWith('http')) {
    return url;
  }

  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);

  if (options?.width) {
    params.set('w', options.width.toString());
  }

  if (options?.quality) {
    params.set('q', options.quality.toString());
  }

  if (options?.format) {
    params.set('f', options.format);
  }

  urlObj.search = params.toString();
  return urlObj.toString();
}

/**
 * Calcula dimensões responsivas para imagem
 */
export function getResponsiveSizes(
  baseWidth: number,
  breakpoints: number[] = [320, 640, 1024, 1280]
): string {
  return breakpoints
    .map((bp) => `${bp}w`)
    .join(', ');
}

/**
 * Gera srcset para imagens responsivas
 */
export function generateSrcSet(
  url: string,
  widths: number[] = [320, 640, 1024, 1280]
): string {
  return widths
    .map((width) => {
      const optimizedUrl = getOptimizedImageUrl(url, { width });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Calcula aspect ratio para evitar layout shift
 */
export function calculateAspectRatio(width: number, height: number): string {
  return `${width} / ${height}`;
}

/**
 * Gera placeholder blur em base64
 */
export function generateBlurPlaceholder(color: string = '#f0f0f0'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="${color}" width="400" height="300"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default {
  getOptimizedImageUrl,
  getResponsiveSizes,
  generateSrcSet,
  calculateAspectRatio,
  generateBlurPlaceholder,
};
