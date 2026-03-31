import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Clock, 
  User,
  Camera,
  MapPin
} from 'lucide-react';

interface Incident {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  zone?: string;
  camera_id?: string;
  studentId?: string;
  timestamp: string;
  evidence_path?: string;
}

interface Props {
  incident: Incident;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}

/**
 * IncidentResponseModal — Painel de Resposta a Incidentes (v1605)
 * Interface SOC para tratamento formal de alertas com trilha de auditoria.
 */
export const IncidentResponseModal: React.FC<Props> = ({ incident, onClose, onConfirm }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#0a1628]/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${getPriorityColor(incident.priority)}`}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Tratamento de Incidente</h2>
              <p className="text-sm text-slate-400 font-mono">ID: {incident.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors" title="Fechar modal">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Incident Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-300">
                <FileText size={16} className="text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Natureza</span>
              </div>
              <p className="text-lg font-medium text-white">{incident.title}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock size={16} className="text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Horário</span>
              </div>
              <p className="text-lg font-medium text-white">
                {new Date(incident.timestamp).toLocaleTimeString()}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin size={16} className="text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Localização</span>
              </div>
              <p className="text-white">{incident.zone || 'Zona Não Especificada'}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-300">
                <Camera size={16} className="text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recurso</span>
              </div>
              <p className="text-white font-mono text-sm">{incident.camera_id || 'N/A'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-slate-300 text-sm leading-relaxed">{incident.message}</p>
          </div>

          {/* Treatment Notes */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Notas de Resolução <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva as ações tomadas para mitigar este incidente..."
              className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
             <div className="flex items-center gap-2 text-slate-500 italic text-xs">
                <User size={14} />
                <span>Registrado por: Operador SOC (admin)</span>
             </div>
             
             <button
              onClick={handleConfirm}
              disabled={!notes.trim() || isSubmitting}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                !notes.trim() || isSubmitting
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20'
              }`}
            >
              <CheckCircle2 size={18} />
              {isSubmitting ? 'Processando...' : 'Confirmar Resolução'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
