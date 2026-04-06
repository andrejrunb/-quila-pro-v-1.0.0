import React, { useState } from 'react';
import { 
  ShieldCheck, HardDrive, Download, 
  ExternalLink, FileCheck, AlertCircle,
  Database, Activity
} from 'lucide-react';
import './ColdStorageUI.css';

interface ExportBlock {
  id: number;
  number: number;
  timestamp: string;
  hash: string;
  status: 'pending' | 'exported' | 'failed';
}

/**
 * COLD STORAGE UI (v3701)
 * -----------------------
 * Interface de cofre digital para exportação de blocos do Ledger.
 */
const ColdStorageUI: React.FC = () => {
  const [blocks, setBlocks] = useState<ExportBlock[]>([
    { id: 1024, number: 1024, timestamp: new Date().toISOString(), hash: 'sh256_sov_ag_001', status: 'pending' },
    { id: 1025, number: 1025, timestamp: new Date().toISOString(), hash: 'sh256_sov_ag_002', status: 'pending' }
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [mountPoint, setMountPoint] = useState('D:/AQUILA_SOVEREIGN_BACKUP');

  const handleExport = async (blockId: number) => {
    setIsExporting(true);
    try {
      // @ts-ignore
      const result = await window.electron.invoke('export-cold-storage', blockId);
      if (result.success) {
         setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, status: 'exported' } : b));
      } else {
         alert('Falha na exportação física. Verifique se o drive está montado.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="cold-storage-container">
      <header className="vault-header">
         <div className="flex items-center gap-4">
            <div className="glass-vault-icon">
               <ShieldCheck size={28} className="text-slate-200" />
            </div>
            <div>
               <h1 className="vault-title">Sovereign Evidence Vault</h1>
               <p className="vault-subtitle">Cold Storage & Auditoria Física (v3701)</p>
            </div>
         </div>
      </header>

      <div className="vault-body grid grid-cols-12 gap-8 mt-12">
         {/* Lado Esquerdo: Configuração do Drive */}
         <aside className="col-span-4 space-y-6">
            <div className="vault-config-card glass-panel-premium">
               <div className="flex items-center gap-3 mb-6">
                  <HardDrive size={18} className="text-blue-400" />
                  <h3 className="text-sm font-black uppercase">Mídia de Backup</h3>
               </div>
               <div className="mount-selector mt-4">
                  <span className="label text-[10px] text-slate-500 font-bold uppercase">Diretório de Destino</span>
                  <div className="input-group-premium mt-2">
                     <code>{mountPoint}</code>
                     <ExternalLink size={12} className="cursor-pointer" />
                  </div>
               </div>
               <div className="sync-status-badge mt-8 active">SISTEMA PRONTO PARA EXPORTAÇÃO</div>
            </div>

            <div className="integrity-checker-card glass-panel-premium">
               <div className="flex items-center gap-3 mb-6">
                  <FileCheck size={18} className="text-green-400" />
                  <h3 className="text-sm font-black uppercase">Auditoria de Midia</h3>
               </div>
               <button className="btn-vault-action w-full">Verificar Integridade Offline</button>
            </div>
         </aside>

         {/* Lado Direito: Listagem de Blocos do Ledger */}
         <main className="col-span-8">
            <div className="block-registry glass-panel-premium">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-black italic">Registro de Blocos Selados</h3>
                  <div className="flex items-center gap-2">
                     <Database size={14} className="text-slate-500" />
                     <span className="text-xs font-bold text-slate-500">LEDGER LOCAL ATIVO</span>
                  </div>
               </div>

               <div className="blocks-scroll-area">
                  {blocks.map(block => (
                     <div key={block.id} className="block-entry">
                        <div className="entry-left">
                           <div className="block-number">#{block.number}</div>
                           <div className="block-meta">
                              <span className="ts">{new Date(block.timestamp).toLocaleString()}</span>
                              <code className="hash">{block.hash.substring(0, 12)}...</code>
                           </div>
                        </div>
                        <div className="entry-right">
                           {block.status === 'exported' ? (
                              <div className="badge-exported">
                                 <FileCheck size={14} /> EXPORTADO
                              </div>
                           ) : (
                              <button 
                                className="btn-export-trigger" 
                                onClick={() => handleExport(block.id)}
                                disabled={isExporting}
                              >
                                 <Download size={14} /> EXPORTAR
                              </button>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </main>
      </div>

      <footer className="vault-footer mt-auto">
         <div className="ribbon-v4002">
            <AlertCircle size={14} className="text-amber-500" />
            <span>Aviso de Protocolo: Exportações físicas devem ser arquivadas em locais com temperatura entre 18ºC e 24ºC (Padrão Sovereign).</span>
         </div>
      </footer>
    </div>
  );
};

export default ColdStorageUI;
