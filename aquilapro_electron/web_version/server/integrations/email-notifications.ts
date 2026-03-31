import { sendEmail } from "./sendgrid";

// ============================================
// SISTEMA DE NOTIFICAÇÕES POR EMAIL
// Áquila Pro - Notificações Automáticas
// ============================================

interface StudentAttendance {
  studentName: string;
  parentEmail: string;
  parentName: string;
  className: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
  period: string;
}

interface DailyNotification {
  parentEmail: string;
  parentName: string;
  studentName: string;
  arrivalTime?: string;
  departureTime?: string;
  status: "present" | "absent" | "late" | "early_departure";
  notes?: string;
}

interface SecurityAlert {
  parentEmail: string;
  parentName: string;
  studentName: string;
  alertType: string;
  description: string;
  timestamp: string;
}

// ============================================
// TEMPLATES DE EMAIL
// ============================================

function getArrivalTemplate(data: DailyNotification): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Áquila Pro</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0;">Sistema de Segurança Escolar</p>
      </div>
      <div style="padding: 32px; background: white;">
        <p style="color: #374151; font-size: 16px;">Olá, <strong>${data.parentName}</strong>!</p>
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
          <p style="color: #166534; margin: 0; font-size: 16px;">
            ✅ <strong>${data.studentName}</strong> chegou na escola às <strong>${data.arrivalTime}</strong>.
          </p>
        </div>
        ${data.status === "late" ? `
          <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #854d0e; margin: 0; font-size: 14px;">
              ⚠️ Nota: Chegada com atraso. ${data.notes || ""}
            </p>
          </div>
        ` : ""}
        <p style="color: #6b7280; font-size: 14px;">Tenha um ótimo dia!</p>
      </div>
      <div style="padding: 16px 32px; background: #f1f5f9; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Áquila Pro - Segurança e Engajamento Escolar<br>
          Contato: andrejrunb@yahoo.com.br | +55 (61) 99962-3099
        </p>
      </div>
    </div>
  `;
}

function getAbsenceTemplate(data: DailyNotification): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Áquila Pro</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0;">Sistema de Segurança Escolar</p>
      </div>
      <div style="padding: 32px; background: white;">
        <p style="color: #374151; font-size: 16px;">Olá, <strong>${data.parentName}</strong>!</p>
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
          <p style="color: #991b1b; margin: 0; font-size: 16px;">
            ❌ <strong>${data.studentName}</strong> não foi registrado(a) na escola hoje.
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Se a ausência foi planejada, por favor justifique junto à coordenação.
          Caso contrário, entre em contato conosco.
        </p>
      </div>
      <div style="padding: 16px 32px; background: #f1f5f9; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Áquila Pro - Segurança e Engajamento Escolar<br>
          Contato: andrejrunb@yahoo.com.br | +55 (61) 99962-3099
        </p>
      </div>
    </div>
  `;
}

