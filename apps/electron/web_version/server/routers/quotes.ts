import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { quoteRequests } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../integrations/sendgrid";
import { config } from "../_core/config";

// ============================================================================
// QUOTES ROUTER - Solicitações de Orçamento
// ============================================================================

export const quotesRouter = router({
  // ---- ENVIAR SOLICITAÇÃO DE ORÇAMENTO (público) ----
  submit: publicProcedure
    .input(
      z.object({
        // Dados da escola
        schoolName: z.string().min(3, "Nome da escola é obrigatório"),
        schoolType: z.enum(["public_municipal", "public_state", "public_federal", "private", "other"]),
        city: z.string().min(2, "Cidade é obrigatória"),
        state: z.string().length(2, "Estado deve ter 2 caracteres"),
        // Dados do contato
        contactName: z.string().min(3, "Nome do contato é obrigatório"),
        contactRole: z.string().min(2, "Cargo é obrigatório"),
        contactEmail: z.string().email("Email inválido"),
        contactPhone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
        contactWhatsapp: z.string().optional(),
        // Dados do projeto
        totalStudents: z.number().int().positive("Número de alunos deve ser positivo"),
        totalRooms: z.number().int().positive("Número de salas deve ser positivo"),
        existingCameras: z.number().int().min(0).default(0),
        cameraBrand: z.string().optional(),
        hasDVR: z.boolean().default(false),
        hasNetwork: z.boolean().default(false),
        // Interesse
        interestedFeatures: z.array(z.string()).default([]),
        budget: z.enum(["under_10k", "10k_25k", "25k_50k", "50k_100k", "above_100k", "unknown"]).default("unknown"),
        timeline: z.enum(["immediate", "1_month", "3_months", "6_months", "next_year", "unknown"]).default("unknown"),
        message: z.string().optional(),
        // Rastreamento
        source: z.string().default("website"),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      // Inserir no banco
      const result = await db.insert(quoteRequests).values({
        schoolName: input.schoolName,
        schoolType: input.schoolType,
        city: input.city,
        state: input.state,
        contactName: input.contactName,
        contactRole: input.contactRole,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        contactWhatsapp: input.contactWhatsapp || null,
        totalStudents: input.totalStudents,
        totalRooms: input.totalRooms,
        existingCameras: input.existingCameras,
        cameraBrand: input.cameraBrand || null,
        hasDVR: input.hasDVR ? 1 : 0,
        hasNetwork: input.hasNetwork ? 1 : 0,
        interestedFeatures: JSON.stringify(input.interestedFeatures),
        budget: input.budget,
        timeline: input.timeline,
        message: input.message || null,
        source: input.source,
        utmSource: input.utmSource || null,
        utmMedium: input.utmMedium || null,
        utmCampaign: input.utmCampaign || null,
      });

      const quoteId = Number(result[0].insertId);

      // Mapear valores para labels legíveis
      const schoolTypeLabels: Record<string, string> = {
        public_municipal: "Pública Municipal",
        public_state: "Pública Estadual",
        public_federal: "Pública Federal",
        private: "Particular",
        other: "Outro",
      };

      const budgetLabels: Record<string, string> = {
        under_10k: "Até R$ 10.000",
        "10k_25k": "R$ 10.000 - R$ 25.000",
        "25k_50k": "R$ 25.000 - R$ 50.000",
        "50k_100k": "R$ 50.000 - R$ 100.000",
        above_100k: "Acima de R$ 100.000",
        unknown: "Não definido",
      };

      const timelineLabels: Record<string, string> = {
        immediate: "Imediato",
        "1_month": "1 mês",
        "3_months": "3 meses",
        "6_months": "6 meses",
        next_year: "Próximo ano",
        unknown: "Não definido",
      };

      // Notificar o proprietário via sistema de notificações
      try {
        await notifyOwner({
          title: `Nova Solicitação de Orçamento #${quoteId}`,
          content: [
            `🏫 **Escola:** ${input.schoolName} (${schoolTypeLabels[input.schoolType] || input.schoolType})`,
            `📍 **Localização:** ${input.city}/${input.state}`,
            `👤 **Contato:** ${input.contactName} - ${input.contactRole}`,
            `📧 **Email:** ${input.contactEmail}`,
            `📱 **Telefone:** ${input.contactPhone}`,
            input.contactWhatsapp ? `💬 **WhatsApp:** ${input.contactWhatsapp}` : "",
            `👨‍🎓 **Alunos:** ${input.totalStudents}`,
            `🏠 **Salas:** ${input.totalRooms}`,
            `📹 **Câmeras existentes:** ${input.existingCameras}`,
            input.cameraBrand ? `📷 **Marca:** ${input.cameraBrand}` : "",
            `💰 **Orçamento:** ${budgetLabels[input.budget] || "Não definido"}`,
            `⏰ **Timeline:** ${timelineLabels[input.timeline] || "Não definido"}`,
            input.interestedFeatures.length > 0 ? `✅ **Funcionalidades:** ${input.interestedFeatures.join(", ")}` : "",
            input.message ? `💬 **Mensagem:** ${input.message}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        });
      } catch (e) {
        console.error("[Quotes] Erro ao notificar proprietário:", e);
      }

      // Enviar email detalhado para o proprietário
      try {
        await sendEmail({
          to: config.adminEmail,
          subject: `Nova Solicitação de Orçamento #${quoteId} - ${input.schoolName}`,
          htmlContent: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; color: #333; }
                  .container { max-width: 700px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #0066cc, #004499); color: white; padding: 24px; border-radius: 8px 8px 0 0; }
                  .content { padding: 24px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
                  .section { margin-bottom: 20px; }
                  .section-title { font-size: 16px; font-weight: bold; color: #0066cc; margin-bottom: 10px; border-bottom: 2px solid #e0e0e0; padding-bottom: 6px; }
                  .info-row { display: flex; padding: 6px 0; border-bottom: 1px solid #eee; }
                  .info-label { font-weight: bold; width: 180px; color: #555; }
                  .info-value { flex: 1; }
                  .highlight { background-color: #e8f4f8; padding: 12px; border-left: 4px solid #0066cc; margin: 15px 0; border-radius: 4px; }
                  .features { display: flex; flex-wrap: wrap; gap: 6px; }
                  .feature-tag { background-color: #0066cc; color: white; padding: 4px 12px; border-radius: 16px; font-size: 13px; }
                  .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
                  .cta { text-align: center; margin-top: 20px; }
                  .cta a { display: inline-block; background-color: #0066cc; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin:0;">Nova Solicitação de Orçamento #${quoteId}</h1>
                    <p style="margin:8px 0 0;opacity:0.9;">Recebida em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div class="content">
                    <div class="section">
                      <div class="section-title">Dados da Escola</div>
                      <div class="info-row"><span class="info-label">Nome:</span><span class="info-value">${input.schoolName}</span></div>
                      <div class="info-row"><span class="info-label">Tipo:</span><span class="info-value">${schoolTypeLabels[input.schoolType] || input.schoolType}</span></div>
                      <div class="info-row"><span class="info-label">Localização:</span><span class="info-value">${input.city}/${input.state}</span></div>
                    </div>
                    <div class="section">
                      <div class="section-title">Dados do Contato</div>
                      <div class="info-row"><span class="info-label">Nome:</span><span class="info-value">${input.contactName}</span></div>
                      <div class="info-row"><span class="info-label">Cargo:</span><span class="info-value">${input.contactRole}</span></div>
                      <div class="info-row"><span class="info-label">Email:</span><span class="info-value"><a href="mailto:${input.contactEmail}">${input.contactEmail}</a></span></div>
                      <div class="info-row"><span class="info-label">Telefone:</span><span class="info-value"><a href="tel:${input.contactPhone}">${input.contactPhone}</a></span></div>
                      ${input.contactWhatsapp ? `<div class="info-row"><span class="info-label">WhatsApp:</span><span class="info-value"><a href="https://wa.me/${input.contactWhatsapp.replace(/\D/g, '')}">${input.contactWhatsapp}</a></span></div>` : ""}
                    </div>
                    <div class="section">
                      <div class="section-title">Dados do Projeto</div>
                      <div class="info-row"><span class="info-label">Total de Alunos:</span><span class="info-value">${input.totalStudents}</span></div>
                      <div class="info-row"><span class="info-label">Total de Salas:</span><span class="info-value">${input.totalRooms}</span></div>
                      <div class="info-row"><span class="info-label">Câmeras Existentes:</span><span class="info-value">${input.existingCameras}</span></div>
                      ${input.cameraBrand ? `<div class="info-row"><span class="info-label">Marca das Câmeras:</span><span class="info-value">${input.cameraBrand}</span></div>` : ""}
                      <div class="info-row"><span class="info-label">Possui DVR/NVR:</span><span class="info-value">${input.hasDVR ? "Sim" : "Não"}</span></div>
                      <div class="info-row"><span class="info-label">Rede Cabeada:</span><span class="info-value">${input.hasNetwork ? "Sim" : "Não"}</span></div>
                    </div>
                    <div class="section">
                      <div class="section-title">Orçamento e Prazo</div>
                      <div class="info-row"><span class="info-label">Orçamento:</span><span class="info-value">${budgetLabels[input.budget] || "Não definido"}</span></div>
                      <div class="info-row"><span class="info-label">Prazo:</span><span class="info-value">${timelineLabels[input.timeline] || "Não definido"}</span></div>
                    </div>
                    ${input.interestedFeatures.length > 0 ? `
                    <div class="section">
                      <div class="section-title">Funcionalidades de Interesse</div>
                      <div class="features">
                        ${input.interestedFeatures.map((f: string) => `<span class="feature-tag">${f}</span>`).join("")}
                      </div>
                    </div>` : ""}
                    ${input.message ? `
                    <div class="highlight">
                      <strong>Mensagem do Cliente:</strong><br>
                      ${input.message}
                    </div>` : ""}
                    <div class="cta">
                      <p style="color:#666;">Responda ao cliente o mais rápido possível!</p>
                      <a href="mailto:${input.contactEmail}?subject=Orçamento Áquila Pro - ${input.schoolName}">Responder por Email</a>
                    </div>
                  </div>
                  <div class="footer">
                    <p>Áquila Pro - Sistema de Segurança e Engajamento Escolar</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
        console.log(`[Quotes] Email de orçamento #${quoteId} enviado para ${config.adminEmail}`);
      } catch (e) {
        console.error("[Quotes] Erro ao enviar email de orçamento:", e);
      }

      // Enviar email de confirmação para o cliente
      try {
        await sendEmail({
          to: input.contactEmail,
          subject: `Recebemos seu pedido de orçamento - Áquila Pro (#${quoteId})`,
          htmlContent: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #0066cc, #004499); color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
                  .content { padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
                  .ticket { background-color: #e8f4f8; padding: 16px; border-left: 4px solid #0066cc; margin: 20px 0; border-radius: 4px; }
                  .steps { margin: 20px 0; }
                  .step { display: flex; align-items: flex-start; margin-bottom: 12px; }
                  .step-num { background-color: #0066cc; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0; }
                  .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
                  .contact { background-color: #f0f0f0; padding: 16px; border-radius: 8px; margin-top: 20px; text-align: center; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin:0;">Obrigado pelo seu interesse!</h1>
                    <p style="margin:8px 0 0;opacity:0.9;">Áquila Pro - Sistema de Segurança Escolar</p>
                  </div>
                  <div class="content">
                    <p>Olá <strong>${input.contactName}</strong>,</p>
                    <p>Recebemos sua solicitação de orçamento para a <strong>${input.schoolName}</strong> e estamos muito felizes com seu interesse no Áquila Pro!</p>
                    <div class="ticket">
                      <p style="margin:0;"><strong>Número do Orçamento:</strong> #${quoteId}</p>
                      <p style="margin:4px 0 0;">Guarde este número para referência futura.</p>
                    </div>
                    <h3>Próximos Passos:</h3>
                    <div class="steps">
                      <div class="step">
                        <span class="step-num">1</span>
                        <div>
                          <strong>Análise</strong><br>
                          <span style="color:#666;">Nossa equipe analisará as necessidades da sua escola.</span>
                        </div>
                      </div>
                      <div class="step">
                        <span class="step-num">2</span>
                        <div>
                          <strong>Contato</strong><br>
                          <span style="color:#666;">Entraremos em contato em até 24 horas para agendar uma reunião.</span>
                        </div>
                      </div>
                      <div class="step">
                        <span class="step-num">3</span>
                        <div>
                          <strong>Proposta</strong><br>
                          <span style="color:#666;">Enviaremos uma proposta personalizada com valores e cronograma.</span>
                        </div>
                      </div>
                    </div>
                    <div class="contact">
                      <p style="margin:0;"><strong>Precisa de atendimento imediato?</strong></p>
                      <p style="margin:4px 0;">WhatsApp: <a href="https://wa.me/5561999623099">(61) 99962-3099</a></p>
                      <p style="margin:4px 0;">Email: <a href="mailto:${config.adminEmail}">${config.adminEmail}</a></p>
                    </div>
                    <p>Atenciosamente,<br><strong>Equipe Áquila Pro</strong></p>
                  </div>
                  <div class="footer">
                    <p>&copy; 2026 Áquila Pro. Todos os direitos reservados.</p>
                    <p>Seus dados estão protegidos conforme a LGPD.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });
        console.log(`[Quotes] Email de confirmação enviado para ${input.contactEmail}`);
      } catch (e) {
        console.error("[Quotes] Erro ao enviar email de confirmação:", e);
      }

      return {
        success: true,
        quoteId,
        message: "Solicitação de orçamento enviada com sucesso! Entraremos em contato em até 24 horas.",
      };
    }),

  // ---- LISTAR ORÇAMENTOS (admin) ----
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { quotes: [], total: 0 };

      const quotes = input.status
        ? await db
            .select()
            .from(quoteRequests)
            .where(eq(quoteRequests.status, input.status as any))
            .orderBy(desc(quoteRequests.createdAt))
            .limit(input.limit)
            .offset(input.offset)
        : await db
            .select()
            .from(quoteRequests)
            .orderBy(desc(quoteRequests.createdAt))
            .limit(input.limit)
            .offset(input.offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(quoteRequests);

      return {
        quotes,
        total: countResult[0]?.count || 0,
      };
    }),

  // ---- ATUALIZAR STATUS (admin) ----
  updateStatus: protectedProcedure
    .input(
      z.object({
        quoteId: z.number(),
        status: z.enum(["new", "contacted", "meeting_scheduled", "proposal_sent", "negotiating", "won", "lost"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updateData: Record<string, unknown> = {
        status: input.status,
        assignedTo: ctx.user.id,
      };

      if (input.status === "contacted") {
        updateData.contactedAt = new Date();
      }

      if (input.notes) {
        updateData.notes = input.notes;
      }

      await db
        .update(quoteRequests)
        .set(updateData)
        .where(eq(quoteRequests.id, input.quoteId));

      return { success: true };
    }),

  // ---- ESTATÍSTICAS (admin) ----
  stats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, new: 0, contacted: 0, won: 0, lost: 0 };

    const results = await db
      .select({
        status: quoteRequests.status,
        count: sql<number>`count(*)`,
      })
      .from(quoteRequests)
      .groupBy(quoteRequests.status);

    const stats: Record<string, number> = { total: 0, new: 0, contacted: 0, meeting_scheduled: 0, proposal_sent: 0, negotiating: 0, won: 0, lost: 0 };

    for (const row of results) {
      stats[row.status] = row.count;
      stats.total += row.count;
    }

    return stats;
  }),
});
