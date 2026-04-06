import React, { useState, useEffect } from 'react';
import { Shield, Palette, Upload, Save } from 'lucide-react';
import './SchoolBranding.css';

/**
 * SchoolBranding.tsx — Passo 22 do Roadmap.
 * Interface para personalização visual da escola (White-Label Lite).
 * Zero-Debt Standard: 100% Vanilla CSS.
 */
export const SchoolBranding: React.FC = () => {
  const [logo, setLogo] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [isSaving, setIsSaving] = useState(false);
  const aquila = (window as any).aquila;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await aquila.invoke('get-school-settings');
      if (settings) {
        setLogo(settings.schoolLogo);
        setPrimaryColor(settings.primaryColor || '#3b82f6');
      }
    } catch (err) {
      console.error('Erro ao carregar configurações de branding:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await aquila.invoke('update-school-branding', { logo, primaryColor });
      alert('Identidade Visual Atualizada!');
    } catch (err) {
      alert('Erro ao salvar identidade visual.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="branding-page">
      <header className="branding-header">
        <h1 className="branding-title">
          <Palette className="icon-palette" size={40} />
          Identidade Visual
        </h1>
        <p className="branding-subtitle">Personalize a aparência do Áquila Pro para sua escola</p>
      </header>

      <div className="branding-grid">
        {/* Logo Upload */}
        <div className="branding-card">
          <h2 className="section-title">
            <Upload size={20} className="icon-upload" /> Logo da Escola
          </h2>
          <div className="logo-dropzone">
            {logo ? (
                <img src={logo} alt="Logo Preview" className="logo-preview-img" />
            ) : (
                <div className="dropzone-text">
                    <p className="dropzone-prompt">Arraste ou clique para enviar</p>
                    <p className="dropzone-hint">PNG ou SVG (Fundo Transparente)</p>
                </div>
            )}
            <input 
                type="file" 
                title="Upload Logo da Escola"
                aria-label="Upload Logo da Escola"
                className="file-input-hidden" 
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (re) => setLogo(re.target?.result as string);
                        reader.readAsDataURL(file);
                    }
                }}
            />
          </div>
        </div>

        {/* Color Palette */}
        <div className="branding-card">
          <h2 className="section-title">
            <Shield size={20} className="icon-shield" /> Cor Primária
          </h2>
          <div className="color-controls">
            <input 
                type="color" 
                title="Escolher Cor Primária"
                aria-label="Escolher Cor Primária"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="color-input-large"
            />
            <div className="color-info">
                <p className="color-hex">{primaryColor.toUpperCase()}</p>
                <p className="color-default-hint">Padrão: #3B82F6 (Blue 500)</p>
            </div>
          </div>
          
          <div className="preview-container">
             <p className="preview-label">Preview de Botão</p>
             <button className="btn-preview">
                Confirmar Presença
             </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="btn-save-branding"
      >
        {isSaving ? 'Salvando...' : <><Save size={20} /> Salvar Alterações</>}
      </button>
    </div>
  );
};

export default SchoolBranding;
