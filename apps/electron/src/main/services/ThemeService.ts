/**
 * ThemeService.ts — Item 29
 * Persiste preferência de tema dark/light e escala de fonte.
 * Emite IPC para o renderer aplicar imediatamente sem reload.
 */

import * as fs from 'fs';
import * as path from 'path';

export type ThemePreference = 'dark' | 'light' | 'system';

interface ThemeConfig {
  theme: ThemePreference;
  fontSize: 'sm' | 'md' | 'lg';
  accentColor: string;     // Hex como #3B82F6
  schoolName: string;      // Step 64: White-label
  schoolLogo: string | null; // Base64 ou path
  primaryColor: string;    // Cor principal da marca da escola
  currentPlanId: string;   // Relacionado ao Branding (Starter/Elite)
}

const DEFAULT_THEME: ThemeConfig = {
  theme: 'dark',
  fontSize: 'md',
  accentColor: '#3B82F6',
  schoolName: 'Áquila Pro Enterprise',
  schoolLogo: null,
  primaryColor: '#6366F1', // Indigo padrão
  currentPlanId: 'basic'   // Padrão sem White-Label
};

export class ThemeService {
  private config: ThemeConfig = DEFAULT_THEME;
  private readonly configPath: string;

  constructor(userDataPath: string) {
    this.configPath = path.join(userDataPath, 'theme.json');
    this._load();
  }

  getConfig(): ThemeConfig {
    return this.config;
  }

  update(partial: Partial<ThemeConfig>): ThemeConfig {
    this.config = { ...this.config, ...partial };
    this._save();
    return this.config;
  }

  private _load(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      }
    } catch {
      this.config = { ...DEFAULT_THEME };
    }
  }

  private _save(): void {
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
  }
}

