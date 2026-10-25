/**
 * Automated Security & HMAC Verification Suite
 * Valida a integridade da criptografia de sessão e controles de autenticação do portal Web.
 */
import { signSession, verifySession, SessionPayload } from '../apps/web/src/lib/session';

async function runSecurityTests() {
  console.log('🧪 Iniciando Bateria de Testes de Segurança e Criptografia Web (HMAC-SHA256)...\n');
  let passed = 0;
  let failed = 0;

  const mockUser: Partial<SessionPayload> = {
    username: 'coordenacao.aquila',
    email: 'coordenacao@aquila.edu.br',
    role: 'coordinator',
    portal: 'portal/coordenacao',
  };

  // Teste 1: Assinatura e verificação legítima
  try {
    const token = await signSession(mockUser);
    const verified = await verifySession(token);
    if (verified && verified.username === mockUser.username && verified.role === 'coordinator') {
      console.log('✅ TESTE 1: Assinatura e verificação íntegra [PASS]');
      passed++;
    } else {
      console.error('❌ TESTE 1: Falha na validação de sessão íntegra [FAIL]');
      failed++;
    }
  } catch (e: any) {
    console.error('❌ TESTE 1 ERRO:', e.message);
    failed++;
  }

  // Teste 2: Rejeição de adulteração (Tampering / Forged Role)
  try {
    const token = await signSession(mockUser);
    const [headerB64, payloadB64, signature] = token.split('.');
    
    // Atacante tenta elevar privilégios de coordenador para admin
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    decoded.role = 'admin';
    const forgedPayloadB64 = Buffer.from(JSON.stringify(decoded)).toString('base64url');
    const forgedToken = `${headerB64}.${forgedPayloadB64}.${signature}`;

    const verified = await verifySession(forgedToken);
    if (verified === null) {
      console.log('✅ TESTE 2: Rejeição de payload adulterado / elevação de privilégios [PASS]');
      passed++;
    } else {
      console.error('❌ TESTE 2: VULNERABILIDADE! Token adulterado foi aceito [FAIL]');
      failed++;
    }
  } catch (e: any) {
    console.error('❌ TESTE 2 ERRO:', e.message);
    failed++;
  }

  // Teste 3: Rejeição de assinatura corrompida
  try {
    const token = await signSession(mockUser);
    const [headerB64, payloadB64] = token.split('.');
    const corruptedToken = `${headerB64}.${payloadB64}.fake_signature_hash_xyz_12345`;

    const verified = await verifySession(corruptedToken);
    if (verified === null) {
      console.log('✅ TESTE 3: Rejeição de assinatura HMAC inválida [PASS]');
      passed++;
    } else {
      console.error('❌ TESTE 3: Falha na rejeição de assinatura inválida [FAIL]');
      failed++;
    }
  } catch (e: any) {
    console.error('❌ TESTE 3 ERRO:', e.message);
    failed++;
  }

  // Teste 4: Rejeição de sessão expirada
  try {
    const now = Math.floor(Date.now() / 1000);
    const expiredPayload: Partial<SessionPayload> = {
      ...mockUser,
      iat: now - 3600,
      exp: now - 60, // Expirado há 60 segundos
    };
    const token = await signSession(expiredPayload);
    const verified = await verifySession(token);
    if (verified === null) {
      console.log('✅ TESTE 4: Rejeição automática de sessão expirada [PASS]');
      passed++;
    } else {
      console.error('❌ TESTE 4: Falha na rejeição de sessão expirada [FAIL]');
      failed++;
    }
  } catch (e: any) {
    console.error('❌ TESTE 4 ERRO:', e.message);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Resultado Final: ${passed} PASS, ${failed} FAIL`);
  console.log(`Status de Segurança Web: ${failed === 0 ? '🟢 100% SEGURO' : '🔴 VULNERÁVEL'}`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runSecurityTests();
