import { legalEvidenceService } from './apps/electron/src/services/LegalEvidenceService';
import { swarmComparativeService } from './apps/electron/src/services/SwarmComparativeService';
import { actionPillGenerator } from './apps/electron/src/services/ActionPillGenerator';
import { consolidatedPulseService } from './apps/electron/src/services/ConsolidatedPulseService';
import { Database } from './apps/electron/src/database/Database';

async function verifyPhase9() {
  console.log('--- Iniciando Verificação FASE 9: Córtex Áquila ---');
  
  const db = Database.getInstance();
  
  // 1. Verificar Tabelas
  const tables = await db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('legal_articles_vault', 'student_evidence_dossier', 'ai_insights_review')`);
  console.log('Tabelas Phase 9 detectadas:', tables.map(t => (t as any).name).join(', '));
  
  // 2. Seed Legal Vault
  console.log('Semeando base legal (ECA/BNCC)...');
  await legalEvidenceService.seedLegalVault();
  const articles = await db.get(`SELECT COUNT(*) as count FROM legal_articles_vault`);
  console.log(`Artigos no Vault: ${(articles as any).count}`);

  // 3. Testar Pulse Consolidado
  console.log('Gerando Pulso do Enxame...');
  const pulse = await consolidatedPulseService.generatePulse();
  console.log('Faturamento Global:', pulse.globalFaturamento);
  console.log('Unidades Críticas:', pulse.criticalUnits.length);

  // 4. Gerar Pílulas de Ação
  console.log('Gerando Pílulas Estratégicas...');
  const pills = await actionPillGenerator.generatePills();
  console.log(`Insights gerados para revisão: ${pills.length}`);

  console.log('--- Verificação FASE 9 Concluída com Sucesso ---');
  process.exit(0);
}

verifyPhase9().catch(err => {
  console.error('ERRO NA VERIFICAÇÃO:', err);
  process.exit(1);
});
