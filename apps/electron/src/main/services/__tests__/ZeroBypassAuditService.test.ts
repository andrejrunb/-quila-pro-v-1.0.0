import {
  ZeroBypassAuditService,
  EcaDigitalConsentError
} from '../ZeroBypassAuditService';

describe('ZeroBypassAuditService — Onda 6: Governança ECA Digital & Auditoria Imutável', () => {
  let mockDb: any;
  let inMemoryRecords: any[];
  let auditService: ZeroBypassAuditService;

  beforeEach(async () => {
    inMemoryRecords = [];

    mockDb = {
      all: jest.fn().mockImplementation(async (query: string) => {
        if (query.includes('PRAGMA table_info')) {
          return [
            { name: 'id' },
            { name: 'userId' },
            { name: 'action' },
            { name: 'details' },
            { name: 'metadata' },
            { name: 'timestamp' },
            { name: 'previous_hash' },
            { name: 'hash' },
            { name: 'legal_basis' },
            { name: 'consent_verified' }
          ];
        }
        if (query.includes('FROM zero_bypass_audits')) {
          return [...inMemoryRecords];
        }
        return [];
      }),

      get: jest.fn().mockImplementation(async (query: string) => {
        if (query.includes('ORDER BY id DESC LIMIT 1')) {
          return inMemoryRecords.length > 0 ? inMemoryRecords[inMemoryRecords.length - 1] : null;
        }
        return null;
      }),

      run: jest.fn().mockImplementation(async (query: string, params: any[]) => {
        if (query.includes('INSERT INTO zero_bypass_audits')) {
          const newRecord = {
            id: inMemoryRecords.length + 1,
            userId: params[0],
            action: params[1],
            details: params[2],
            metadata: params[3],
            timestamp: params[4],
            previous_hash: params[5],
            hash: params[6],
            legal_basis: params[7],
            consent_verified: params[8]
          };
          inMemoryRecords.push(newRecord);
          return { lastInsertRowid: newRecord.id };
        }
        return { changes: 1 };
      })
    };

    auditService = new (ZeroBypassAuditService as any)(mockDb);
    await auditService.initialize();
  });

  describe('1. Encadeamento Criptográfico SHA-256 (Hash Chain Forense)', () => {
    it('deve inicializar com hash gênese de 64 zeros na ausência de registros', () => {
      expect(auditService.getLastHash()).toBe('0'.repeat(64));
    });

    it('deve encadear hashes sucessivos ligando o previous_hash ao hash do bloco anterior', async () => {
      const b1 = await auditService.record({
        userId: 'admin_1',
        action: 'DATA_RETENTION_EXPIRATION',
        details: 'Expurgo de logs temporários de 90 dias executado.',
        metadata: { deletedCount: 154 }
      });

      expect(b1.previousHash).toBe('0'.repeat(64));
      expect(b1.hash).toMatch(/^[a-f0-9]{64}$/);

      const b2 = await auditService.record({
        userId: 'sec_admin',
        action: 'FIREWALL_RULE_MODIFIED',
        details: 'Alteração na regra de whitelist para Nó de Edge Alpha.',
        metadata: { ip: '10.0.0.50' }
      });

      expect(b2.previousHash).toBe(b1.hash);
      expect(b2.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(b2.hash).not.toBe(b1.hash);

      const integrity = await auditService.verifyChainIntegrity();
      expect(integrity.valid).toBe(true);
      expect(integrity.totalBlocks).toBe(2);
    });

    it('deve detectar adulteração de dados forenses em registro intermediário', async () => {
      await auditService.record({ userId: 'u1', action: 'FIREWALL_RULE_MODIFIED', details: 'Regra original 1' });
      await auditService.record({ userId: 'u2', action: 'DATA_RETENTION_EXPIRATION', details: 'Regra original 2' });
      await auditService.record({ userId: 'u3', action: 'BIOMETRIC_CONSENT_REVOKED', details: 'Regra original 3' });

      // Simula adulteração ilícita direta no SQLite por agente malicioso
      inMemoryRecords[1].details = 'Regra ADULTERADA maliciosamente';

      const auditCheck = await auditService.verifyChainIntegrity();
      expect(auditCheck.valid).toBe(false);
      expect(auditCheck.brokenBlockId).toBe(2);
    });

    it('deve detectar quebra na ligação do previous_hash se um bloco for inserido fora de ordem', async () => {
      await auditService.record({ userId: 'u1', action: 'HARD_DELETE_RECORDS', details: 'Deleção 1' });
      await auditService.record({ userId: 'u2', action: 'HARD_DELETE_RECORDS', details: 'Deleção 2' });

      // Corrompe previous_hash do segundo bloco
      inMemoryRecords[1].previous_hash = 'f'.repeat(64);

      const auditCheck = await auditService.verifyChainIntegrity();
      expect(auditCheck.valid).toBe(false);
      expect(auditCheck.brokenBlockId).toBe(2);
    });
  });

  describe('2. Conformidade ECA Digital (Lei 15.211/2025) & LGPD Art. 14', () => {
    it('deve recusar e auditar tentativa de processamento de menor sem consentimento parental comprovado', async () => {
      const minorAttempt = {
        studentId: 'student_xyz_12',
        studentAge: 14,
        parentUserId: undefined,
        parentConsentVerified: false,
        intendedAction: 'CAPTURE_BIOMETRICS_FACIAL_REC'
      };

      await expect(auditService.assertMinorConsent(minorAttempt)).rejects.toThrow(EcaDigitalConsentError);

      // Valida se o bloqueio compulsório foi registrado na trilha imutável
      const lastRecorded = inMemoryRecords[inMemoryRecords.length - 1];
      expect(lastRecorded.action).toBe('ECA_DIGITAL_VIOLATION_BLOCKED');
      expect(lastRecorded.legal_basis).toBe('ECA_DIGITAL_LEI_15211');
      expect(lastRecorded.consent_verified).toBe(0);
      expect(lastRecorded.details).toContain('Tentativa de operação \'CAPTURE_BIOMETRICS_FACIAL_REC\' bloqueada');
    });

    it('deve aprovar menor quando consentimento parental está verificado com documento comprovado', async () => {
      const validMinor = {
        studentId: 'student_valid_99',
        studentAge: 15,
        parentUserId: 'parent_mother_42',
        parentConsentVerified: true,
        consentDocumentHash: 'sha256_mock_consent_receipt_abc123',
        intendedAction: 'CAPTURE_BIOMETRICS_FACIAL_REC'
      };

      const result = await auditService.assertMinorConsent(validMinor);
      expect(result).toBe(true);
    });

    it('deve dispensar exigência parental para alunos maiores de 18 anos', async () => {
      const adultStudent = {
        studentId: 'student_adult_21',
        studentAge: 19,
        parentConsentVerified: false,
        intendedAction: 'SELF_CHECKIN_EXAM'
      };

      const result = await auditService.assertMinorConsent(adultStudent);
      expect(result).toBe(true);
    });
  });

  describe('3. Registro de Eventos Críticos e Higienização de PII', () => {
    it('deve registrar HARD_DELETE_RECORDS e expurgar PII confidencial dos metadados', async () => {
      const result = await auditService.record({
        userId: 'admin_dpo',
        action: 'HARD_DELETE_RECORDS',
        details: 'Exclusão definitiva de prontuário do aluno com CPF 123.456.789-00 conforme Art. 16.',
        metadata: {
          studentId: 'std_900',
          cpf: '123.456.789-00',
          password: 'secret_master_password',
          faceVector: [0.12, 0.44, 0.99]
        },
        legalBasis: 'LGPD_ART_16'
      });

      expect(result.hash).toBeTruthy();
      const recorded = inMemoryRecords[0];
      const parsedMeta = JSON.parse(recorded.metadata);

      // Verificação da higienização PII (Privacy by Design)
      expect(parsedMeta.cpf).toBe('[REDACTED_BY_LGPD_GUARD]');
      expect(parsedMeta.password).toBe('[REDACTED_BY_LGPD_GUARD]');
      expect(parsedMeta.faceVector).toBe('[REDACTED_BY_LGPD_GUARD]');
      expect(recorded.details).toContain('[CPF_PROTEGIDO]');
    });

    it('deve registrar BIOMETRIC_CONSENT_REVOKED com encadeamento válido', async () => {
      await auditService.record({
        userId: 'parent_user_1',
        action: 'BIOMETRIC_CONSENT_REVOKED',
        details: 'Revogação formal de biometria facial com expurgo de 512-D.',
        legalBasis: 'LGPD_ART_14'
      });

      expect(inMemoryRecords[0].action).toBe('BIOMETRIC_CONSENT_REVOKED');
      const chainStatus = await auditService.verifyChainIntegrity();
      expect(chainStatus.valid).toBe(true);
    });
  });
});
