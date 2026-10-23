/**
 * whatsapp.ts — Rota de Webhook + Chatbot IA para WhatsApp (Evolution API)
 *
 * Fluxo:
 *   - Evolution API envia POST /whatsapp/webhook quando chega mensagem
 *   - Apenas o número admin (ADMIN_WHATSAPP_NUMBER) pode interagir
 *   - Mensagem é processada pelo Gemini (Google AI) com contexto do sistema
 *   - Resposta é enviada de volta via Evolution API REST
 *
 * Variáveis de ambiente necessárias:
 *   EVOLUTION_API_URL    — URL base da Evolution API (ex: http://localhost:8080)
 *   EVOLUTION_API_KEY    — API Key da Evolution API
 *   EVOLUTION_INSTANCE   — Nome da instância (ex: aquilapro)
 *   ADMIN_WHATSAPP_NUMBER — Número do admin que pode usar o bot (ex: 5561999623099)
 *   GEMINI_API_KEY       — Chave da API Google Gemini
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// ─── Histórico de conversa por sessão (mantém últimas 20 trocas em memória) ───
const chatHistory: Array<{ role: 'user' | 'model'; text: string }> = [];
const MAX_HISTORY = 20;

// ─── Prompt de sistema para o assistente ────────────────────────────────────
const SYSTEM_PROMPT = `Você é o Assistente Áquila Pro, um chatbot inteligente integrado ao sistema de segurança escolar Áquila Pro.

Você ajuda o administrador do sistema via WhatsApp com:
- Consultas sobre status do sistema (câmeras, alertas, presença)
- Resumos de relatórios e eventos
- Orientações sobre uso do Áquila Pro
- Suporte técnico básico

Regras importantes:
- NUNCA revele dados biométricos ou fotos de alunos (LGPD)
- Responda sempre em Português Brasileiro
- Seja objetivo e profissional, mas amigável
- Use emojis com moderação para facilitar a leitura no WhatsApp
- Se não souber algo, diga claramente e oriente o usuário a consultar o sistema diretamente`;

// ─── Utilitário: chamar Gemini Flash ─────────────────────────────────────────
async function callGemini(userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return '⚠️ GEMINI_API_KEY não configurada. Configure a variável de ambiente no servidor.';
  }

  // Adiciona a mensagem do usuário ao histórico
  chatHistory.push({ role: 'user', text: userMessage });
  if (chatHistory.length > MAX_HISTORY) chatHistory.splice(0, chatHistory.length - MAX_HISTORY);

  const contents = chatHistory.map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('[WhatsApp AI] Gemini error:', err);
      return '❌ Erro ao consultar o assistente de IA. Tente novamente.';
    }

    const data = await response.json() as any;
    const modelText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text
      ?? '🤔 Não consegui gerar uma resposta. Tente reformular sua pergunta.';

    // Adiciona resposta ao histórico
    chatHistory.push({ role: 'model', text: modelText });
    if (chatHistory.length > MAX_HISTORY) chatHistory.splice(0, chatHistory.length - MAX_HISTORY);

    return modelText;
  } catch (err) {
    console.error('[WhatsApp AI] Fetch error:', err);
    return '❌ Falha na conexão com o assistente de IA.';
  }
}

// ─── Utilitário: enviar mensagem via Evolution API ────────────────────────────
async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const baseUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const apiKey  = process.env.EVOLUTION_API_KEY  || '';
  const instance = process.env.EVOLUTION_INSTANCE || 'aquilapro';

  try {
    const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: to,
        text,
        linkPreview: false,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[WhatsApp] Falha ao enviar mensagem para ${to}:`, body);
    }
  } catch (err) {
    console.error('[WhatsApp] Erro na requisição de envio:', err);
  }
}

// ─── POST /whatsapp/webhook ───────────────────────────────────────────────────
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  // Responde 200 imediatamente para a Evolution API não reenviar
  res.status(200).json({ ok: true });

  try {
    const body = req.body;
    const event = body?.event as string;

    // Só processa eventos de mensagem recebida
    if (event !== 'messages.upsert') return;

    const message  = body?.data?.message;
    const fromFull = body?.data?.key?.remoteJid as string; // ex: "5561999623099@s.whatsapp.net"
    const fromMe   = body?.data?.key?.fromMe as boolean;

    // Ignora mensagens enviadas pelo próprio bot
    if (fromMe) return;

    // Extrai o número limpo (sem @s.whatsapp.net)
    const fromNumber = fromFull?.replace(/@.*/, '') ?? '';
    const adminNumber = (process.env.ADMIN_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');

    // Segurança: só responde para o número de admin
    if (fromNumber !== adminNumber) {
      console.warn(`[WhatsApp] Mensagem de número não autorizado: ${fromNumber}`);
      return;
    }

    // Extrai o texto da mensagem (suporta texto puro e mensagem estendida)
    const text: string =
      message?.conversation ??
      message?.extendedTextMessage?.text ??
      '';

    if (!text.trim()) return;

    console.log(`[WhatsApp] Mensagem recebida do admin (${fromNumber}): "${text.substring(0, 80)}"`);

    // ─── Comando Especial: SALVAR NOTA ──────────────────────────────
    if (text.toLowerCase().startsWith('nota:') || text.toLowerCase().startsWith('/nota ')) {
      const noteContent = text.replace(/^(nota:|(?:\/nota\s+))/i, '').trim();
      if (noteContent) {
        try {
          await pool.query(
            'INSERT INTO notes (content, author, metadata) VALUES ($1, $2, $3)',
            [noteContent, 'whatsapp_admin', JSON.stringify({ from: fromNumber })]
          );
          await sendWhatsAppMessage(fromNumber, '📝 *Nota salva com sucesso!* Você pode visualizá-la no painel do sistema.');
          return;
        } catch (err) {
          console.error('[WhatsApp] Erro ao salvar nota:', err);
          await sendWhatsAppMessage(fromNumber, '❌ *Erro ao salvar nota.* Tente novamente em instantes.');
          return;
        }
      }
    }

    // Gera resposta com IA
    const reply = await callGemini(text);

    // Envia resposta
    await sendWhatsAppMessage(fromNumber, reply);

    console.log(`[WhatsApp] Resposta enviada para ${fromNumber}`);
  } catch (err) {
    console.error('[WhatsApp] Erro no processamento do webhook:', err);
  }
});

