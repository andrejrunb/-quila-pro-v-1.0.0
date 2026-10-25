/**
 * scripts/restore_edge.ts — CLI de Restauração e DR Drill (Áquila Pro v2.1)
 * 
 * Uso:
 * 1. Simulação Semanal de Restauração (Drill sem alterar banco ao vivo):
 *    node scripts/restore_edge.cjs --backup "C:/AquilaPro/backups/aquila_backup_....aquila.bak" --drill
 * 
 * 2. Restauração Real de Emergência:
 *    node scripts/restore_edge.cjs --backup "C:/AquilaPro/backups/aquila_backup_....aquila.bak" --target "C:/AquilaPro/aquila.db"
 */

import * as path from 'path';
import { SQLiteDisasterRecoveryService } from '../apps/electron/src/main/services/SQLiteDisasterRecoveryService';

function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
      options[key] = val;
    }
  }

  return options;
}

async function main() {
  const args = parseArgs();
  const backupFilePath = args['backup'];
  const targetPath = args['target'];
  const isDrill = args['drill'] === 'true' || (!targetPath && !args['restore']);
  const masterKey = args['key'] || process.env.AQUILA_BACKUP_MASTER_KEY;

  if (!backupFilePath) {
    console.error('❌ Parâmetro obrigatório ausente: --backup <caminho_do_arquivo.aquila.bak>');
    process.exit(1);
  }

  console.log('🏛️ ==============================================================');
  console.log(`   ÁQUILA PRO — ${isDrill ? 'SIMULAÇÃO DE RESTAURAÇÃO (RESTORE DRILL)' : 'PROCEDIMENTO DE RESTAURAÇÃO REAL (DR)'}`);
  console.log('==============================================================');
  console.log(`📦 Arquivo de Backup: ${backupFilePath}`);
  if (!isDrill && targetPath) {
    console.log(`🎯 Destino do Banco:   ${targetPath}`);
  }
  console.log('--------------------------------------------------------------');

  try {
    if (isDrill) {
      const drill = SQLiteDisasterRecoveryService.runRestoreDrill(backupFilePath, masterKey);
      drill.log.forEach(line => console.log(line));

      if (drill.success && drill.underTwoMinutes && drill.integrityOk) {
        console.log('\n🏆 RESTORE DRILL CONCLUÍDO COM SUCESSO ABSOLUTO (Tempo < 2 min, integridade OK).');
        process.exit(0);
      } else {
        console.error('\n❌ Falha no Restore Drill.');
        process.exit(1);
      }
    } else {
      if (!targetPath) {
        console.error('❌ Parâmetro obrigatório ausente para restauração real: --target <caminho_do_banco>');
        process.exit(1);
      }

      const res = SQLiteDisasterRecoveryService.restoreEncryptedBackup({
        backupFilePath,
        targetRestorePath: targetPath,
        masterKey,
        actor: 'OPERATOR_DISASTER_RECOVERY'
      });

      console.log(`✅ Banco restaurado com sucesso em ${res.durationMs.toFixed(2)} ms!`);
      console.log(`   - PRAGMA integrity_check: ${res.integrityPragma}`);
      console.log(`   - Hash SHA-256 Validado:  ${res.sha256Verified ? 'SIM' : 'NÃO'}`);
      console.log(`   - Estudantes Carregados:  ${res.manifest.rowCounts.students}`);
      console.log(`   - Audits Carregados:      ${res.manifest.rowCounts.zero_bypass_audits}`);
      console.log('==============================================================\n');
      process.exit(0);
    }
  } catch (err: any) {
    console.error(`❌ Falha fatal no procedimento de restauração: ${err.message}`);
    process.exit(1);
  }
}

main();
