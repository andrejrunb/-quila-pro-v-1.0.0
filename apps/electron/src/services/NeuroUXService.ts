/**
 * NeuroUXService (SQA-GAM-601)
 * Motor de Bio-Adaptação de Interface.
 * Detecta fadiga através de micro-padrões de interação e ajusta a cromia do app.
 */
export class NeuroUXService {
  private lastActivity: number = Date.now();
  private latencyBuffer: number[] = [];
  private state: 'focus' | 'rest' = 'focus';

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('mousedown', () => this.trackActivity());
    window.addEventListener('keydown', () => this.trackActivity());
  }

  private trackActivity() {
    const now = Date.now();
    const gap = now - this.lastActivity;
    this.lastActivity = now;

    if (gap > 50 && gap < 3000) {
      this.latencyBuffer.push(gap);
      if (this.latencyBuffer.length > 10) this.latencyBuffer.shift();
      this.analyzeFatigue();
    }
  }

  private analyzeFatigue() {
    if (this.latencyBuffer.length < 5) return;

    const avg = this.latencyBuffer.reduce((a, b) => a + b, 0) / this.latencyBuffer.length;
    const jitter = Math.max(...this.latencyBuffer) - Math.min(...this.latencyBuffer);

    // Se a latência média sobe e a variabilidade aumenta -> SINAL DE FADIGA
    if (avg > 800 || jitter > 1000) {
      this.applyTheme('rest');
    } else {
      this.applyTheme('focus');
    }
  }

  private applyTheme(newState: 'focus' | 'rest') {
    if (newState === this.state) return;
    this.state = newState;

    const root = document.documentElement;
    if (newState === 'rest') {
      // Cores Quentes e Menos Contraste (Descanso Cognitivo)
      root.style.setProperty('--rpg-accent', '#ff8800');
      root.style.setProperty('--glass-border', 'rgba(255, 136, 0, 0.2)');
      root.style.setProperty('--bg-glow', 'radial-gradient(circle, rgba(255,136,0,0.1) 0%, transparent 70%)');
      console.log('[Neuro-UX] Detectada fadiga cognitiva. Ativando Modo Rest.');
    } else {
      // Cores Frias e Alto Contraste (Estado de Fluxo/Foco)
      root.style.setProperty('--rpg-accent', '#00ffcc');
      root.style.setProperty('--glass-border', 'rgba(0, 255, 204, 0.2)');
      root.style.setProperty('--bg-glow', 'radial-gradient(circle, rgba(0,255,204,0.1) 0%, transparent 70%)');
      console.log('[Neuro-UX] Estado de fluxo detectado. Ativando Modo Focus.');
    }
  }
}
