import { AlertManager } from '../AlertManager';
import { db, Database } from '../../../database/Database';
import { jest } from '@jest/globals';

// Mocks
jest.mock('../../../database/Database');

describe('Integration: Alert Flow', () => {
  let alertManager: AlertManager;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = new Database() as jest.Mocked<Database>;
    alertManager = new AlertManager(mockDb);
    jest.clearAllMocks();
  });

  it('deve salvar um alerta no banco quando criado via AlertManager', async () => {
    const studentId = 'student-999';
    const classId = 'class-X';
    
    const alert = await alertManager.createAbsenceAlert(studentId, classId, new Date());

    expect(alert.type).toBe('absence');
    expect(mockDb.saveAlert).toHaveBeenCalledWith(expect.objectContaining({
      type: 'absence',
      data: expect.objectContaining({ studentId, classId })
    }));
  });

  it('deve emitir evento de alerta criado', async () => {
    const spy = jest.fn();
    alertManager.on('alert:created', spy);

    await alertManager.createUnknownPersonAlert('cam-1', 'Entrada Principal');

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'unknown',
      title: 'Pessoa Não Identificada'
    }));
  });

  it('deve atualizar o estado de leitura no banco de dados', async () => {
    const alertId = 'alert-abc';
    // Colocar alerta no mapa interno (privado) para simular que ele existe
    (alertManager as any).alerts.set(alertId, { id: alertId, read: false });

    await alertManager.markAsRead(alertId);

    expect(mockDb.updateAlert).toHaveBeenCalledWith(alertId, { read: true });
    expect((alertManager.getAllAlerts()[0]).read).toBe(true);
  });
});
