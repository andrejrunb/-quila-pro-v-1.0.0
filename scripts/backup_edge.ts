/**
 * scripts/backup_edge.ts — CLI de Backup Diário Edge (Áquila Pro v2.1)
 * 
 * Uso via Windows Task Scheduler ou Linux Cron:
 * node scripts/backup_edge.cjs --db "C:/AquilaPro/aquila.db" --dest "C:/AquilaPro/backups" --dest-secondary "D:/AquilaBackups"
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

  const defaultAppData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
  const defaultDb = path.join(defaultAppData || '.', 'AquilaPro', 'aquila.db');
  const defaultDest = path.join(defaultAppData || '.', 'AquilaPro', 'backups');

  const dbPath = args['db'] || defaultDb;
  const backupPrimaryDir = args['dest'] || defaultDest;
  const backupSecondaryDir = args['dest-secondary'] || process.env.AQUILA_SECONDARY_BACKUP_DIR;
  const masterKey = args['key'] || process.env.AQUILA_BACKUP_MASTER_KEY;
  const author = args['author'] || 'WINDOWS_TASK_SCHEDULER';

  console.log('🏛️ ==============================================================');
  console.log('   ÁQUILA PRO — ROTINA DIÁRIA DE BACKUP & DR (SQLITE EDGE)');
  console.log('==============================================================');
  console.log(`📁 Banco de Origem:   ${dbPath}`);
  console.log(`🎯 Destino Primário:  ${backupPrimaryDir}`);
  if (backupSecondaryDir) {
    console.log(`💾 Destino Secundário: ${backupSecondaryDir}`);
  }
  console.log(`🔐 Criptografia:      AES-256-GCM (Auth Tag Integrada)`);
  console.log('--------------------------------------------------------------');

  try {
    const res = SQLiteDisasterRecoveryService.createEncryptedBackup({
      dbPath,
      backupPrimaryDir,
      backupSecondaryDir,
      masterKey,
      author
    });

    console.log(`✅ Backup concluído com sucesso em ${res.durationMs.toFixed(2)} ms!`);
    console.log(`   - Arquivo Primário: ${res.backupFile}`);
    console.log(`   - Tamanho Cifrado:  ${res.sizeEncryptedBytes} bytes`);
    console.log(`   - Hash SHA-256 DB:  ${res.manifest.sha256}`);
    console.log(`   - Estudantes Salvos: ${res.manifest.rowCounts.students}`);
    console.log(`   - Audits Salvos:     ${res.manifest.rowCounts.zero_bypass_audits}`);
    if (res.secondaryFile) {
      console.log(`   - Cópia Externa:    ${res.secondaryFile}`);
    }
    console.log('==============================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error(`❌ Erro fatal durante a rotina de backup: ${err.message}`);
    process.exit(1);
  }
}

main();
