import { EventEmitter } from 'events';

export type Language = 'pt_br' | 'en_us' | 'es_es';

/**
 * TranslationService.ts — AG-038
 * Gerencia a localização de toda a interface do Áquila Pro.
 */
class TranslationService extends EventEmitter {
  private currentLanguage: Language = 'pt_br';
  private translations: Record<Language, any> = {
    pt_br: { title: 'Áquila Pro', dashboard: 'Painel', students: 'Alunos', alerts: 'Alertas' },
    en_us: { title: 'Eagle Pro', dashboard: 'Dashboard', students: 'Students', alerts: 'Alerts' },
    es_es: { title: 'Águila Pro', dashboard: 'Panel', students: 'Estudiantes', alerts: 'Alertas' }
  };

  public setLanguage(lang: Language) {
    this.currentLanguage = lang;
    console.log(`[i18n] Idioma alterado para: ${lang}`);
    this.emit('language-changed', lang);
  }

  public translate(key: string): string {
    return this.translations[this.currentLanguage][key] || key;
  }

  public getLanguage() {
    return this.currentLanguage;
  }
}

export const translationService = new TranslationService();
export default translationService;
