import { describe, it, expect } from 'vitest';
import { appRouter } from '../index';

describe('@aquila/api — tRPC Router & Sovereign RBAC Middleware (4 Sub-routers)', () => {
  it('getHealth deve responder publicamente com status ok', async () => {
    const caller = appRouter.createCaller({});
    const res = await caller.getHealth();
    expect(res.status).toBe('ok');
    expect(typeof res.uptime).toBe('number');
    expect(typeof res.timestamp).toBe('string');
  });

  it('protectedProcedure (student.list & attendance.getDailySummary) deve bloquear chamadas não autenticadas com UNAUTHORIZED', async () => {
    const unauthCaller = appRouter.createCaller({ user: null });
    await expect(unauthCaller.student.list({ limit: 10 })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    await expect(unauthCaller.attendance.getDailySummary({})).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('protectedProcedure (attendance.getDailySummary & markAttendance) deve permitir perfil teacher autenticado', async () => {
    const teacherCaller = appRouter.createCaller({
      user: { id: 'u-teacher-1', username: 'prof.carlos', role: 'teacher' },
    });
    const summary = await teacherCaller.attendance.getDailySummary({ date: '2026-11-04' });
    expect(summary.date).toBe('2026-11-04');
    expect(summary.totalStudents).toBeGreaterThan(0);

    const marked = await teacherCaller.attendance.markAttendance({
      studentId: 'st-01',
      status: 'present',
      classId: '3A',
      subject: 'Física',
    });
    expect(marked.success).toBe(true);
    expect(marked.record.studentId).toBe('st-01');
  });

  it('adminProcedure (getAuditLogs, finance.*, automation.*) deve bloquear perfil teacher/student com FORBIDDEN', async () => {
    const teacherCaller = appRouter.createCaller({
      user: { id: 'u-teacher-1', username: 'prof.carlos', role: 'teacher' },
    });
    await expect(teacherCaller.getAuditLogs({ limit: 10 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(teacherCaller.finance.getSummary()).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(teacherCaller.automation.getSystemStatus()).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(teacherCaller.automation.runLgpdRetentionPurge({ retentionDays: 365, dryRun: true })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('adminProcedure (getAuditLogs, finance, automation, observability & LGPD purge) deve permitir admin/coordinator', async () => {
    const adminCaller = appRouter.createCaller({
      user: { id: 'u-admin-1', username: 'coord.helena', role: 'coordinator' },
    });

    const logs = await adminCaller.getAuditLogs({ limit: 10 });
    expect(Array.isArray(logs)).toBe(true);

    const finSummary = await adminCaller.finance.getSummary();
    expect(finSummary.currency).toBe('BRL');
    expect(finSummary.monthlyRevenue).toBeGreaterThan(0);

    const pendingInvoices = await adminCaller.finance.listInvoices({ status: 'pending' });
    expect(pendingInvoices.every((inv) => inv.status === 'pending')).toBe(true);

    const obs = await adminCaller.automation.exportOfflineObservability({ includeMetricsWindowHours: 48 });
    expect(obs.piiIncluded).toBe(false);
    expect(obs.windowHours).toBe(48);
    expect(obs.sha256).toMatch(/^[a-f0-9]{64}$/);

    const purge = await adminCaller.automation.runLgpdRetentionPurge({ retentionDays: 365, dryRun: false });
    expect(purge.success).toBe(true);
    expect(purge.action).toBe('DATA_RETENTION_EXPIRATION');
    expect(purge.auditHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
