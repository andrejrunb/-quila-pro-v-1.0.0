import { ollamaIntegration } from '../main/services/OllamaIntegration';
import { Database } from '../database/Database';
import { GenerativeAIService } from '../main/services/GenerativeAIService';
import { AttendanceCalculator } from '../main/services/AttendanceCalculator';

/**
 * Script de Teste: Validação de IA Soberana (LM Studio / Qwen3)
 * Execute via ts-node ou após compilação.
 */
async function testSovereignAI() {
  console.log('--- [TESTE] Iniciando Validação de IA Soberana ---');

  try {
    // 1. Inicializar DB e verificar instâncias
    const db = Database.getInstance();
    await db.initialize();
    
    const settings = await db.getSettings();
    console.log(`[Config] Provedor: ${settings.ai_provider}`);
    console.log(`[Config] Endpoint: ${settings.ai_endpoint}`);
    console.log(`[Config] Modelo: ${settings.ai_model_id}`);

    // 2. Testar Redirecionamento no OllamaIntegration
    console.log('\n[Passo 1] Testando OllamaIntegration.generate (Redirect)...');
    const testPrompt = 'Olá Qwen! Você está operando como o cérebro soberano do Áquila Pro? Responda de forma breve.';
    const response = await ollamaIntegration.generate(testPrompt);
    
    console.log('--- RESPOSTA DO MODELO ---');
    console.log(response);
    console.log('--------------------------');

    // 3. Testar GenerativeAIService (Relatório Pedagógico)
    console.log('\n[Passo 2] Testando GenerativeAIService.generatePedagogicalReport...');
    const calculator = new AttendanceCalculator();
    const genService = new GenerativeAIService(db, calculator);
    
    // Pegar um aluno aleatório para teste
    const students = await db.all('SELECT id, name FROM students WHERE id IS NOT NULL LIMIT 1');
    if (students && students.length > 0) {
      console.log('[DEBUG] Aluno encontrado:', students[0]);
      const report = await genService.generatePedagogicalReport(students[0].id);
      console.log('--- RELATÓRIO GERADO ---');
      console.log(report);
      console.log('------------------------');
    } else {
      console.warn('[Aviso] Nenhum aluno encontrado para testar relatório pedagógico.');
    }

    console.log('\n--- [TESTE] Validação concluída com sucesso! ---');
  } catch (err: any) {
    console.error('\n❌ [ERRO] Falha na validação:', err.message);
    if (err.message.includes('fetch')) {
      console.error('DICA: Verifique se o LM Studio está rodando em 192.168.18.91:1234');
    }
  } finally {
    process.exit(0);
  }
}

testSovereignAI();
