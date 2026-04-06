import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, User, CheckCircle, AlertCircle, Loader2, X, FolderOpen } from 'lucide-react';

interface ImportRow {
  name: string;
  class: string;
  parentPhone: string;
  photoPath?: string;
  status?: 'pending' | 'success' | 'error';
  message?: string;
}

export const BatchPhotoImporter: React.FC = () => {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const aquila = (window as any).aquila;

  const handleSelectFolder = async () => {
    try {
      const result = await aquila.invoke('dialog:openDirectory');
      if (!result) return;
      
      // Solicita ao main.ts leitura dos arquivos da pasta
      const files = await aquila.invoke('scan-photo-folder', result);
      const parsed: ImportRow[] = (files || []).map((f: any) => ({
        name: f.name || 'Sem nome',
        class: f.class || '',
        parentPhone: f.phone || '',
        photoPath: f.path,
        status: 'pending',
      }));
      setRows(parsed);
    } catch (err) {
      console.error('Erro ao selecionar pasta:', err);
    }
  };

  const handleSelectSpreadsheet = async () => {
    try {
      const result = await aquila.invoke('dialog:openFile', { filters: [{ name: 'Excel', extensions: ['xlsx', 'csv'] }] });
      if (!result) return;
      const parsed = await aquila.invoke('parse-import-spreadsheet', result);
      setRows((parsed || []).map((r: any) => ({ ...r, status: 'pending' })));
    } catch (err) {
      console.error('Erro ao parsear planilha:', err);
    }
  };

  const runImport = async () => {
    setIsImporting(true);
    setProgress(0);
    try {
      const pendingRows = rows.filter(r => r.status === 'pending');
      if (pendingRows.length === 0) {
        setIsImporting(false);
        return;
      }

      // Usar a nova API de importação em lote para maior performance
      const result = await (window as any).aquila.invoke('import-students', pendingRows);
      if (result.success) {
        setRows(prev => prev.map(r => ({ ...r, status: 'success', message: 'Importado em lote' })));
        setProgress(100);
      }
    } catch (err: any) {
      console.error('Erro na importação em lote:', err);
    }
    setIsImporting(false);
  };

  const successCount = rows.filter(r => r.status === 'success').length;
  const errorCount = rows.filter(r => r.status === 'error').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black flex items-center gap-4">
            <Upload className="w-10 h-10 text-blue-500" />
            Importação em Massa
          </h1>
          <p className="text-slate-500 mt-2">Cadastre vários alunos de uma vez via pasta de fotos ou planilha Excel</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <button onClick={handleSelectFolder} className="group flex items-center gap-6 p-8 bg-slate-900 border border-white/5 rounded-3xl hover:bg-slate-800 hover:border-blue-500/20 transition-all">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderOpen className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-black text-lg">Selecionar Pasta de Fotos</p>
              <p className="text-slate-500 text-sm mt-1">Nome do arquivo = Nome do aluno</p>
            </div>
          </button>
          <button onClick={handleSelectSpreadsheet} className="group flex items-center gap-6 p-8 bg-slate-900 border border-white/5 rounded-3xl hover:bg-slate-800 hover:border-emerald-500/20 transition-all">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="font-black text-lg">Importar de Planilha</p>
              <p className="text-slate-500 text-sm mt-1">Excel ou CSV com nome, turma, telefone</p>
            </div>
          </button>
        </div>

        {rows.length > 0 && (
          <>
            {/* Progress Bar */}
            {isImporting && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Importando...</span>
                  <span className="text-xl font-black text-blue-400">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="importer-progress-fill" 
                    style={{ '--import-progress': `${progress}%` } as React.CSSProperties} 
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="flex gap-4 mb-6">
              <div className="px-6 py-3 bg-slate-900 border border-white/5 rounded-2xl text-sm font-bold">
                Total: <span className="text-white">{rows.length}</span>
              </div>
              {successCount > 0 && (
                <div className="px-6 py-3 bg-green-500/10 border border-green-500/20 rounded-2xl text-sm font-bold text-green-400">
                  ✅ {successCount} importados
                </div>
              )}
              {errorCount > 0 && (
                <div className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm font-bold text-red-400">
                  ❌ {errorCount} erros
                </div>
              )}
            </div>

            {/* Table Preview */}
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden mb-8">
              <div className="overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-slate-500 bg-slate-900 border-b border-white/5">
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-left">Nome</th>
                      <th className="px-6 py-4 text-left">Turma</th>
                      <th className="px-6 py-4 text-left">Telefone</th>
                      <th className="px-6 py-4 text-left">Foto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-all">
                        <td className="px-6 py-4">
                          {row.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-600" />}
                          {row.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {row.status === 'error' && (
                            <div title={row.message}>
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold">{row.name}</td>
                        <td className="px-6 py-4 text-slate-400">{row.class || '—'}</td>
                        <td className="px-6 py-4 text-slate-400 font-mono">{row.parentPhone || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase rounded-full px-2 py-1 ${row.photoPath ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'}`}>
                            {row.photoPath ? '✓ Sim' : 'Não'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={runImport}
              disabled={isImporting || rows.every(r => r.status !== 'pending')}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 rounded-3xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl shadow-blue-500/20"
            >
              {isImporting ? <><Loader2 className="w-5 h-5 animate-spin" /> Importando {progress}%...</> : `Iniciar Importação (${rows.filter(r => r.status === 'pending').length} alunos)`}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BatchPhotoImporter;
