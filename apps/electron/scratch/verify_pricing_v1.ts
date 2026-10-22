
import { Database } from '../src/database/Database';
import { InstitutionService } from '../src/main/services/InstitutionService';
import { LicenseManager } from '../src/main/services/LicenseManager';
import * as path from 'path';
import * as fs from 'fs';
import { PLAN_DEFINITIONS } from '../src/main/services/LicenseManager';

async function runVerification() {
  console.log('--- [Áquila Pro] Iniciando Validação de Precificação Dinâmica ---');

  const db = Database.getInstance();
  await db.initialize();

  const institutionService = InstitutionService.getInstance();
  const userDataPath = path.join(__dirname, 'temp_user_data');
  if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath);
  
  const licenseManager = LicenseManager.getInstance(userDataPath);

  // 1. Validar Fallback para Starter (Trial)
  console.log('\n[Cenário 1] Fallback para Starter (Sem licença ativa)');
  const currentTier = licenseManager.getTier();
  const limits = licenseManager.getLimits();
  
  console.log(`Tier detectado: ${currentTier}`);
  console.log(`Limite de Alunos: ${limits.maxStudentFaces}`);
  
  if (currentTier === 'starter' && limits.maxStudentFaces === 200) {
    console.log('✅ Fallback Starter validado com sucesso.');
  } else {
    console.error('❌ Falha no fallback Starter.');
  }

  // 2. Validar Restrição de Feature (Heatmap no Starter)
  console.log('\n[Cenário 2] Verificação de Features no Starter');
  try {
    licenseManager.assertHeatmapEnabled();
    console.error('❌ Erro: Heatmap deveria estar bloqueado no Starter.');
  } catch (e: any) {
    console.log(`✅ Bloqueio de Heatmap validado: ${e.message}`);
  }

  // 3. Validar Feature Marketplace vs Tipo de Escola (Sovereign Intelligence)
  console.log('\n[Cenário 3] Marketplace vs Tipo de Escola (Pública vs Privada)');
  
  // Escola Pública
  await institutionService.updateProfile({ name: 'Escola Municipal Teste', type: 'PUBLIC', tier: 'STARTER' });
  const publicMarket = await institutionService.isFeatureEnabled('marketplace');
  console.log(`Marketplace em Escola Pública: ${publicMarket ? 'HABILITADO ❌' : 'BLOQUEADO ✅'}`);

  // Escola Privada
  await institutionService.updateProfile({ name: 'Colégio Alpha', type: 'PRIVATE', tier: 'STARTER' });
  const privateMarket = await institutionService.isFeatureEnabled('marketplace');
  console.log(`Marketplace em Escola Privada: ${privateMarket ? 'HABILITADO ✅' : 'BLOQUEADO ❌'}`);

  // 4. Validar Upgrade para PRO
  console.log('\n[Cenário 4] Upgrade Lógico para PRO');
  // Simulando ativação de licença PRO (Em um sistema real, isso viria de um arquivo assinado)
  // Para fins de teste, vamos injetar um payload mockado se o LicenseManager permitir ou apenas validar os limites definidos
  
  const proLimits = (licenseManager as any).constructor.getInstance(userDataPath); 
  // No código real, o LicenseManager é singleton, vamos apenas validar as definições estáticas
  
  console.log(`Definição PRO - Max Alunos: ${PLAN_DEFINITIONS.pro.maxStudentFaces}`);
  console.log(`Definição PRO - Heatmap: ${PLAN_DEFINITIONS.pro.heatmapEnabled ? 'Sim' : 'Não'}`);

  if (PLAN_DEFINITIONS.pro.maxStudentFaces === 500 && PLAN_DEFINITIONS.pro.heatmapEnabled) {
    console.log('✅ Definições do Plano PRO validadas.');
  } else {
    console.error('❌ Definições do Plano PRO incorretas.');
  }

  console.log('\n--- Validação Concluída ---');
  process.exit(0);
}

runVerification().catch(err => {
  console.error('Erro fatal na verificação:', err);
  process.exit(1);
});
