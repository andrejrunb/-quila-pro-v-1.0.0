/**
 * Teste de Validação: Shield Pro (Middleware de Governança AGI)
 * Verifica se a purga de PII e a injeção de diretrizes estão funcionando.
 */

import { aiGovernanceService } from '../main/services/AIGovernanceService';

async function runShieldTest() {
  console.log('--- INICIANDO TESTE SHIELD PRO (FASE 500+) ---');

  const dirtyPrompt = "Olá, meu nome é João da Silva e moro na Rua das Flores, 123. Como posso melhorar o clima escolar?";
  console.log('\nPrompt Original:', dirtyPrompt);

  try {
    const shielded = await aiGovernanceService.shieldPrompt(dirtyPrompt, { provider: 'google', modelId: 'gemini-1.5-flash' });
    
    console.log('\nPrompt Protegido (Shielded):');
    console.log(shielded);

    // Verificações
    const hasOriginalPII = shielded.includes('João da Silva') || shielded.includes('Rua das Flores');
    const hasDirectives = shielded.includes('ÁQUILA PRO');

    if (!hasOriginalPII && hasDirectives) {
      console.log('\n✅ SUCESSO: PII foi mascarado e Diretrizes foram injetadas.');
    } else {
      console.error('\n❌ FALHA:');
      if (hasOriginalPII) console.error('- Dados PII ainda presentes no prompt!');
      if (!hasDirectives) console.error('- Diretrizes institucionais não foram injetadas!');
    }

    // Teste de Auditoria
    console.log('\nVerificando Logs de Auditoria...');
    const logs = await aiGovernanceService.getAuditLogs();
    const lastLog = logs[0];
    
    if (lastLog && lastLog.action === 'AIG_PROMPT_SHIELD') {
      console.log('✅ SUCESSO: Ação de auditoria registrada corretamente.');
    } else {
      console.error('❌ FALHA: Log de auditoria não encontrado ou incorreto.');
    }

  } catch (error) {
    console.error('❌ ERRO DURANTE O TESTE:', error);
  }
}

runShieldTest();
