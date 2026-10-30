import * as fs from 'fs';
import * as path from 'path';
import {
  PedagogicalGamificationService,
  SchoolAuthorityServer,
  AQUILA_ADOPTED_ART11_TRANSPARENCY_NOTICE,
  REQUIRED_12_DILIGENCE_FIELDS,
  StudentInventoryItem,
} from '../services/PedagogicalGamificationService';

describe('Homologação Técnica — PedagogicalGamificationService (8 Evidências Exigidas + Banco & SVGs)', () => {
  let service: PedagogicalGamificationService;

  beforeEach(() => {
    service = new PedagogicalGamificationService('test-school-authority-secret-key-2026');
  });

  test('EVIDÊNCIA 1: Modo legado/fallback HMAC rejeita tentativa de editar banco local (verificado separadamente da autoridade Ed25519)', () => {
    const wallet = service.createSignedWallet('aluno_01');
    expect(wallet.cosmeticBalance).toBe(0);
    expect(service.verifySqliteWalletIntegrity(wallet).valid).toBe(true);

    // Simular adulteração direta no arquivo SQLite local (UPDATE cosmetic_balance = 999999)
    const tamperedLocalSqliteWallet = {
      ...wallet,
      cosmeticBalance: 999999,
    };

    const integrityCheck = service.verifySqliteWalletIntegrity(tamperedLocalSqliteWallet);
    expect(integrityCheck.valid).toBe(false);
    expect(integrityCheck.errorCode).toBe('LOCAL_SQLITE_TAMPERING_DETECTED');

    expect(() =>
      service.evaluateAndGrantUnlock({
        eventId: 'evt_tamper_01',
        studentId: 'aluno_01',
        ruleId: 'fisica_eletricidade_tesla_01',
        evidenceId: 'ev_tesla_01',
        evidenceSummary: 'Simulador de corrente alternada concluído com justificativa.',
        modalityChosen: 'traje_inspirado',
        wallet: tamperedLocalSqliteWallet,
      })
    ).toThrow(/LOCAL_SQLITE_TAMPERING_DETECTED/);
  });

  test('EVIDÊNCIA 2: Enviar duas vezes a mesma evidência/regra não pode gerar moeda em dobro', () => {
    const initialWallet = service.createSignedWallet('aluno_02');

    const firstAttempt = service.evaluateAndGrantUnlock({
      eventId: 'evt_unique_100',
      studentId: 'aluno_02',
      ruleId: 'fisica_eletricidade_tesla_01',
      evidenceId: 'ev_circuito_tesla_01',
      evidenceSummary: 'Dimensionamento correto do transformador no simulador e explicação escrita.',
      modalityChosen: 'traje_inspirado',
      wallet: initialWallet,
    });

    expect(firstAttempt.grantedNewUnlock).toBe(true);
    expect(firstAttempt.practiceRetryOnly).toBe(false);
    expect(firstAttempt.cosmeticCoinsAdded).toBe(100);
    expect(firstAttempt.updatedWallet.cosmeticBalance).toBe(100);

    // Reenviar a mesma evidência/regra (mesmo com novo eventId ou mesmo eventId)
    const duplicateAttempt = service.evaluateAndGrantUnlock({
      eventId: 'evt_unique_101',
      studentId: 'aluno_02',
      ruleId: 'fisica_eletricidade_tesla_01',
      evidenceId: 'ev_circuito_tesla_01',
      evidenceSummary: 'Reenvio da mesma atividade para tentar acumular moeda.',
      modalityChosen: 'traje_inspirado',
      wallet: firstAttempt.updatedWallet,
    });

    expect(duplicateAttempt.grantedNewUnlock).toBe(false);
    expect(duplicateAttempt.practiceRetryOnly).toBe(true);
    expect(duplicateAttempt.cosmeticCoinsAdded).toBe(0);
    expect(duplicateAttempt.unlockedItemIds).toEqual([]);
    expect(duplicateAttempt.updatedWallet.cosmeticBalance).toBe(100);
  });

  test('EVIDÊNCIA 3: Nenhuma recompensa pode ser disparada por tempo de uso, loot box, câmera, expressão facial ou localização', () => {
    const wallet = service.createSignedWallet('aluno_03');

    // Tempo de uso/tela -> Decreto nº 12.880/2026
    expect(() =>
      service.evaluateAndGrantUnlock({
        eventId: 'evt_screen_time',
        studentId: 'aluno_03',
        ruleId: 'fisica_eletricidade_tesla_01',
        evidenceId: 'ev_time',
        evidenceSummary: 'Ficou 2 horas conectado',
        modalityChosen: 'ambiente',
        wallet,
        triggerType: 'screen_time',
      })
    ).toThrow(/Decreto nº 12\.880\/2026.*tempo de uso/);

    // Loot box -> Lei nº 15.211/2025, art. 20; Decreto nº 12.880/2026, arts. 22, § 2º, II, e 23
    expect(() =>
      service.evaluateAndGrantUnlock({
        eventId: 'evt_loot_box',
        studentId: 'aluno_03',
        ruleId: 'fisica_eletricidade_tesla_01',
        evidenceId: 'ev_box',
        evidenceSummary: 'Abertura de caixa misteriosa',
        modalityChosen: 'personagem',
        wallet,
        triggerType: 'loot_box_roll',
      })
    ).toThrow(/Lei nº 15\.211\/2025, art\. 20.*Decreto nº 12\.880\/2026, arts\. 22, § 2º, II, e 23/);

    // Câmera / Atenção -> Política de Privacidade do Áquila alinhada à LGPD e ANPD
    expect(() =>
      service.evaluateAndGrantUnlock({
        eventId: 'evt_camera',
        studentId: 'aluno_03',
        ruleId: 'fisica_eletricidade_tesla_01',
        evidenceId: 'ev_cam',
        evidenceSummary: 'Classificado como atento pela câmera',
        modalityChosen: 'traje_inspirado',
        wallet,
        triggerType: 'camera_attention_score',
      })
    ).toThrow(/AQUILA_PRIVACY_POLICY_VIOLATION.*LGPD.*Enunciado CD\/ANPD nº 1\/2023/);

    // Localização GPS -> Política de Privacidade do Áquila
    expect(() =>
      service.evaluateAndGrantUnlock({
        eventId: 'evt_gps',
        studentId: 'aluno_03',
        ruleId: 'fisica_eletricidade_tesla_01',
        evidenceId: 'ev_gps',
        evidenceSummary: 'Deslocamento físico medido por GPS',
        modalityChosen: 'ambiente',
        wallet,
        triggerType: 'real_time_gps_location',
      })
    ).toThrow(/AQUILA_PRIVACY_POLICY_VIOLATION/);
  });

  test('EVIDÊNCIA 4: Um item já conquistado não pode ser perdido por ausência', () => {
    const inventory: StudentInventoryItem[] = [
      {
        itemId: 'traje_laboratorio_tesla_01',
        title: 'Traje Laboratório Tesla',
        discipline: 'Física',
        collectionAlbum: 'Inventores e energia',
        modality: 'traje_inspirado',
        category: 'traje_tematico',
        svgAssetPath: 'apps/electron/src/database/visual_assets/gamification_mvp/set_01_nikola_tesla.svg',
        rightsCharacterAndFileId: 'set_01_nikola_tesla::set_01_nikola_tesla.svg',
        unlockedByRuleId: 'fisica_eletricidade_tesla_01',
        unlockedByEvidenceId: 'ev_circuito_01',
        unlockedAt: '2026-10-01T10:00:00Z',
        expiresOrLostOnAbsence: false,
        serverGrantSignature: 'sig_verified_01',
      },
    ];

    const resultAfter60DaysAbsent = service.processStudentAbsenceWithoutPenalty(inventory, 60);
    expect(resultAfter60DaysAbsent.removedItemsCount).toBe(0);
    expect(resultAfter60DaysAbsent.retainedItemsCount).toBe(1);
    expect(resultAfter60DaysAbsent.inventory[0].itemId).toBe('traje_laboratorio_tesla_01');
  });

  test('EVIDÊNCIA 5: A concessão deve ser bloqueada quando faltar qualquer um dos 12 campos do cadastro interno de diligência autoral', () => {
    expect(REQUIRED_12_DILIGENCE_FIELDS).toHaveLength(12);

    // Registro incompleto faltando `requiredCreditText` e `authorizationProofRef`
    const incompleteCheck = service.validateAssetRightsForProduction({
      characterAndFileId: 'set_incompleto::arquivo.svg',
      authorAndHolder: 'Autor Teste',
      sourceUrl: 'https://example.org/asset.svg',
      licenseAndVersion: 'CC0',
      verificationDate: '2026-10-25',
      approvedTerritories: ['BR'],
      adaptationAllowed: true,
      commercialUseAllowed: true,
      requiredCreditText: '',
      authorizationProofRef: '',
      brandOrRepresentationRestrictions: 'Sem uso de marca',
      approvedByReviewer: 'Revisor Editorial',
    });

    expect(incompleteCheck.approved).toBe(false);
    expect(incompleteCheck.missingFields).toEqual(['requiredCreditText', 'authorizationProofRef']);
    expect(incompleteCheck.reason).toMatch(/art\. 29 da Lei nº 9\.610\/98/);

    // Regra apontando para ativo sem cadastro completo deve bloquear a concessão
    service.registerUnlockRule({
      ruleId: 'regra_sem_direitos_01',
      collectionAlbum: 'Inventores e energia',
      discipline: 'Física',
      historicalOrOriginalReference: 'Ativo Não Licenciado',
      learningObjective: 'Objetivo teste',
      stageType: 'descoberta',
      requiredEvidenceTypes: ['texto'],
      validationMethod: 'regra_objetiva',
      accessibleEquivalentDescription: 'Áudio equivalente',
      guaranteedRewardItemIds: ['item_bloqueado'],
      cosmeticCurrencyGrant: 50,
      rightsCharacterAndFileId: 'ativo_inexistente::sem_cadastro.svg',
      allowsInfiniteFarmingOnRepeat: false,
      lostOnStudentAbsence: false,
    });

    const wallet = service.createSignedWallet('aluno_05');
    expect(() =>
      service.evaluateAndGrantUnlock({
        eventId: 'evt_missing_rights',
        studentId: 'aluno_05',
        ruleId: 'regra_sem_direitos_01',
        evidenceId: 'ev_05',
        evidenceSummary: 'Atividade concluída',
        modalityChosen: 'personagem',
        wallet,
      })
    ).toThrow(/BLOCKED_MISSING_RIGHTS_RECORD/);
  });

  test('EVIDÊNCIA 6: Toda concessão deve gravar as três respostas de auditoria (identificadas como política interna do projeto)', () => {
    const wallet = service.createSignedWallet('aluno_06');
    const res = service.evaluateAndGrantUnlock({
      eventId: 'evt_audit_06',
      studentId: 'aluno_06',
      ruleId: 'computacao_algoritmos_ada_turing_01',
      evidenceId: 'ev_algoritmo_ada_01',
      evidenceSummary: 'Elaborou algoritmo de ordenação, realizou teste de mesa e identificou dados pessoais sensíveis.',
      modalityChosen: 'ambiente',
      wallet,
    });

    expect(res.auditRecord.policyClassification).toBe('POLITICA_INTERNA_APROVACAO_PEDAGOGICA_AQUILA');
    expect(res.auditRecord.question1WhatDidStudentLearn).toContain('Elaborar algoritmos');
    expect(res.auditRecord.question2WhichEvidenceDemonstratesIt).toContain('ev_algoritmo_ada_01');
    expect(res.auditRecord.question3WhyDoesCharacterOrItemMakeSense).toContain('Algoritmos e cidadania digital');
    expect(service.getAuditTrail()).toHaveLength(1);
  });

  test('EVIDÊNCIA 7: O aviso adotado pelo Áquila (art. 11, I, Decreto 12.880/2026) deve aparecer em todas as respostas dos mentores, com Relatório de Risco e bloqueio de manipulação (art. 11, II)', () => {
    const mentorRes = service.buildSafeHistoricalMentorResponse({
      mentorCharacterId: 'mentor_nikola_tesla_sim',
      characterName: 'Nikola Tesla (Simulação Pedagógica)',
      historicalFactCitations: [
        'Fato histórico documentado: Patente US 381,968 (Motor eletromagnético de corrente alternada, 1888).',
      ],
      fictionalPedagogicalDialogue:
        'Dialogo pedagógico simulado: Observe no simulador como a variação do fluxo magnético induz corrente nas bobinas.',
      teacherSourceLinks: ['https://openstax.org/books/university-physics-volume-2'],
    });

    expect(mentorRes.aquilaAdoptedArt11TransparencyNotice).toBe(AQUILA_ADOPTED_ART11_TRANSPARENCY_NOTICE);
    expect(mentorRes.noticeLegalContext).toContain('Texto adotado pelo Áquila Pro para atender à exigência de transparência');
    expect(mentorRes.riskAssessmentReportId).toBe('RRA-DEC12880-ART11-TESLA-2026-01');
    expect(mentorRes.containsEmotionalPressureToReturn).toBe(false);
    expect(mentorRes.requestsSecrecyFromParents).toBe(false);

    // Tentativa de manipulação comportamental (art. 11, II) deve ser bloqueada
    expect(() =>
      service.buildSafeHistoricalMentorResponse({
        mentorCharacterId: 'mentor_nikola_tesla_sim',
        characterName: 'Nikola Tesla',
        historicalFactCitations: [],
        fictionalPedagogicalDialogue: 'Isto é um segredo nosso, não conte aos seus pais e volte agora ou perderá tudo!',
        teacherSourceLinks: [],
      })
    ).toThrow(/BEHAVIORAL_MANIPULATION_BLOCKED.*art\. 11, II/);
  });

  test('EVIDÊNCIA 8: Mensagens IPC de origem não autorizada (subframe ou domínio externo) devem ser rejeitadas', () => {
    // Origem confiável principal -> aprovada
    expect(
      service.validateTrustedIpcSender({
        senderFrame: { url: 'app://aquila/index.html', parent: null },
        sender: { id: 1, mainFrame: {} },
      }).trusted
    ).toBe(true);

    // Subframe / iframe malicioso -> rejeitado
    expect(() =>
      service.validateTrustedIpcSender({
        senderFrame: { url: 'app://aquila/index.html', parent: { id: 'iframe_parent' } },
        sender: { id: 1 },
      })
    ).toThrow(/IPC_UNTRUSTED_SUBFRAME/);

    // URL remota não autorizada -> rejeitada
    expect(() =>
      service.validateTrustedIpcSender({
        senderFrame: { url: 'https://evil.example.com/exploit.html', parent: null },
        sender: { id: 2 },
      })
    ).toThrow(/IPC_UNTRUSTED_ORIGIN/);
  });

  test('VERIFICAÇÃO DE ARQUIVOS FÍSICOS: Os 6 SVGs do MVP e o JSON auditado existem em disco e possuem conteúdo válido', () => {
    const svgDir = path.resolve(__dirname, '../database/visual_assets/gamification_mvp');
    const expectedSvgs = [
      'set_01_nikola_tesla.svg',
      'set_02_machado_firmina.svg',
      'set_03_merian_mendel_biodiversidade.svg',
      'set_04_hipatia_euclides_matematica.svg',
      'set_05_fontes_historicas_cartografia.svg',
      'set_06_ada_turing_algoritmos.svg',
    ];

    for (const file of expectedSvgs) {
      const fullPath = path.join(svgDir, file);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).toContain('<svg');
      expect(content).toContain('Lei nº 15.211/2025');
    }
  });

  test('AUTORIDADE CRIPTOGRÁFICA ASSIMÉTRICA Ed25519: A chave privada fica estritamente no servidor e o Electron só possui a chave pública para validar integridade', () => {
    // 1. Autoridade Escolar (Servidor / Backend confiável com par Ed25519)
    const schoolServer = new SchoolAuthorityServer();
    const ed25519PublicKeyPem = schoolServer.getPublicKeyPem();

    // 2. Cliente Electron (recebe apenas a chave pública da escola; sem chave privada)
    const electronClientService = new PedagogicalGamificationService({
      ed25519PublicKeyPem,
      // NUNCA passar ed25519PrivateKeyPem para o Electron
    });

    // Servidor emite carteira inicial assinada com Ed25519
    const studentWallet = schoolServer.createSignedWallet('aluno_ed25519_01');
    expect(studentWallet.signatureAlgorithm).toBe('Ed25519');
    expect(studentWallet.cosmeticBalance).toBe(0);

    // Electron valida com sucesso usando apenas a chave pública
    const clientVerification = electronClientService.verifySqliteWalletIntegrity(studentWallet);
    expect(clientVerification.valid).toBe(true);
    expect(clientVerification.algorithm).toBe('Ed25519');

    // Simulação de ataque: Edição direta no SQLite local para inflar saldo
    const tamperedLocalWallet: typeof studentWallet = {
      ...studentWallet,
      cosmeticBalance: 999999,
    };

    // Electron detecta adulteração e rejeita
    const tamperCheck = electronClientService.verifySqliteWalletIntegrity(tamperedLocalWallet);
    expect(tamperCheck.valid).toBe(false);
    expect(tamperCheck.errorCode).toBe('LOCAL_SQLITE_TAMPERING_DETECTED');

    // Tentativa do cliente Electron de forjar assinatura Ed25519 falha pois não possui chave privada
    expect(() => electronClientService.signWalletState(tamperedLocalWallet)).toThrow(
      /AUTHORITY_PRIVATE_KEY_NOT_IN_ELECTRON/
    );
  });

  test('TESTE DE REPLAY: Reapresentação do mesmo recibo assinado ou evento já concedido não concede recompensa em dobro', () => {
    const schoolServer = new SchoolAuthorityServer();
    const electronService = new PedagogicalGamificationService({
      ed25519PublicKeyPem: schoolServer.getPublicKeyPem(),
    });

    const initialWallet = schoolServer.createSignedWallet('aluno_replay_01');

    // Autoridade emite recibo Ed25519 legítimo de 100 moedas
    const validReceipt = schoolServer.issueGrantReceipt({
      studentId: 'aluno_replay_01',
      eventId: 'evt_physics_tesla_exp_01',
      ruleId: 'fisica_eletricidade_tesla_01',
      cosmeticCoinsAwarded: 100,
      itemIdsAwarded: ['card_biografico_tesla_01'],
    });

    // 1ª Apresentação do recibo: Sucesso
    const firstConsumption = electronService.consumeGrantReceipt(validReceipt, initialWallet);
    expect(firstConsumption.success).toBe(true);
    expect(firstConsumption.cosmeticCoinsAdded).toBe(100);
    expect(firstConsumption.updatedWallet.cosmeticBalance).toBe(100);
    expect(firstConsumption.updatedWallet.processedReceiptIds).toContain(validReceipt.receiptId);

    // 2ª Apresentação do mesmo recibo (REPLAY ATTACK): Deve ser categoricamente bloqueada
    expect(() =>
      electronService.consumeGrantReceipt(validReceipt, firstConsumption.updatedWallet)
    ).toThrow(/REPLAY_ATTACK_DETECTED/);

    // Tentativa de adulterar o recibo (aumentar para 5.000 moedas)
    const forgedReceipt = {
      ...validReceipt,
      cosmeticCoinsAwarded: 5000,
    };
    expect(() =>
      electronService.consumeGrantReceipt(forgedReceipt, firstConsumption.updatedWallet)
    ).toThrow(/INVALID_RECEIPT_SIGNATURE/);
  });

  test('TESTE DE RESTAURAÇÃO / ROLLBACK: Restauração de snapshot antigo do banco SQLite não permite gastar novamente o saldo já consumido na autoridade', () => {
    const schoolServer = new SchoolAuthorityServer();
    const electronService = new PedagogicalGamificationService({
      authorityServer: schoolServer,
    });

    // 1. Aluno inicia e ganha 100 moedas
    const walletV1 = schoolServer.createSignedWallet('aluno_rollback_01');
    const receipt100 = schoolServer.issueGrantReceipt({
      studentId: 'aluno_rollback_01',
      eventId: 'evt_tesla_initial',
      ruleId: 'fisica_eletricidade_tesla_01',
      cosmeticCoinsAwarded: 100,
      itemIdsAwarded: [],
    });
    const walletWith100Coins = electronService.consumeGrantReceipt(receipt100, walletV1).updatedWallet;
    expect(walletWith100Coins.cosmeticBalance).toBe(100);
    expect(walletWith100Coins.version).toBe(2);

    // 2. Aluno faz BACKUP / SNAPSHOT do banco SQLite local neste ponto (com 100 moedas, versão 2)
    const oldSqliteSnapshot = JSON.parse(JSON.stringify(walletWith100Coins));

    // 3. Aluno gasta 40 moedas legitimamente na compra de um item
    const spendResult = electronService.spendCosmeticBalance({
      wallet: walletWith100Coins,
      amount: 40,
      itemToBuyId: 'traje_laboratorio_tesla_01',
      authorityServer: schoolServer,
    });

    expect(spendResult.success).toBe(true);
    expect(spendResult.remainingBalance).toBe(60);
    expect(spendResult.updatedWallet.version).toBe(3);

    // Na autoridade escolar, a versão consolidada é 3 e o saldo é 60
    const authoritativeLedger = schoolServer.getLedger('aluno_rollback_01');
    expect(authoritativeLedger?.committedVersion).toBe(3);
    expect(authoritativeLedger?.committedBalance).toBe(60);

    // 4. ATAQUE DE ROLLBACK: O aluno restaura o snapshot antigo (oldSqliteSnapshot com 100 moedas e versão 2)
    // e tenta gastar 50 moedas (o que ultrapassaria o saldo real de 60 se somado com o gasto anterior de 40)
    expect(() =>
      electronService.spendCosmeticBalance({
        wallet: oldSqliteSnapshot,
        amount: 50,
        itemToBuyId: 'cenario_oficina_eletricidade_01',
        authorityServer: schoolServer,
      })
    ).toThrow(/ROLLBACK_DETECTED.*Versão local.*inferior à versão consolidada na autoridade/);

    // 5. O saldo na autoridade permanece estritamente íntegro (60 moedas)
    expect(schoolServer.getLedger('aluno_rollback_01')?.committedBalance).toBe(60);
  });

  test('VERIFICAÇÃO REMOTA NO BACKEND ESCOLAR: Electron suporta verificação delegada via endpoint/handler com consenso', async () => {
    let remoteCalled = false;
    const remoteHandler = async (wallet: any) => {
      remoteCalled = true;
      return { valid: wallet.cosmeticBalance <= 1000, reason: 'REMOTE_LEDGER_CONSENSUS_OK' };
    };

    const serviceWithRemote = new PedagogicalGamificationService({
      remoteAuthorityConfig: {
        mode: 'remote_backend_http',
        remoteVerifyHandler: remoteHandler,
      },
    });

    const wallet = serviceWithRemote.createSignedWallet('aluno_remote_01');
    const result = await serviceWithRemote.verifyWalletRemotely(wallet);

    expect(remoteCalled).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.remoteConsensus).toBe(true);
    expect(result.reason).toBe('REMOTE_LEDGER_CONSENSUS_OK');
  });
});
