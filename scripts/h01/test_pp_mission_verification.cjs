/**
 * Missão PP — Verificação Automatizada dos Itens 2, 3, 4, 5, 6, 7 e 8
 * Executa testes unitários e de contrato sobre os módulos reais do repositório.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '../..');

function loadTsModule(relPath) {
  const fullPath = path.join(ROOT, relPath);
  const source = fs.readFileSync(fullPath, 'utf-8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  });

  const mod = { exports: {} };
  const customRequire = (id) => {
    if (id === 'react') {
      const r = { createElement: () => null, useState: () => [], useEffect: () => {}, useMemo: () => {}, useRef: () => ({}) };
      return { ...r, default: r, __esModule: true };
    }
    if (id === 'lucide-react') return new Proxy({}, { get: () => () => null });
    if (id.endsWith('.css') || id.endsWith('.png') || id.endsWith('.jpg')) return {};
    if (id.startsWith('.')) {
      const resolved = path.resolve(path.dirname(fullPath), id);
      for (const ext of ['', '.ts', '.tsx', '.js', '.json']) {
        if (fs.existsSync(resolved + ext) && fs.statSync(resolved + ext).isFile()) {
          if ((resolved + ext).endsWith('.ts') || (resolved + ext).endsWith('.tsx')) {
            return loadTsModule(path.relative(ROOT, resolved + ext));
          }
          return require(resolved + ext);
        }
      }
    }
    return require(id);
  };

  const fn = new Function('exports', 'require', 'module', '__filename', '__dirname', transpiled.outputText);
  fn(mod.exports, customRequire, mod, fullPath, path.dirname(fullPath));
  return mod.exports;
}

function runAllChecks() {
  const results = [];
  const check = (id, description, fn) => {
    try {
      const detail = fn();
      results.push({ id, description, passed: true, detail: detail || 'OK' });
    } catch (err) {
      results.push({ id, description, passed: false, detail: err.message });
      throw err;
    }
  };

  // Carrega módulos
  const scopeMod = loadTsModule('apps/electron/src/ui/utils/studentGradeScope.ts');
  const gradebookMod = loadTsModule('apps/electron/src/ui/pages/TeacherGradebook.tsx');
  const attendanceMod = loadTsModule('apps/electron/src/ui/pages/AttendanceCall.tsx');
  const diaryMod = loadTsModule('apps/electron/src/ui/pages/Diary.tsx');
  const portalLayoutMod = loadTsModule('apps/electron/src/ui/layouts/PortalLayout.tsx');
  const personasMod = loadTsModule('apps/electron/src/ui/utils/historicalPersonas.ts');
  const bannerMod = loadTsModule('apps/electron/src/main/services/BattleBannerCatalogService.ts');

  // =========================================================================
  // ITEM 2: ESCOPO CURRICULAR DO ESTUDANTE E AUTORIZAÇÃO
  // =========================================================================
  check('ITEM2_VALID_CONTEXT', 'Contexto válido resolve estudante, matrícula, turma, série e etapa', () => {
    const ctxEM = scopeMod.resolveStudentGradeContext('42807'); // F-EM3A (3ª Série EM)
    assert.strictEqual(ctxEM.isContextValid, true);
    assert.strictEqual(ctxEM.seriesNumber, 3);
    assert.strictEqual(ctxEM.stage, 'ENSINO_MEDIO');

    const ctxEF = scopeMod.resolveStudentGradeContext('45453'); // F-EF26A (6º Ano EF)
    assert.strictEqual(ctxEF.isContextValid, true);
    assert.strictEqual(ctxEF.seriesNumber, 6);
    assert.strictEqual(ctxEF.stage, 'EF_ANOS_FINAIS');
    return `3ª Série EM (${ctxEM.classId}) & 6º Ano EF (${ctxEF.classId}) resolvidos`;
  });

  check('ITEM2_MISSING_OR_INVALID_CONTEXT', 'Contexto ausente ou inválido nunca produz fallback para ALL', () => {
    const ctxMissing = scopeMod.resolveStudentGradeContext(null);
    assert.strictEqual(ctxMissing.isContextValid, false);
    assert.strictEqual(ctxMissing.stage, 'UNVERIFIED');
    assert.strictEqual(scopeMod.matchesStudentGradeScope({ classId: 'F-EM3A' }, ctxMissing), false);

    const ctxInvalid = scopeMod.resolveStudentGradeContext('99999999', 'ALL');
    assert.strictEqual(ctxInvalid.isContextValid, false);
    assert.strictEqual(ctxInvalid.stage, 'UNVERIFIED');
    assert.strictEqual(scopeMod.matchesStudentGradeScope({ classId: 'F-EF26A' }, ctxInvalid), false);
    return 'Contexto ausente e inválido bloqueados sem fallback ALL';
  });

  check('ITEM2_ID_MANIPULATION_AND_BACKEND_IPC', 'Bloqueio de manipulação de studentId/classId no frontend e no IPC', () => {
    const authCrossStudent = scopeMod.authorizeStudentDataAccess(
      { id: '45453', role: 'student', studentId: '45453', classId: 'F-EF26A' },
      '42807',
      'F-EF26A'
    );
    assert.strictEqual(authCrossStudent.authorized, false);
    assert(authCrossStudent.reason.includes('CROSS_STUDENT_ACCESS_DENIED'));

    const authCrossClass = scopeMod.authorizeStudentDataAccess(
      { id: '45453', role: 'student', studentId: '45453', classId: 'F-EF26A' },
      '45453',
      'F-EM3A'
    );
    assert.strictEqual(authCrossClass.authorized, false);
    assert(authCrossClass.reason.includes('CROSS_CLASS_ACCESS_DENIED'));

    const handlersSrc = fs.readFileSync(path.join(ROOT, 'apps/electron/src/ipc/handlers.ts'), 'utf-8');
    assert(handlersSrc.includes('FORBIDDEN_CROSS_STUDENT_ACCESS'));
    assert(handlersSrc.includes('FORBIDDEN_CROSS_CLASS_ACCESS'));
    return 'Frontend + Backend IPC aplicam bloqueio entre estudantes e turmas';
  });

  check('ITEM2_SESSION_SWITCH_NO_LEAK', 'Troca de sessão atualiza o contexto sem reutilizar dados anteriores', () => {
    const ctx1 = scopeMod.resolveStudentGradeContext('42807'); // F-EM3A
    const ctx2 = scopeMod.resolveStudentGradeContext('45453'); // F-EF26A
    const item3EM = { classId: 'F-EM3A', gradeLevel: '3ª Série EM' };
    const item6EF = { classId: 'F-EF26A', gradeLevel: '6º Ano EF' };
    assert.strictEqual(scopeMod.matchesStudentGradeScope(item3EM, ctx1), true);
    assert.strictEqual(scopeMod.matchesStudentGradeScope(item3EM, ctx2), false);
    assert.strictEqual(scopeMod.matchesStudentGradeScope(item6EF, ctx2), true);
    return 'Troca 3ª Série EM -> 6º Ano EF isolada com sucesso';
  });

  check('ITEM2_INSUFFICIENT_METADATA_AND_BNCC_PREFIX', 'Rejeita material sem metadados e prefixo BNCC amplo sem série exata', () => {
    const ctx6EF = scopeMod.resolveStudentGradeContext('45453'); // 6º Ano EF
    assert.strictEqual(scopeMod.matchesStudentGradeScope({}, ctx6EF), false);
    // Prefixo amplo EF67 ou EF69 sem confirmação de série exata (6º vs 7º) é rejeitado
    assert.strictEqual(scopeMod.matchesStudentGradeScope({ bnccCode: 'EF67LP01' }, ctx6EF), false);
    assert.strictEqual(scopeMod.matchesStudentGradeScope({ bnccCode: 'EF69LP01' }, ctx6EF), false);
    // Código de série exata EF06 é aceito para 6º Ano e rejeitado para 7º Ano
    assert.strictEqual(scopeMod.matchesStudentGradeScope({ bnccCode: 'EF06MA01' }, ctx6EF), true);
    assert.strictEqual(scopeMod.matchesStudentGradeScope({ bnccCode: 'EF07MA01' }, ctx6EF), false);
    return 'Metadados insuficientes e prefixo BNCC amplo (EF67/EF69 sem série exata) bloqueados';
  });

  check('ITEM2_CROSS_GRADE_TEACHER_ASSIGNMENT', 'Preserva exceção pedagógica explícita de revisão atribuída por professor', () => {
    const ctx3EM = scopeMod.resolveStudentGradeContext('42807'); // turma F-EM3A
    const ctx6EF = scopeMod.resolveStudentGradeContext('45453'); // turma F-EF26A
    const reviewItem = {
      classId: 'F-EF29A',
      gradeLevel: '9º Ano EF',
      crossGradeAssignment: {
        assignedByTeacherId: 'prof-andre',
        assignedByTeacherName: 'Prof. André',
        pedagogicalReason: 'Reforço diagnóstico de base algébrica para a 3ª Série EM',
        targetClassId: 'F-EM3A',
        assignedAt: '2026-11-03',
      },
    };
    assert.strictEqual(scopeMod.matchesStudentGradeScope(reviewItem, ctx3EM), true);
    assert.strictEqual(scopeMod.matchesStudentGradeScope(reviewItem, ctx6EF), false);
    return 'Revisão de outra série liberada apenas para a turma alvo atribuída';
  });

  // =========================================================================
  // ITEM 3: DATAS E PERÍODOS
  // =========================================================================
  check('ITEM3_TIMEZONE_AND_SAFE_DATES', 'Timezone America/Sao_Paulo explícito e ausência de fallback Recente', () => {
    assert.strictEqual(scopeMod.DEFAULT_SCHOOL_TIMEZONE, 'America/Sao_Paulo');
    // 2026-11-04T01:30:00Z = 2026-11-03 22:30:00 em America/Sao_Paulo
    const isoSp = scopeMod.getSchoolTodayIsoDate(new Date('2026-11-04T01:30:00Z'));
    assert.strictEqual(isoSp, '2026-11-03');

    assert.strictEqual(scopeMod.formatSafeDatePtBr(null), 'Data não informada');
    assert.strictEqual(scopeMod.formatSafeDatePtBr('', 'Recente'), 'Data não informada');
    assert.strictEqual(scopeMod.formatSafeDatePtBr('data-invalida-999'), 'Data não informada');
    assert.strictEqual(scopeMod.formatSafeDatePtBr('2026-11-03'), '03/11/2026');

    const refNow = new Date('2026-11-04T15:00:00Z'); // 2026-11-04 em SP
    assert.strictEqual(scopeMod.classifyDueDateStatus('2026-11-03', refNow), 'ATRASADO');
    assert.strictEqual(scopeMod.classifyDueDateStatus('2026-11-04', refNow), 'HOJE');
    assert.strictEqual(scopeMod.classifyDueDateStatus('2026-11-05', refNow), 'AMANHÃ');
    assert.strictEqual(scopeMod.classifyDueDateStatus('2026-11-10', refNow), 'FUTURO');
    assert.strictEqual(scopeMod.classifyDueDateStatus('', refNow), 'DATA_NAO_INFORMADA');
    assert.strictEqual(scopeMod.classifyDueDateStatus('invalida', refNow), 'DATA_NAO_INFORMADA');
    return 'Timezone America/Sao_Paulo e datas inválidas/ausentes verificadas';
  });

  // =========================================================================
  // ITEM 4: PRÉVIA DE PORTAIS VS. SESSÃO REAL
  // =========================================================================
  check('ITEM4_PORTAL_PREVIEW_ISOLATION', 'Prévia de outro portal mantém sessão real e bloqueia escrita', () => {
    const teacherPreviewingStudent = portalLayoutMod.resolvePortalPreviewState(
      { id: 'prof-andre', name: 'Prof. André', role: 'teacher' },
      'Portal do Aluno (Estudo & Gamificação)'
    );
    assert.strictEqual(teacherPreviewingStudent.normalizedRole, 'teacher');
    assert.strictEqual(teacherPreviewingStudent.isPreviewMode, true);
    assert.strictEqual(teacherPreviewingStudent.canExecuteWriteInPortal, false);
    assert.strictEqual(teacherPreviewingStudent.canUsePortalSwitcher, true);

    const studentAttemptingSwitch = portalLayoutMod.resolvePortalPreviewState(
      { id: '42807', name: 'Gabriel', role: 'student' },
      'Portal Pedagógico (Sala de Aula)'
    );
    assert.strictEqual(studentAttemptingSwitch.canUsePortalSwitcher, false);

    const secretaryAttemptingSwitch = portalLayoutMod.resolvePortalPreviewState(
      { id: 'sec-01', name: 'Secretaria', role: 'secretary' },
      'Portal Pedagógico (Sala de Aula)'
    );
    assert.strictEqual(secretaryAttemptingSwitch.canUsePortalSwitcher, false);
    return 'Isolamento de sessão e bloqueio de escrita em prévia validados';
  });

  // =========================================================================
  // ITEM 5: NOTAS, MÉDIAS E RECUPERAÇÃO
  // =========================================================================
  check('ITEM5_GRADES_EMPTY_VS_ZERO_AND_RECOVERY', 'Nota vazia não vira zero e recuperação segue regra versionada', () => {
    const allEmpty = gradebookMod.evaluateGradebookRow({ n1: '', n2: '', n3: '', rec: '', b1: 7, b2: 7, b3: 0, b4: 0 });
    assert.strictEqual(allEmpty.bimesterMean, null);
    assert.strictEqual(allEmpty.isPendingAll, true);
    assert.strictEqual(allEmpty.statusCode, 'PENDING_ENTRY');

    const oneGrade = gradebookMod.evaluateGradebookRow({ n1: '8.0', n2: '', n3: '', rec: '', b1: 7, b2: 7, b3: 0, b4: 0 });
    assert.strictEqual(oneGrade.bimesterMean, 8.0);
    assert.strictEqual(oneGrade.isPartial, true);
    assert.strictEqual(oneGrade.statusCode, 'PARTIAL');

    const explicitZero = gradebookMod.evaluateGradebookRow({ n1: '0', n2: '0', n3: '0', rec: '', b1: 7, b2: 7, b3: 0, b4: 0 });
    assert.strictEqual(explicitZero.bimesterMean, 0);
    assert.strictEqual(explicitZero.statusCode, 'RECOVERY_BIMESTER');

    const recovered = gradebookMod.evaluateGradebookRow({ n1: '4.0', n2: '5.0', n3: '5.0', rec: '7.5', b1: 7, b2: 7, b3: 0, b4: 0 });
    assert.strictEqual(recovered.bimesterMean, 7.5);
    assert.strictEqual(recovered.recoveryApplied, true);
    assert.strictEqual(recovered.statusCode, 'REGULAR_BIMESTER');
    assert.strictEqual(recovered.ruleVersion, 'REGRA-AVAL-2026.1');
    return `Regra ${recovered.ruleVersion} validada (vazio !== 0, parcial, recuperação)`;
  });

  // =========================================================================
  // ITEM 6: FREQUÊNCIA E DIÁRIO
  // =========================================================================
  check('ITEM6_ATTENDANCE_AND_DIARY_SYNC', 'Chamada inicia Não conferido, suporta lote+desfazer e sincroniza com Diário', () => {
    const roster = [{ id: 'st-1' }, { id: 'st-2' }, { id: 'st-3' }];
    const initial = attendanceMod.initializeAttendanceRecords(roster, null);
    assert.deepStrictEqual(initial, { 'st-1': 'unverified', 'st-2': 'unverified', 'st-3': 'unverified' });

    const batchRes = attendanceMod.applyBatchAttendanceAction(initial, roster, 'mark_unverified_present');
    assert.strictEqual(batchRes.affectedCount, 3);
    assert.deepStrictEqual(batchRes.next, { 'st-1': 'present', 'st-2': 'present', 'st-3': 'present' });
    assert.deepStrictEqual(batchRes.previous, { 'st-1': 'unverified', 'st-2': 'unverified', 'st-3': 'unverified' });

    // Marca st-2 como ausente e st-3 como justificado, depois sincroniza com Diary.tsx
    const savedAttendance = { 'st-1': 'present', 'st-2': 'absent', 'st-3': 'justified' };
    const diaryEntries = diaryMod.syncDiaryEntriesWithAttendance(roster, savedAttendance, null);
    assert.strictEqual(diaryEntries['st-1'].present, true);
    assert.strictEqual(diaryEntries['st-1'].attendanceStatus, 'present');
    assert.strictEqual(diaryEntries['st-2'].present, false);
    assert.strictEqual(diaryEntries['st-2'].attendanceStatus, 'absent');
    assert.strictEqual(diaryEntries['st-3'].present, true);
    assert.strictEqual(diaryEntries['st-3'].attendanceStatus, 'justified');
    return '4 estados, inicialização unverified, lote+undo e sincronia com Diary validados';
  });

  // =========================================================================
  // ITEM 7: CITAÇÃO DE MARIE CURIE E GATE EDITORIAL
  // =========================================================================
  check('ITEM7_MARIE_CURIE_EDITORIAL_GATE', 'Citação sem fonte primária omitida e gate editorial ativo', () => {
    const curiePersona = personasMod.HISTORICAL_CHARACTERS.find((c) => c.id === 'MARIE_CURIE');
    assert(curiePersona, 'MARIE_CURIE deve existir em HISTORICAL_CHARACTERS');
    assert.strictEqual(curiePersona.famousQuote, '');
    assert.strictEqual(curiePersona.quoteVerified, false);
    assert(curiePersona.notableWork.includes('1867–1934, Nobel de Física 1903 e Química 1911'));
    assert.strictEqual(personasMod.getVerifiedPersonaQuote(curiePersona), '');

    const gateUnverified = bannerMod.validateEditorialQuoteGate({
      quote: 'Frase sem fonte primária',
      verified: false,
    });
    assert.strictEqual(gateUnverified.allowed, false);
    assert.strictEqual(gateUnverified.displayQuote, '');

    const gateVerified = bannerMod.validateEditorialQuoteGate({
      quote: 'Se vi mais longe, foi por estar sobre ombros de gigantes.',
      sourceWork: 'Carta de Isaac Newton a Robert Hooke (5 de fevereiro de 1675)',
      sourceLocator: 'Historical Society of Pennsylvania, f. 1',
      verified: true,
    });
    assert.strictEqual(gateVerified.allowed, true);
    return 'Marie Curie com nota factual 1867–1934 e citação omitida até verificação primária';
  });

  // =========================================================================
  // ITEM 8: VERIFICAÇÃO DOS COMPONENTES VISUAIS E CORREÇÕES DAS 6 CAPTURAS
  // =========================================================================
  check('ITEM8_UI_FIXES_AND_TOKENS', 'Correções das 6 capturas de tela e tokens CSS nas 4 telas prioritárias', () => {
    const loginSrc = fs.readFileSync(path.join(ROOT, 'apps/electron/src/ui/pages/LoginPage.tsx'), 'utf-8');
    assert(loginSrc.includes("paddingLeft: '44px'"), 'LoginPage deve reservar padding para o ícone esquerdo');
    assert(loginSrc.includes("background: 'transparent'"), 'Botão de senha no LoginPage deve ter fundo transparente');

    const receptionCss = fs.readFileSync(path.join(ROOT, 'apps/electron/src/ui/pages/ReceptionPortal.css'), 'utf-8');
    assert(receptionCss.includes('.reception-container .input-group'), 'ReceptionPortal.css deve escopar .input-group');

    const portalLayoutSrc = fs.readFileSync(path.join(ROOT, 'apps/electron/src/ui/layouts/PortalLayout.tsx'), 'utf-8');
    assert(portalLayoutSrc.includes('10000 / zoomPercent'), 'PortalLayout deve compensar width/minHeight no zoom');

    const seatingSrc = fs.readFileSync(path.join(ROOT, 'apps/electron/src/ui/pages/SeatingIntelligence.tsx'), 'utf-8');
    assert(!seatingSrc.includes('seat-full-photo'), 'SeatingIntelligence não deve usar foto esticada de fundo');
    assert(seatingSrc.includes('seat-fallback-avatar') && seatingSrc.includes('Fila '), 'SeatingIntelligence deve usar avatar circular compacto e rótulo de carteira');

    const teacherPortalSrc = fs.readFileSync(path.join(ROOT, 'apps/electron/src/ui/portals/TeacherPortal.tsx'), 'utf-8');
    assert(teacherPortalSrc.includes('useState, useEffect'), 'TeacherPortal deve importar useState e useEffect');

    const tokensCss = fs.readFileSync(path.join(ROOT, 'apps/electron/src/ui/styles/aquila-ui-tokens.css'), 'utf-8');
    assert(tokensCss.includes('--bg-canvas: #0B1220') && tokensCss.includes('--accent-primary: #3B82F6'));
    return 'LoginPage, SeatingIntelligence, PortalLayout, TeacherPortal e tokens CSS verificados';
  });

  const outPath = path.join(ROOT, 'test-results', 'pp_mission_verification_report.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ total: results.length, passed: results.length, results }, null, 2));
  console.log(`OK: ${results.length}/${results.length} Mission PP verification checks passed -> ${outPath}`);
}

runAllChecks();
