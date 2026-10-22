import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { useIPC } from '../hooks/useIPC';

interface ScheduleEntry {
  id: string;
  room: string;
  teacher: string;
  subject: string;
  startTime: string;
  endTime: string;
  days: string[];
}

interface ScheduleFile {
  id: string;
  filename: string;
  uploadedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'error';
  entries: ScheduleEntry[];
  errorMessage?: string;
}

interface ScheduleUploadProps {
  onBack: () => void;
}

export const ScheduleUpload: React.FC<ScheduleUploadProps> = ({ onBack }) => {
  const ipc = useIPC();
  const [schedules, setSchedules] = useState<ScheduleFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const id = Date.now().toString();
        const newSchedule: ScheduleFile = {
          id,
          filename: file.name,
          uploadedAt: new Date(),
          status: 'processing',
          entries: [],
        };

        setSchedules(prev => [...prev, newSchedule]);

        try {
          const filePath = (file as any).path;
          const result = await ipc.invoke('import-schedule-excel', filePath);
          
          if (result && result.imported > 0) {
            setSchedules(prev =>
              prev.map(s =>
                s.id === id
                  ? {
                      ...s,
                      status: 'completed',
                      entries: [],
                    }
                  : s
              )
            );
            alert(`Sucesso! ${result.imported} aulas importadas com sucesso.`);
          } else {
            const errMsgs = result?.errors?.join('\n') || 'Erro ao processar planilha. Certifique-se de que a turma, sala e professor informados já estão cadastrados.';
            setSchedules(prev =>
              prev.map(s =>
                s.id === id
                  ? {
                      ...s,
                      status: 'error',
                      errorMessage: errMsgs,
                    }
                  : s
              )
            );
          }
        } catch (err: any) {
          setSchedules(prev =>
            prev.map(s =>
              s.id === id
                ? {
                    ...s,
                    status: 'error',
                    errorMessage: err.message || 'Falha de comunicação IPC.',
                  }
                : s
            )
          );
        }
      } else {
        alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const result = await ipc.invoke('export-schedule-template');
      if (result && result.success && result.filePath) {
        alert(`Template de Grade Horária exportado com sucesso em:\n${result.filePath}`);
      } else if (result && result.error) {
        alert(`Erro ao salvar template: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Erro ao exportar template: ${err.message}`);
    }
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Tem certeza que deseja remover este registro de importação?')) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'processing':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'error':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-radial-gradient(circle at top right, #0f172a, #020617) p-8 text-white font-sans">
      {/* Header */}
      <div className="mb-8 page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={onBack} className="mb-4 text-emerald-400 hover:text-emerald-300 transition flex items-center gap-2 font-bold text-sm bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <ArrowLeft size={16} /> Voltar para o Portal
          </button>
          <h1 className="text-3xl font-black bg-gradient-to-right from-emerald-400 to-blue-500 bg-clip-text text-transparent">Importação de Grade Horária</h1>
          <p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-wider">Histórico e Envio de Planilhas de Grade Acadêmica</p>
        </div>
        
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-glow transition-all"
        >
          <Download className="w-5 h-5" />
          Baixar Planilha Modelo
        </button>
      </div>

      {/* Upload Area */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-white mb-2">Enviar Grade Horária Mestra</h2>
          <p className="text-sm text-slate-400">Arraste seu arquivo Excel contendo as alocações curriculares organizadas por disciplina, professor, turma e sala.</p>
        </div>

        {/* Drag and Drop */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragActive
              ? 'border-emerald-400 bg-emerald-500/5'
              : 'border-slate-700 bg-slate-950/20 hover:border-emerald-500/50'
          }`}
        >
          <Upload className="w-16 h-16 text-emerald-400/50 mx-auto mb-4" />
          <p className="text-white font-bold text-lg mb-1">Arraste a planilha de grade aqui</p>
          <p className="text-slate-500 text-xs mb-4">Apenas formatos Excel (.xlsx, .xls) são válidos</p>
          
          <label className="inline-block bg-white/10 hover:bg-white/15 text-white border border-white/10 px-5 py-2.5 rounded-xl font-bold transition cursor-pointer">
            Selecionar Arquivo
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx,.xls" 
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }} 
            />
          </label>
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.map(schedule => (
          <div key={schedule.id} className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all shadow-lg">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h3 className="text-lg font-bold text-white">{schedule.filename}</h3>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    getStatusColor(schedule.status)
                  }`}>
                    {getStatusIcon(schedule.status)}
                    {schedule.status === 'completed' ? 'CONCLUÍDO' : schedule.status === 'processing' ? 'PROCESSANDO' : 'ERRO'}
                  </div>
                </div>
                <p className="text-slate-500 text-xs">
                  Carregado em {schedule.uploadedAt.toLocaleString('pt-BR')}
                </p>
                {schedule.errorMessage && (
                  <div className="bg-rose-500/5 border border-rose-500/15 p-3 rounded-lg mt-3 text-rose-300 text-xs font-mono whitespace-pre-wrap">
                    {schedule.errorMessage}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  className="flex items-center justify-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleUpload;
