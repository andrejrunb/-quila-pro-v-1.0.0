/**
 * ThemeManager.ts
 * Sistema Áquila Pro - V3 Enterprise
 * 
 * Gerenciador de White-Label e Temas Dinâmicos.
 * Permite a personalização visual completa (Cores, Logotipos) baseada no Tenant.
 */

export interface SchoolTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  schoolName: string;
  isDarkMode: boolean;
}

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: SchoolTheme | null = null;

  private constructor() {}

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Aplica o tema dinamicamente via CSS Variables
   */
  public applyTheme(theme: SchoolTheme): void {
    this.currentTheme = theme;
    
    if (typeof document === 'undefined') {
      console.log(`[White-Label] Running in Main Process. Theme stored for: ${theme.schoolName}`);
      return;
    }

    const root = document.documentElement;
    root.style.setProperty('--brand-primary', theme.primaryColor);
    root.style.setProperty('--brand-secondary', theme.secondaryColor);
    root.style.setProperty('--brand-accent', theme.accentColor);
    
    if (theme.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    console.log(`[White-Label] Tema aplicado para: ${theme.schoolName}`);
  }

  /**
   * Retorna o branding atual respeitando o plano (White-Label Check)
   */
  public getBranding(planId: string, allowWhiteLabel: boolean): { logo: string, name: string, isWhiteLabel: boolean } {
    if (allowWhiteLabel && this.currentTheme && this.currentTheme.logoUrl) {
      return {
        logo: this.currentTheme.logoUrl,
        name: this.currentTheme.schoolName,
        isWhiteLabel: true
      };
    }
    
    // Fallback para Áquila Pro (Planos Starter/Basic)
    const defaultTheme = this.getDefaultTheme();
    return {
      logo: defaultTheme.logoUrl,
      name: defaultTheme.schoolName,
      isWhiteLabel: false
    };
  }

  /**
   * Retorna o tema atual para persistência ou consulta
   */
  public getTheme(): SchoolTheme | null {
    return this.currentTheme;
  }

  /**
   * Gera um tema padrão (Áquila Pro Original)
   */
  public getDefaultTheme(): SchoolTheme {
    return {
      primaryColor: '#6366f1', // Indigo Vibrant
      secondaryColor: '#000000', // Deep Black
      accentColor: '#38bdf8', // Sky 400
      logoUrl: '🦅',           // Identidade Áquila Simplificada
      schoolName: 'Áquila Pro',
      isDarkMode: true
    };
  }
}

export const themeManager = ThemeManager.getInstance();