function getWeeklyReportTemplate(data: StudentAttendance): string {
  const rateColor = data.attendanceRate >= 90 ? "#22c55e" : data.attendanceRate >= 75 ? "#eab308" : "#ef4444";
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Áquila Pro</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0;">Relatório Semanal de Presença</p>
      </div>
      <div style="padding: 32px; background: white;">
        <p style="color: #374151; font-size: 16px;">Olá, <strong>${data.parentName}</strong>!</p>
        <p style="color: #6b7280; font-size: 14px;">Segue o relatório de presença de <strong>${data.studentName}</strong> (${data.className}) referente ao período ${data.period}:</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; width: 120px; height: 120px; border-radius: 50%; border: 8px solid ${rateColor}; line-height: 104px; font-size: 32px; font-weight: bold; color: #1f2937;">
            ${data.attendanceRate.toFixed(1)}%
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Taxa de Presença</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #f1f5f9;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Dias Presente</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: bold;">${data.presentDays}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Dias Ausente</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #ef4444; font-weight: bold;">${data.absentDays}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #374151;">Atrasos</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; color: #eab308; font-weight: bold;">${data.lateDays}</td>
          </tr>
        </table>

        ${data.attendanceRate < 75 ? `
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #991b1b; margin: 0; font-size: 14px;">
              ⚠️ <strong>Atenção:</strong> A taxa de presença está abaixo do mínimo de 75%. 
              Entre em contato com a coordenação para evitar reprovação por falta.
            </p>
          </div>
        ` : ""}
      </div>
      <div style="padding: 16px 32px; background: #f1f5f9; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Áquila Pro - Segurança e Engajamento Escolar<br>
          Contato: andrejrunb@yahoo.com.br | +55 (61) 99962-3099
        </p>
      </div>
    </div>
  `;
}

function getSecurityAlertTemplate(data: SecurityAlert): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🚨 ALERTA DE SEGURANÇA</h1>
        <p style="color: #fecaca; margin: 8px 0 0;">Áquila Pro - Sistema de Segurança</p>
      </div>
      <div style="padding: 32px; background: white;">
        <p style="color: #374151; font-size: 16px;">Olá, <strong>${data.parentName}</strong>!</p>
        <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 20px; margin: 16px 0; border-radius: 8px;">
          <p style="color: #991b1b; margin: 0 0 8px; font-size: 18px; font-weight: bold;">
            ${data.alertType === "unauthorized_exit" ? "⚠️ Saída Não Autorizada" :
              data.alertType === "unidentified" ? "👤 Pessoa Não Identificada" :
              data.alertType === "health" ? "🏥 Incidente de Saúde" :
              "🔔 Alerta de Segurança"}
          </p>
          <p style="color: #374151; margin: 0; font-size: 14px;">
            <strong>Aluno:</strong> ${data.studentName}<br>
            <strong>Horário:</strong> ${data.timestamp}<br>
            <strong>Detalhes:</strong> ${data.description}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          A escola já foi notificada e está tomando as medidas necessárias.
          Entre em contato para mais informações.
        </p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="tel:+5561999623099" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Ligar para a Escola
          </a>
        </div>
      </div>
      <div style="padding: 16px 32px; background: #f1f5f9; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Áquila Pro - Segurança e Engajamento Escolar<br>
          Contato: andrejrunb@yahoo.com.br | +55 (61) 99962-3099
        </p>
      </div>
    </div>
  `;
}

// ============================================
// FUNÇÕES DE ENVIO
// ============================================

export async function sendArrivalNotification(data: DailyNotification): Promise<boolean> {
  try {
    const subject = data.status === "late"
      ? `⚠️ ${data.studentName} chegou atrasado(a) na escola`
      : `✅ ${data.studentName} chegou na escola`;

    await sendEmail({
      to: data.parentEmail,
      subject,
      htmlContent: getArrivalTemplate(data),
      textContent: `${data.studentName} chegou na escola às ${data.arrivalTime}.`,
    });
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de chegada:", error);
    return false;
  }
}

export async function sendAbsenceNotification(data: DailyNotification): Promise<boolean> {
  try {
    await sendEmail({
      to: data.parentEmail,
      subject: `❌ ${data.studentName} não foi registrado(a) na escola hoje`,
      htmlContent: getAbsenceTemplate(data),
      textContent: `${data.studentName} não foi registrado(a) na escola hoje.`,
    });
    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de ausência:", error);
    return false;
  }
}

export async function sendWeeklyReport(data: StudentAttendance): Promise<boolean> {
  try {
    await sendEmail({
      to: data.parentEmail,
      subject: `📊 Relatório Semanal - ${data.studentName} (${data.attendanceRate.toFixed(1)}% presença)`,
      htmlContent: getWeeklyReportTemplate(data),
      textContent: `Relatório semanal de ${data.studentName}: ${data.attendanceRate.toFixed(1)}% de presença.`,
    });
    return true;
  } catch (error) {
    console.error("Erro ao enviar relatório semanal:", error);
    return false;
  }
}

export async function sendSecurityAlertEmail(data: SecurityAlert): Promise<boolean> {
  try {
    await sendEmail({
      to: data.parentEmail,
      subject: `🚨 ALERTA: ${data.alertType === "unauthorized_exit" ? "Saída não autorizada" : "Alerta de segurança"} - ${data.studentName}`,
      htmlContent: getSecurityAlertTemplate(data),
      textContent: `ALERTA DE SEGURANÇA: ${data.description}`,
    });
    return true;
  } catch (error) {
    console.error("Erro ao enviar alerta de segurança:", error);
    return false;
  }
}

export async function sendBulkAbsenceNotifications(
  absentStudents: DailyNotification[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const student of absentStudents) {
    const success = await sendAbsenceNotification(student);
    if (success) sent++;
    else failed++;
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return { sent, failed };
}

export async function sendBulkWeeklyReports(
  students: StudentAttendance[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const student of students) {
    const success = await sendWeeklyReport(student);
    if (success) sent++;
    else failed++;
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return { sent, failed };
}
