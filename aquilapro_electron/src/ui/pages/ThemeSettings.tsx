import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
import './ThemeSettings.css';

type Theme = 'light' | 'dark' | 'auto';

export const ThemeSettings: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [customColors, setCustomColors] = useState({
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#10b981',
  });
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--preview-primary', customColors.primary);
      containerRef.current.style.setProperty('--preview-secondary', customColors.secondary);
      containerRef.current.style.setProperty('--preview-accent', customColors.accent);
    }
  }, [customColors]);

  const themes = [
    { id: 'light', name: 'Claro', description: 'Interface clara', icon: Sun },
    { id: 'dark', name: 'Escuro', description: 'Interface escura', icon: Moon },
    { id: 'auto', name: 'Automático', description: 'Sistema SO', icon: Palette },
  ];

  const handleColorChange = (key: string, value: string) => {
    setCustomColors(prev => ({ ...prev, [key]: value }));
    document.documentElement.style.setProperty(`--color-${key}`, value);
  };

  return (
    <div className="theme-settings-container" ref={containerRef}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configurações de Tema</h1>
        <p className="opacity-70">Personalize a aparência da aplicação</p>
      </div>

      <div className="theme-card">
        <h2 className="text-xl font-semibold mb-4">Escolha o Tema</h2>
        <div className="theme-grid">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as Theme)}
              className={`theme-btn ${theme === t.id ? 'active' : ''}`}
            >
              <t.icon className="w-6 h-6 mb-2 mx-auto" />
              <div className="font-bold">{t.name}</div>
              <div className="text-xs opacity-60">{t.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="color-card">
        <h2 className="text-xl font-semibold mb-4">Paleta Eagle Dark (Onda 3)</h2>
        <div className="color-grid">
          {Object.entries(customColors).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
              <input
                type="color"
                value={value}
                onChange={e => handleColorChange(key, e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-none"
                title={`Selecionar cor ${key}`}
              />
              <div>
                <div className="text-xs font-bold uppercase opacity-50">{key}</div>
                <div className="font-mono text-sm">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="preview-card">
        <h2 className="text-xl font-semibold mb-4">Pré-visualização em Tempo Real</h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <button className="btn-preview-primary px-6 py-2 rounded-lg text-white font-bold">Primário</button>
            <button className="btn-preview-secondary px-6 py-2 rounded-lg text-white font-bold">Secundário</button>
            <button className="btn-preview-accent px-6 py-2 rounded-lg text-white font-bold">Destaque</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-preview-primary p-4 bg-slate-800 rounded-lg border border-white/5">
              <div className="text-sm font-bold opacity-80">Trend Alpha</div>
              <div className="text-xs opacity-50">Predição de Engajamento</div>
            </div>
            <div className="card-preview-secondary p-4 bg-slate-800 rounded-lg border border-white/5">
              <div className="text-sm font-bold opacity-80">Trend Beta</div>
              <div className="text-xs opacity-50">Análise de Fluxo</div>
            </div>
            <div className="card-preview-accent p-4 bg-slate-800 rounded-lg border border-white/5">
              <div className="text-sm font-bold opacity-80">Trend Gamma</div>
              <div className="text-xs opacity-50">Evasão Crítica</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button className="save-btn-theme">SALVAR PALETA SOBERANA</button>
      </div>
    </div>
  );
};

export default ThemeSettings;
