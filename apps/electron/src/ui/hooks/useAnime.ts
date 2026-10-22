import { useEffect, useRef } from 'react';
import { animate, remove, AnimationParams, JSAnimation, stagger } from 'animejs';

/**
 * useAnime Hook
 * Wrapper para integrar Anime.js com componentes React de forma segura.
 * 
 * @param params Configurações do Anime.js
 * @param dependencies Dependências para re-disparar a animação (opcional)
 */
export const useAnime = (params: AnimationParams, dependencies: any[] = []) => {
  const animeRef = useRef<JSAnimation | null>(null);

  useEffect(() => {
    // Cancela animações anteriores se existirem no mesmo alvo
    if (params.targets) {
      remove(params.targets);
    }
    
    animeRef.current = animate(params);

    return () => {
      if (animeRef.current) {
        animeRef.current.pause();
        if (params.targets) {
          remove(params.targets);
        }
      }
    };
  }, dependencies);

  return animeRef;
};

/**
 * Funções utilitárias para animações pré-definidas Elite
 */
export const eliteAnimate = {
  // Entrada suave com mola para cards
  springIn: (targets: any, delay: number = 0) => {
    return animate({
      targets,
      opacity: [0, 1],
      translateY: [20, 0],
      scale: [0.95, 1],
      easing: 'spring(1, 80, 10, 0)',
      delay: stagger(100, { start: delay })
    });
  },

  // Efeito de pulso para botões ativos
  pulse: (targets: any) => {
    return animate({
      targets,
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
      duration: 1500,
      easing: 'easeInOutQuad',
      loop: true
    });
  }
};
