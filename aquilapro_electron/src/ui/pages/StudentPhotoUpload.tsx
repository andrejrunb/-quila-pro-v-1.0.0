import React, { useState, useRef } from 'react';
import { Upload, Image, AlertCircle, CheckCircle, Trash2, Download } from 'lucide-react';

interface StudentPhoto {
  id: string;
  studentId: string;
  studentName: string;
  photoUrl: string;
  uploadedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface StudentPhotoUploadProps {
  onBack: () => void;
}

export const StudentPhotoUpload: React.FC<StudentPhotoUploadProps> = ({ onBack }) => {
  const [photos, setPhotos] = useState<StudentPhoto[]>([
    {
      id: '1',
      studentId: 'MAT001',
      studentName: 'João Silva',
      photoUrl: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3EFoto%3C/text%3E%3C/svg%3E',
      uploadedAt: new Date(),
      status: 'completed',
    },
  ]);

  const [uploadMode, setUploadMode] = useState<'individual' | 'batch'>('individual');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const students = [
    { id: 'MAT001', name: 'João Silva' },
    { id: 'MAT002', name: 'Maria Santos' },
    { id: 'MAT003', name: 'Pedro Oliveira' },
    { id: 'MAT004', name: 'Ana Costa' },
    { id: 'MAT005', name: 'Carlos Mendes' },
  ];

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
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: StudentPhoto = {
            id: Date.now().toString(),
            studentId: selectedStudent || 'UNKNOWN',
            studentName: students.find(s => s.id === selectedStudent)?.name || 'Desconhecido',
            photoUrl: e.target?.result as string,
            uploadedAt: new Date(),
            status: 'processing',
          };

          setPhotos([...photos, newPhoto]);

          // Simular processamento
          setTimeout(() => {
            setPhotos(prev =>
              prev.map(p =>
                p.id === newPhoto.id
                  ? { ...p, status: 'completed' }
                  : p
              )
            );
          }, 2000);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDeletePhoto = (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta foto?')) {
      setPhotos(photos.filter(p => p.id !== id));
    }
  };

  const handleDownloadTemplate = () => {
    // Simular download de template Excel
    alert('Template Excel será baixado');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
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
      case 'failed':
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload de Fotos de Alunos</h1>
        <p className="text-slate-600">Total: {photos.length} fotos cadastradas</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setUploadMode('individual')}
            className={`pb-3 px-4 font-medium transition ${
              uploadMode === 'individual'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload Individual
          </button>
          <button
            onClick={() => setUploadMode('batch')}
            className={`pb-3 px-4 font-medium transition ${
              uploadMode === 'batch'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload em Lote
          </button>
        </div>

        {uploadMode === 'individual' ? (
          <div className="space-y-4">
            {/* Seleção de Aluno */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Selecione o Aluno</label>
              <select
                title="Selecionar Aluno"
                aria-label="Selecionar Aluno"
                value={selectedStudent}
                onChange={e => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Selecione um aluno --</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.id})
                  </option>
                ))}
              </select>
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
              <Image className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium mb-1">Arraste a foto aqui</p>
              <p className="text-slate-500 text-sm mb-3">ou</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Selecionar Arquivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                title="Selecionar Imagem"
                aria-label="Selecionar Imagem"
                accept="image/*"
                onChange={e => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-600 mb-4">
              Baixe o template Excel, preencha com os dados dos alunos e faça upload do arquivo.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-5 h-5" />
              Baixar Template Excel
            </button>

            {/* Drag and Drop para Lote */}
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
              <p className="text-slate-500 text-sm mb-3">ou</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Selecionar Arquivo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Galeria de Fotos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Fotos Carregadas</h2>

        {photos.length === 0 ? (
          <p className="text-slate-600 text-center py-8">Nenhuma foto carregada ainda</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => (
              <div key={photo.id} className="bg-slate-100 rounded-lg overflow-hidden hover:shadow-lg transition">
                {/* Imagem */}
                <div className="relative h-40 bg-slate-200 flex items-center justify-center">
                  <img
                    src={photo.photoUrl}
                    alt={photo.studentName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      getStatusColor(photo.status)
                    }`}>
                      {getStatusIcon(photo.status)}
                      {photo.status === 'completed' ? 'Pronto' : photo.status === 'processing' ? 'Processando' : 'Erro'}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-medium text-slate-900 text-sm">{photo.studentName}</p>
                  <p className="text-slate-600 text-xs mb-3">{photo.studentId}</p>

                  {/* Ações */}
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPhotoUpload;
