import { jest } from '@jest/globals';
import { WebSocket } from 'ws';
import { WSClientMeta, WSUserRole, WebSocketServerManager } from '../WebSocketServer';

describe('WebSocketServerManager notifications', () => {
  let server: WebSocketServerManager;

  beforeEach(() => {
    server = new WebSocketServerManager(9000, 'test-secret');
  });

  function registerClient(role: WSUserRole, authenticated = true) {
    const send = jest.fn((_message: string) => undefined);
    const socket = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
    const meta: WSClientMeta = {
      ip: '127.0.0.1',
      authenticated,
      role,
      connectedAt: new Date(),
      messageCount: 0,
      lastMessageTime: Date.now(),
      readCount: 0,
      writeCount: 0,
      dispatchCount: 0,
      windowStart: Date.now(),
      violationCount: 0
    };
    const clients: Map<WebSocket, WSClientMeta> = server['clients'];
    clients.set(socket, meta);
    return send;
  }

  it('broadcasts security alerts using the alert notification contract', () => {
    const sendToTeacher = registerClient('TEACHER');
    const sendToStudent = registerClient('STUDENT');
    const alert = { type: 'UNAUTHORIZED_EXIT', studentId: 'student-1' };

    server.notifyAlert(alert);

    expect(sendToTeacher).toHaveBeenCalledTimes(1);
    expect(JSON.parse(sendToTeacher.mock.calls[0][0])).toEqual(expect.objectContaining({
      type: 'alert',
      category: 'DISPATCH',
      data: alert,
      timestamp: expect.any(String)
    }));
    expect(sendToStudent).not.toHaveBeenCalled();
  });

  it('sends face recognition only to authenticated staff using the renderer contract', () => {
    const sendToAdmin = registerClient('ADMIN');
    const sendToGuest = registerClient('GUEST');
    const sendToUnauthenticatedTeacher = registerClient('TEACHER', false);
    const data = {
      studentId: 'student-1',
      studentName: 'Student One',
      zone: 'classroom-a',
      confidence: 0.98,
      timestamp: 123
    };

    server.notifyFaceRecognition(data);

    expect(sendToAdmin).toHaveBeenCalledTimes(1);
    expect(JSON.parse(sendToAdmin.mock.calls[0][0])).toEqual(expect.objectContaining({
      type: 'face_recognition',
      category: 'DISPATCH',
      data,
      timestamp: expect.any(String)
    }));
    expect(sendToGuest).not.toHaveBeenCalled();
    expect(sendToUnauthenticatedTeacher).not.toHaveBeenCalled();
  });
});
