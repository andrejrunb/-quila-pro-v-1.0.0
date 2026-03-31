/**
 * Utilitário para geração de HTML formatado para os relatórios pedagógicos.
 */

export const generateLessonReportHTML = (report: any, schoolName: string = "Áquila Pro - Colégio Modelo") => {
  return `
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #334155; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #818cf8; padding-bottom: 20px; margin-bottom: 30px; }
          .school-info h1 { margin: 0; color: #1e293b; font-size: 24px; }
          .report-meta { text-align: right; color: #64748b; font-size: 14px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; color: #475569; margin-bottom: 10px; border-left: 4px solid #818cf8; padding-left: 10px; }
          .content-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; line-height: 1.6; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .stat-card { background: #f1f5f9; padding: 15px; border-radius: 6px; text-align: center; }
          .stat-value { font-size: 20px; font-weight: bold; color: #818cf8; }
          .stat-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-top: 5px; }
          .ai-badge { display: inline-block; background: #ede9fe; color: #7c3aed; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 10px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-info">
            <h1>${schoolName}</h1>
            <p>Relatório Pedagógico de Aula</p>
          </div>
          <div class="report-meta">
            <div>Data: ${new Date(report.timestamp).toLocaleDateString('pt-BR')}</div>
            <div>Ref: #${report.id.substring(0, 8)}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Resumo da Aula</div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${report.attendanceCount}</div>
              <div class="stat-label">Alunos Presentes</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${report.durationMinutes} min</div>
              <div class="stat-label">Duração</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${report.lessonTopic || 'N/A'}</div>
              <div class="stat-label">Tópico Central</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="ai-badge">✨ Análise por Áquila Vision IA</div>
          <div class="section-title">Observações do Professor e IA</div>
          <div class="content-box">
            ${report.analysis.replace(/\n/g, '<br>')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Conteúdo do Quadro (Whiteboard)</div>
          <div class="content-box">
            ${report.whiteboardSummary || 'Nenhum registro de quadro capturado nesta aula.'}
          </div>
        </div>

        <div class="footer">
          Este documento foi gerado automaticamente pela plataforma Áquila Pro.<br>
          © 2026 Áquila Pro - Segurança & Inteligência Escolar
        </div>
      </body>
    </html>
  `;
};
