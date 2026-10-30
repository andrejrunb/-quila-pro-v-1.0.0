import * as path from 'path';
import { CosmeticGrantService } from '../CosmeticGrantService';

jest.mock('../ZeroBypassAuditService', () => ({
  ZeroBypassAuditService: {
    getInstance: () => ({
      record: jest.fn().mockResolvedValue(undefined)
    })
  }
}));

describe('CosmeticGrantService — Serviço Determinístico de Concessão de Cosméticos', () => {
  const catalogPath = path.resolve(__dirname, '../../../database/cosmetics.catalog.json');
  let service: CosmeticGrantService;

  beforeEach(() => {
    service = new CosmeticGrantService({}, catalogPath);
  });

  describe('Validação do Catálogo Canônico (cosmetics.catalog.json)', () => {
    test('Carrega com sucesso todos os 24 itens do catálogo', () => {
      const catalog = service.getCatalog();
      expect(catalog.length).toBe(24);
    });

    test('REGRA ZERO PAY-TO-WIN: Nenhum cosmético concede efeitos mecânicos ou pontuação', () => {
      const catalog = service.getCatalog();
      for (const item of catalog) {
        expect(item.effects).toEqual([]);
      }
    });

    test('REGRA PROPRIEDADE PERMANENTE: Nenhum cosmético possui data de expiração', () => {
      const catalog = service.getCatalog();
      for (const item of catalog) {
        expect(item.expiresAt).toBeNull();
      }
    });

    test('REGRA DETERMINÍSTICA: Todo item de conquista possui código de conquista obrigatório', () => {
      const achievementItems = service.getCatalog().filter(i => i.acquisitionType === 'achievement');
      expect(achievementItems.length).toBeGreaterThan(0);
      for (const item of achievementItems) {
        expect(typeof item.requiredAchievement).toBe('string');
        expect(item.requiredAchievement!.length).toBeGreaterThan(0);
      }
    });

    test('REGRA ECONÔMICA: Itens de compra por moeda possuem preço válido maior que zero', () => {
      const coinItems = service.getCatalog().filter(i => i.acquisitionType === 'coins');
      expect(coinItems.length).toBeGreaterThan(0);
      for (const item of coinItems) {
        expect(item.priceCoins).toBeGreaterThan(0);
      }
    });
  });

  describe('Concessão Determinística por Conquista Formativa', () => {
    test('Concede item quando o código de conquista é atendido', () => {
      const res = service.grantByAchievement('aluno_1', 'presenca_90_dias', 'prof_coordenador');
      expect(res.success).toBe(true);
      expect(res.alreadyOwned).toBe(false);
      expect(res.grantedItems).toHaveLength(1);
      expect(res.grantedItems[0].itemId).toBe('skin_guardiao_escola');
      expect(res.auditRecords).toHaveLength(1);
      expect(res.auditRecords[0].origin).toBe('achievement');
      expect(res.auditRecords[0].coinsSpent).toBe(0);
      expect(res.auditRecords[0].signature).toBeDefined();

      const state = service.getStudentState('aluno_1');
      expect(state.unlockedItemIds).toContain('skin_guardiao_escola');
    });

    test('IDEMPOTÊNCIA: Chamada repetida da mesma conquista não duplica itens no inventário', () => {
      service.grantByAchievement('aluno_1', 'presenca_90_dias');
      const secondCall = service.grantByAchievement('aluno_1', 'presenca_90_dias');

      expect(secondCall.success).toBe(true);
      expect(secondCall.alreadyOwned).toBe(true);
      expect(secondCall.grantedItems).toHaveLength(0);

      const state = service.getStudentState('aluno_1');
      const occurrences = state.unlockedItemIds.filter(id => id === 'skin_guardiao_escola');
      expect(occurrences).toHaveLength(1);
    });

    test('Retorna insucesso para código de conquista inexistente', () => {
      const res = service.grantByAchievement('aluno_1', 'codigo_fantasma_inexistente');
      expect(res.success).toBe(false);
      expect(res.grantedItems).toHaveLength(0);
    });
  });

  describe('Compra Determinística por Moedas Pedagógicas (Aureus)', () => {
    test('Efetua compra com saldo suficiente e debita corretamente', () => {
      const res = service.purchaseByCoins('aluno_2', 'emote_tesla_eureca', 1000);
      expect(res.success).toBe(true);
      expect(res.newBalance).toBe(800); // 1000 - 200
      expect(res.item?.itemId).toBe('emote_tesla_eureca');
      expect(res.auditRecord?.coinsSpent).toBe(200);
      expect(res.auditRecord?.origin).toBe('purchase');

      const state = service.getStudentState('aluno_2');
      expect(state.unlockedItemIds).toContain('emote_tesla_eureca');
    });

    test('Bloqueia compra quando o saldo é insuficiente', () => {
      const res = service.purchaseByCoins('aluno_3', 'moldura_arco_plasma', 500); // custa 900
      expect(res.success).toBe(false);
      expect(res.newBalance).toBe(500);
      expect(res.error).toContain('INSUFFICIENT_FUNDS');

      const state = service.getStudentState('aluno_3');
      expect(state.unlockedItemIds).not.toContain('moldura_arco_plasma');
    });

    test('Bloqueia compra de item exclusivo de conquista pedagógica', () => {
      const res = service.purchaseByCoins('aluno_4', 'skin_tesla_mestre_raios', 5000);
      expect(res.success).toBe(false);
      expect(res.error).toContain('ITEM_ACQUISITION_NOT_COINS');
    });

    test('Bloqueia compra de item que o estudante já possui', () => {
      service.purchaseByCoins('aluno_5', 'emote_tesla_eureca', 1000);
      const duplicateRes = service.purchaseByCoins('aluno_5', 'emote_tesla_eureca', 800);
      expect(duplicateRes.success).toBe(false);
      expect(duplicateRes.error).toContain('ALREADY_OWNED');
    });
  });

  describe('Equipamento de Cosméticos no Perfil', () => {
    test('Equipa item desbloqueado no slot da categoria correta', () => {
      service.grantByAchievement('aluno_6', 'presenca_90_dias');
      const equipRes = service.equipItem('aluno_6', 'skin_guardiao_escola');
      expect(equipRes.success).toBe(true);
      expect(equipRes.equippedSlots.avatar_skin).toBe('skin_guardiao_escola');
    });

    test('Rejeita equipar item que o estudante não possui', () => {
      const equipRes = service.equipItem('aluno_7', 'skin_marie_curie_nucleo');
      expect(equipRes.success).toBe(false);
      expect(equipRes.error).toContain('NOT_OWNED');
    });
  });

  describe('Trilha de Auditoria Criptográfica (Zero-Bypass)', () => {
    test('Registra auditoria com assinatura HMAC-SHA256 para cada concessão', () => {
      service.grantByAchievement('aluno_audit', 'presenca_90_dias', 'diretor_escola');
      service.purchaseByCoins('aluno_audit', 'emote_tesla_eureca', 500);

      const trail = service.getAuditTrail('aluno_audit');
      expect(trail).toHaveLength(2);

      for (const entry of trail) {
        expect(entry.signature).toMatch(/^[a-f0-9]{64}$/); // HMAC SHA-256 hex
        expect(entry.timestamp).toBeDefined();
        expect(entry.studentId).toBe('aluno_audit');
      }
    });
  });
});
