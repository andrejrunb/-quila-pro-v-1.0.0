import React, { useState } from 'react';

interface PrivacyConsentModalProps {
  onAccept: () => void;
  isOpen: boolean;
}

export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({ onAccept, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-[#334155] bg-gradient-to-r from-blue-600/20 to-transparent">
          <h2 className="text-2xl font-bold text-white">Soberania & Privacidade</h2>
          <p className="text-gray-400 text-sm mt-1">Conformidade Áquila Pro v1.0 (LGPD)</p>
        </div>
        
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <div className="prose prose-invert max-w-none text-gray-300">
            <h3 className="text-white text-lg font-semibold mb-4">Termos de Processamento de IA</h3>
            <p>
              Ao utilizar este sistema, você concorda que o processamento biométrico facial ocorre exclusivamente
              no hardware local (**Áquila Edge Hub**). Nenhuma imagem sensível é transmitida para a nuvem.
            </p>
            <p className="mt-4">
              A coleta de dados de menores é realizada sob a base legal do consentimento dos responsáveis
              (Art. 14 LGPD) e proteção da vida/segurança no perímetro escolar.
            </p>
            <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 mt-6">
              <p className="text-sm">
                <strong>Nota:</strong> O uso continuado do sistema implica na aceitação tácita das políticas de
                segurança e auditoria da rede escolar.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#1e293b] flex justify-end gap-4">
          <button 
            className="px-6 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            onClick={() => window.close()}
          >
            Sair
          </button>
          <button 
            className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-blue-500/20"
            onClick={onAccept}
          >
            Aceitar e Iniciar
          </button>
        </div>
      </div>
    </div>
  );
};