// ─── GET /whatsapp/status — Health check da integração ───────────────────────
router.get('/status', (_req: Request, res: Response): void => {
  const configured = !!(
    process.env.EVOLUTION_API_URL &&
    process.env.EVOLUTION_API_KEY &&
    process.env.ADMIN_WHATSAPP_NUMBER &&
    process.env.GEMINI_API_KEY
  );

  res.json({
    ok: configured,
    instance: process.env.EVOLUTION_INSTANCE ?? 'aquilapro',
    adminNumber: process.env.ADMIN_WHATSAPP_NUMBER
      ? `****${(process.env.ADMIN_WHATSAPP_NUMBER).slice(-4)}`
      : 'não configurado',
    chatHistoryLength: chatHistory.length,
    gemini: process.env.GEMINI_API_KEY ? 'configurado' : 'não configurado',
    evolution: process.env.EVOLUTION_API_URL ?? 'não configurado',
  });
});

// ─── DELETE /whatsapp/history — Limpar histórico de conversa ─────────────────
router.delete('/history', (req: Request, res: Response): void => {
  // Requer admin token para limpar histórico
  const token = req.headers['x-admin-token'] as string;
  const validTokens = (process.env.AQUILA_ADMIN_TOKENS ?? '').split(',').map(t => t.trim());

  if (!token || !validTokens.includes(token)) {
    res.status(401).json({ error: 'Token de administrador inválido.' });
    return;
  }

  chatHistory.length = 0;
  res.json({ ok: true, message: 'Histórico de conversa limpo.' });
});

export default router;
