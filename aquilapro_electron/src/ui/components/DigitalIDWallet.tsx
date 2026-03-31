import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Share2, Download } from 'lucide-react';

interface DigitalIDWalletProps {
  studentName: string;
  studentId: string;
}

/**
 * DigitalIDWallet.tsx — AG-016
 * Carteirinha de Estudante Digital do Áquila Pro.
 */
const DigitalIDWallet: React.FC<DigitalIDWalletProps> = ({ studentName, studentId }) => {
  // O QR Code contém um token assinado (aqui simplificado para o ID)
  const qrValue = `AQUILA_PRO_${studentId}_${Date.now()}`;

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 max-w-sm mx-auto">
      {/* Top Brand */}
      <div className="bg-emerald-600 p-6 text-white text-center">
        <div className="flex justify-center mb-2">
          <Shield size={32} />
        </div>
        <h2 className="text-xl font-bold">Carteirinha Digital</h2>
        <p className="text-xs opacity-70">Áquila Pro Academy v1.0</p>
      </div>

      {/* QR Code Section */}
      <div className="p-8 flex flex-col items-center">
        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 mb-6">
          <QRCodeSVG value={qrValue} size={180} />
        </div>

        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-slate-800">{studentName}</h3>
          <p className="text-sm text-slate-500 font-mono mt-1">ID: {studentId.slice(0, 8)}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 w-full">
          <button className="flex-1 bg-slate-100 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-slate-200 transition">
            <Download size={16} /> Salvar
          </button>
          <button className="flex-1 bg-slate-100 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-slate-200 transition">
            <Share2 size={16} /> Compartilhar
          </button>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-slate-50 px-6 py-4 text-[10px] text-center opacity-40 border-t grayscale">
        Este documento é de uso pessoal e intransferível. 
        Válido apenas para ingresso na unidade central.
      </div>
    </div>
  );
};

export default DigitalIDWallet;
