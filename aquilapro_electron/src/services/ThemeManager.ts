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
      primaryColor: '#2563eb', // Blue 600
      secondaryColor: '#0f172a', // Slate 900
      accentColor: '#38bdf8', // Sky 400
      logoUrl: '/assets/logo.png',
      schoolName: 'Áquila School',
      isDarkMode: true
    };
  }
}

export const themeManager = ThemeManager.getInstance();
