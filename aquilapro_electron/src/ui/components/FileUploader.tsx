import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  multiple?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFilesSelected, 
  accept = "*/*", 
  maxSizeMB = 10,
  label = "Arraste seus arquivos aqui ou clique para selecionar",
  multiple = true
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{file: File, status: 'pending' | 'success' | 'error', error?: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Arquivo muito grande (máx ${maxSizeMB}MB)`;
    }
    return null;
  };

  const handleFiles = (files: FileList) => {
    const newFiles = Array.from(files).map(file => {
      const error = validateFile(file);
      return {
        file,
        status: (error ? 'error' : 'pending') as 'pending' | 'error',
        error: error || undefined
      };
    });

    const updated = multiple ? [...selectedFiles, ...newFiles] : newFiles;
    setSelectedFiles(updated as any);
    
    const validFiles = newFiles.filter(f => f.status === 'pending').map(f => f.file);
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
      // Simulate success for UI feedback
      setTimeout(() => {
        setSelectedFiles(prev => prev.map(f => f.status === 'pending' ? { ...f, status: 'success' } : f));
      }, 1500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="file-uploader-container w-full">
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer group
          ${dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 bg-slate-900/30 hover:border-slate-500'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple={multiple} 
          accept={accept}
          title="Selecionar Arquivo"
          className="hidden" 
          aria-label="Selecionar Arquivo"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <div className={`w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <Upload className={`w-6 h-6 ${dragActive ? 'text-blue-400' : 'text-slate-400'}`} />
          </div>
          <p className="text-sm font-medium text-slate-300 mb-1">{label}</p>
          <p className="text-xs text-slate-500">TAMANHO MÁXIMO: {maxSizeMB}MB</p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${f.status === 'success' ? 'bg-green-500/10' : f.status === 'error' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                  <File className={`w-4 h-4 ${f.status === 'success' ? 'text-green-400' : f.status === 'error' ? 'text-red-400' : 'text-blue-400'}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 truncate max-w-[200px]">{f.file.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-black">
                    {(f.file.size / 1024).toFixed(1)} KB • {f.status === 'success' ? 'PRONTO' : f.status === 'error' ? f.error : 'CARREGANDO'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {f.status === 'success' && <CheckCircle size={14} className="text-green-500" />}
                {f.status === 'error' && <AlertCircle size={14} className="text-red-500" />}
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                  title="Remover Arquivo"
                  aria-label="Remover Arquivo"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
