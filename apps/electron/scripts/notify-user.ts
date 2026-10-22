import { Client, LocalAuth } from 'whatsapp-web.js';
import process from 'process';

const message = process.argv[2];
const target = '120363425999976493@g.us'; // Grupo Aquila


if (!message) {
    console.error('Uso: npx jiti notify-user.ts "mensagem"');
    process.exit(1);
}

console.log(`[WA-Bridge] Enviando notificação para ${target}...`);

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

client.on('ready', async () => {
    try {
        await client.sendMessage(target, message);
        console.log('[WA-Bridge] ✅ Notificação enviada com sucesso!');
        setTimeout(() => process.exit(0), 1000);
    } catch (err) {
        console.error('[WA-Bridge] ❌ Erro ao enviar:', err);
        process.exit(1);
    }
});

client.on('auth_failure', () => {
    console.error('[WA-Bridge] ❌ Falha na autenticação. Sessão expirada?');
    process.exit(1);
});

// Timeout de segurança
setTimeout(() => {
    console.error('[WA-Bridge] ❌ Timeout: O cliente não ficou pronto em 30 segundos.');
    process.exit(1);
}, 30000);

client.initialize();
