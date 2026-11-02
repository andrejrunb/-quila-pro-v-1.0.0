const mockInvoke = jest.fn();
const mockExposeInMainWorld = jest.fn();

jest.mock('electron', () => ({
  contextBridge: { exposeInMainWorld: mockExposeInMainWorld },
  ipcRenderer: {
    invoke: mockInvoke,
    on: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    send: jest.fn(),
  },
}));

import '../preload';

describe('preload student API', () => {
  const api = mockExposeInMainWorld.mock.calls[0][1] as {
    createStudent: (value: unknown) => Promise<unknown>;
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  };

  beforeEach(() => mockInvoke.mockClear());

  it('routes student creation through its dedicated IPC method', async () => {
    await api.createStudent({ name: 'Student One', classId: 'class-1' });
    expect(mockInvoke).toHaveBeenCalledWith('create-student', { name: 'Student One', classId: 'class-1' });
  });

  it('blocks unknown generic channels without invoking Electron IPC', async () => {
    await expect(api.invoke('unknown:channel')).rejects.toThrow('Canal IPC não autorizado');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('blocks the retired generic student creation channel', async () => {
    await expect(api.invoke('students:add', { name: 'Student One' }))
      .rejects.toThrow('Canal IPC não autorizado');
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
