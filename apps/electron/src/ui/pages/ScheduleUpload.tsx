import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, Trash2, Eye } from 'lucide-react';

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
  const [schedules, setSchedules] = useState<ScheduleFile[]>([
    {
      id: '1',
      filename: 'grade_horaria_2024.xlsx',
      uploadedAt: new Date(Date.now() - 86400000),
      status: 'completed',
      entries: [
        {
          id: '1',
          room: 'Sala 101',
          teacher: 'Prof. João',
          subject: 'Matemática',
          startTime: '08:00',
          endTime: '09:00',
          days: ['Segunda', 'Quarta', 'Sexta'],
        },
        {
          id: '2',
          room: 'Sala 101',
          teacher: 'Prof. Maria',
          subject: 'Português',
          startTime: '09:00',
          endTime: '10:00',
          days: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
        },
      ],
    },
  ]);

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

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const newSchedule: ScheduleFile = {
          id: Date.now().toString(),
          filename: file.name,
          uploadedAt: new Date(),
          status: 'processing',
          entries: [],
        };

        setSchedules([...schedules, newSchedule]);

        // Simular processamento
        setTimeout(() => {
          setSchedules(prev =>
            prev.map(s =>
              s.id === newSchedule.id
                ? {
                    ...s,
                    status: 'completed',
                    entries: [
                      {
                        id: '1',
                        room: 'Sala 101',
                        teacher: 'Prof. João',
                        subject: 'Matemática',
                        startTime: '08:00',
                        endTime: '09:00',
                        days: ['Segunda', 'Quarta', 'Sexta'],
                      },
                    ],
                  }
                : s
            )
          );
        }, 2000);
      } else {
        alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      }
    });
  };

  const handleDownloadTemplate = () => {
    alert('Template Excel será baixado');
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta grade horária?')) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-yellow-400 border-t-yellow-600 rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-800 transition flex items-center gap-1">
          ← Voltar para o Dashboard
        </button>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload de Grade Horária</h1>
        <p className="text-slate-600">Total: {schedules.length} grades carregadas</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Carregar Nova Grade Horária</h2>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition mb-4"
          >
            <Download className="w-5 h-5" />
            Baixar Template Excel
          </button>
        </div>

        {/* Drag and Drop */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
        >
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-1">Arraste o arquivo Excel aqui</p>
          <p className="text-slate-500 text-sm mb-3">Formatos suportados: .xlsx, .xls</p>
          <button className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Selecionar Arquivo
          </button>
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.map(schedule => (
          <div key={schedule.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">{schedule.filename}</h3>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(schedule.status)
                  }`}>
                    {getStatusIcon(schedule.status)}
                    {schedule.status === 'completed' ? 'Concluído' : schedule.status === 'processing' ? 'Processando' : 'Erro'}
                  </div>
                </div>
                <p className="text-slate-600 text-sm">
                  Carregado em {schedule.uploadedAt.toLocaleString('pt-BR')}
                </p>
                {schedule.errorMessage && (
                  <p className="text-red-600 text-sm mt-2">{schedule.errorMessage}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {schedule.status === 'completed' && (
                  <button
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setShowPreview(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </button>
                )}
                <button
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </button>
              </div>
            </div>

            {/* Entries Preview */}
            {schedule.entries.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-3">Aulas ({schedule.entries.length}):</p>
                <div className="space-y-2">
                  {schedule.entries.slice(0, 3).map(entry => (
                    <div key={entry.id} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {entry.subject} - {entry.room}
                        </p>
                        <p className="text-xs text-slate-600">
                          {entry.startTime} - {entry.endTime} | Prof. {entry.teacher}
                        </p>
                        <p className="text-xs text-slate-500">
                          {entry.days.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {schedule.entries.length > 3 && (
                    <p className="text-xs text-slate-600 text-center py-2">
                      +{schedule.entries.length - 3} mais aulas
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Visualizar Grade Horária
            </h2>

            <div className="space-y-3">
              {selectedSchedule.entries.map(entry => (
                <div key={entry.id} className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-900">{entry.subject}</p>
                  <p className="text-sm text-slate-600">
                    Sala: {entry.room} | Prof: {entry.teacher}
                  </p>
                  <p className="text-sm text-slate-600">
                    {entry.startTime} - {entry.endTime}
                  </p>
                  <p className="text-sm text-slate-600">
                    {entry.days.join(', ')}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowPreview(false)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleUpload;
