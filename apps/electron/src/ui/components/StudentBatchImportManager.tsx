import React, { useState, useRef } from 'react';
import { 
  UploadCloud, AlertTriangle, CheckCircle2, FileText, 
  Users, RefreshCw, Database, ShieldAlert, ArrowRight
} from 'lucide-react';

interface ValidationErrorItem {
  lineNumber: number;
  field: string;
  value: string;
  message: string;
}

interface ImportPreviewReport {
  batchId: string;
  contentHash: string;
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateInBatchCount: number;
  alreadyEnrolledCount: number;
  errors: ValidationErrorItem[];
  validRows: any[];
  canProceedToConfirm: boolean;
  generatedAt: string;
}

interface ImportResult {
  batchId: string;
  success: boolean;
  insertedCount: number;
  updatedCount: number;
  ignoredCount: number;
  errorsCount: number;
  idempotentVerificationHash: string;
  completedAt: string;
}

export const StudentBatchImportManager: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewReport | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsLoadingPreview(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const content = await file.text();
      const win = window as any;
      if (!win.aquila?.invoke) {
        throw new Error('Ambiente de desktop Áquila Pro não detectado.');
      }

      const report: ImportPreviewReport = await win.aquila.invoke('batch-import:preview', {
        csvContent: content,
        schoolId: 'school-aquila-main'
      });

      setPreview(report);
    } catch (err: any) {
      console.error('[StudentBatchImportManager] Erro na prévia:', err);
      setErrorMessage(err.message || 'Falha ao processar prévia do arquivo.');
      setPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleConfirm = async () => {
    if (!preview || !preview.canProceedToConfirm) return;
    setIsConfirming(true);
    setErrorMessage(null);

    try {
      const win = window as any;
      const res: ImportResult = await win.aquila.invoke('batch-import:confirm', {
        batchId: preview.batchId,
        schoolId: 'school-aquila-main',
        operatorUserId: 'user-sec-01'
      });

      setResult(res);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('[StudentBatchImportManager] Erro na confirmação:', err);
      setErrorMessage(err.message || 'Falha ao confirmar importação do lote.');
    } finally {
      setIsConfirming(false);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div data-testid="import-container" className="p-6 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-col gap-6 text-zinc-100 animate-fade-in shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <UploadCloud size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Ingestão e Importação de Matrículas em Lote
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Pipeline Auditável
              </span>
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              Prévia determinística, reconciliação sem duplicação e integridade transacional SQLite.
            </p>
          </div>
        </div>

        {(preview || result) && (
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 rounded-lg transition"
          >
            <RefreshCw size={13} />
            <span>Novo Lote</span>
          </button>
        )}
      </div>

      {/* File Upload Selector (Native, 100% visible and accessible for E2E) */}
      <div className="flex flex-col gap-2 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <FileText size={16} className="text-emerald-400" />
          <span>Selecione a Planilha de Matrículas (CSV formatado com cabeçalho)</span>
        </label>
        <input
          data-testid="file-upload-input"
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileInputChange}
          className="w-full text-sm text-zinc-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer bg-zinc-900 border border-zinc-700 rounded-lg p-2 transition focus:border-emerald-500 focus:outline-none"
        />
        <div className="flex items-center justify-between text-xs text-zinc-500 mt-1">
          <span>Campos esperados: nome, matricula, turma, data_nascimento, responsavel_legal, telefone_responsavel</span>
          {selectedFile && <span className="text-emerald-400 font-mono">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>}
        </div>
      </div>

      {/* Loading state */}
      {isLoadingPreview && (
        <div className="flex items-center justify-center p-8 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
          <RefreshCw className="animate-spin text-emerald-400 mr-3" size={20} />
          <span className="text-sm text-zinc-300">Processando e validando prévia determinística do lote...</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-red-200 text-sm flex items-start gap-3">
          <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-semibold text-red-300">Falha na Operação</p>
            <p className="text-xs text-red-200/80 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* SUMMARY / STATUS AREA */}
      {preview && !result && (
        <div
          data-testid="import-summary"
          role="status"
          className="status-area flex flex-col gap-4 p-5 rounded-xl border transition animate-fade-in bg-zinc-900/40 border-zinc-800"
        >
          {preview.errors.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 text-amber-300 bg-amber-950/30 p-4 rounded-lg border border-amber-500/30">
                <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-bold text-amber-200">
                    Lote com {preview.errors.length} registros inválidos e inconsistências detectadas!
                  </h3>
                  <p className="text-xs text-amber-300/90 mt-1">
                    A importação foi bloqueada para proteger o banco escolar. Corrija os erros listados no CSV antes de prosseguir.
                  </p>
                </div>
              </div>

              {/* Inconsistency Breakdown */}
              <div className="max-h-60 overflow-y-auto border border-zinc-800 rounded-lg bg-zinc-950/60 p-3">
                <div className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                  Dossiê de Inconsistências Linha a Linha:
                </div>
                <div className="space-y-1.5">
                  {preview.errors.map((err, i) => (
                    <div key={i} className="text-xs flex items-center justify-between p-2 rounded bg-red-950/20 border border-red-900/30 text-red-200">
                      <span className="font-mono text-zinc-400">Linha {err.lineNumber}:</span>
                      <span className="font-medium text-amber-300 mx-2">[{err.field}]</span>
                      <span className="flex-1 text-zinc-300">{err.message}</span>
                      {err.value && <span className="text-zinc-500 font-mono text-[11px] truncate max-w-[140px]">({err.value})</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 text-emerald-300 bg-emerald-950/30 p-4 rounded-lg border border-emerald-500/30">
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-bold text-emerald-200">
                    Prévia aprovada: {preview.validRowsCount} alunos válidos prontos para importação.
                  </h3>
                  <p className="text-xs text-emerald-300/90 mt-1">
                    Todos os campos obrigatórios, integridade de turma e ausência de conflitos cadastrais foram verificados com sucesso.
                  </p>
                </div>
              </div>

              {/* Valid Students Table Preview */}
              <div className="max-h-64 overflow-y-auto border border-zinc-800 rounded-lg bg-zinc-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/80 sticky top-0 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Matrícula</th>
                      <th className="p-2.5">Nome do Aluno</th>
                      <th className="p-2.5">Turma</th>
                      <th className="p-2.5">Responsável Legal</th>
                      <th className="p-2.5">Contato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {preview.validRows.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/40 text-zinc-200">
                        <td className="p-2.5 font-mono text-zinc-500">{row.lineNumber}</td>
                        <td className="p-2.5 font-mono font-medium text-emerald-400">{row.enrollmentId}</td>
                        <td className="p-2.5 font-semibold text-white">{row.fullName}</td>
                        <td className="p-2.5 text-zinc-300">{row.className}</td>
                        <td className="p-2.5 text-zinc-300">{row.guardianName}</td>
                        <td className="p-2.5 font-mono text-zinc-400">{row.guardianContact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.validRows.length > 15 && (
                  <div className="p-2 text-center text-xs text-zinc-500 bg-zinc-900/40 border-t border-zinc-800">
                    ... e mais {preview.validRows.length - 15} alunos validados no lote.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button Bar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/60">
            <button
              onClick={resetAll}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              data-testid="btn-confirm-import"
              onClick={handleConfirm}
              disabled={!preview.canProceedToConfirm || isConfirming}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold shadow-lg transition ${
                preview.canProceedToConfirm && !isConfirming
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:shadow-emerald-900/30'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
              }`}
            >
              {isConfirming ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  <span>Persistindo no SQLite...</span>
                </>
              ) : (
                <>
                  <Database size={14} />
                  <span>Confirmar e Importar Matrículas</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* FINAL RESULT MESSAGE */}
      {result && (
        <div
          data-testid="import-result"
          className="p-6 rounded-xl border animate-fade-in flex flex-col gap-4 bg-zinc-900/60 border-zinc-700"
        >
          {result.insertedCount > 0 ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-400 shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-bold text-white">
                  Importação concluída com sucesso! {result.insertedCount} alunos inseridos no banco escolar.
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Transação atômica finalizada e hash de integridade registrado na auditoria Zero-Bypass ({result.idempotentVerificationHash}).
                </p>
                {result.ignoredCount > 0 && (
                  <p className="text-xs text-amber-400 mt-1 font-mono">
                    {result.ignoredCount} registros já cadastrados foram ignorados para evitar duplicidade.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-cyan-400 shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-bold text-white">
                  Importação concluída: 0 inseridos, {result.ignoredCount} já cadastrados (registros existentes ignorados).
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Reimportação idempotente verificada. Nenhum registro duplicado foi inserido.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={resetAll}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition"
            >
              <span>Concluir</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentBatchImportManager;
