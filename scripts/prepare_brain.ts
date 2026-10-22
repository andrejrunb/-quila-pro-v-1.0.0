import * as fs from 'fs';
import * as path from 'path';

/**
 * Script de Preparação do Project Brain (Áquila Pro)
 * Coleta os documentos mestres de inteligência e os consolida em uma pasta
 * para facilitar o upload manual ou via API para o NotebookLM.
 */

const projectRoot = process.cwd();
const brainDist = path.join(projectRoot, 'dist', 'project_brain');

const sourceFiles = [
  'PROJECT_BRAIN_ORIENTATION.md',
  'AGENTS.md',
  'ARCHITECTURE.md',
  'DESIGN.md',
  'README.md',
  'LGPD_COMPLIANCE_ANALYSIS.md'
];

async function prepare() {
  console.log('🦅 Iniciando Consolidação do Project Brain...');

  if (!fs.existsSync(brainDist)) {
    fs.mkdirSync(brainDist, { recursive: true });
  }

  let copiedCount = 0;

  for (const file of sourceFiles) {
    const src = path.join(projectRoot, file);
    const dest = path.join(brainDist, file);

    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`✅ Copiado: ${file}`);
      copiedCount++;
    } else {
      console.warn(`⚠️ Aviso: ${file} não encontrado.`);
    }
  }

  console.log(`\n🎉 Pronto! ${copiedCount} arquivos consolidados em: ${brainDist}`);
  console.log('Agora você pode arrastar esta pasta para o seu NotebookLM.');
}

prepare().catch(console.error);
