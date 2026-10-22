import { Client, LocalAuth } from 'whatsapp-web.js';
import * as fs from 'fs';
import * as path from 'path';

const target = '120363425999976493@g.us'; // Grupo Aquila
const adminPhone = '5561999623099'; // Usuário com poder de mando

const planTitle = 'Criação do Arquivo final_check.txt';
const summary = 'O Agente Antigravity solicita permissão para criar um arquivo de verificação final na raiz do projeto Áquila Pro.';

async function run() {
    console.log('[APPROVAL-LOOP] Inicializando cliente WhatsApp...');

    const filePath = path.join(process.cwd(), 'approvals.json');
    fs.writeFileSync(filePath, JSON.stringify({ last_status: 'pending', title: planTitle }, null, 2));

    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
        puppeteer: { 
            args: ['--no-sandbox', '--disable-setuid-sandbox'], 
            headless: true,
            executablePath: process.env.CHROME_PATH // Tentar usar o caminho do sistema se necessário
        }
    });

    client.on('ready', async () => {
        console.log('[APPROVAL-LOOP] Cliente pronto! Aguardando 3s para estabilização...');
        
        setTimeout(async () => {
            try {
                const message = `📋 *SOLICITAÇÃO DE APROVAÇÃO*\n\n*Ação:* ${planTitle}\n\n*Detalhes:* ${summary}\n\nDigite *APROVAR* para autorizar esta execução agora. ✅`;
                console.log(`[APPROVAL-LOOP] Enviando notificação para ${target}...`);
                await client.sendMessage(target, message);
                console.log('[APPROVAL-LOOP] ⏳ Mensagem enviada. AGUARDANDO SUA RESPOSTA "APROVAR" NO CELULAR...');
            } catch (err) {
                console.error('[APPROVAL-LOOP] ❌ Erro ao enviar mensagem inicial:', err);
                process.exit(1);
            }
        }, 3000);
    });

    client.on('message', async (msg) => {
        const body = msg.body.trim().toUpperCase();
        const author = msg.author?.replace('@c.us', '') || msg.from.replace('@c.us', '');
        
        if (msg.from === target && author === adminPhone && (body === 'APROVAR' || body === 'APROVADO')) {
            console.log(`[APPROVAL-LOOP] 🎉 RESPOSTA RECEBIDA DE ${author}: APROVAR`);

            
            try {
                fs.writeFileSync(filePath, JSON.stringify({ last_status: 'approved', title: planTitle, timestamp: new Date().toISOString() }, null, 2));
                await client.sendMessage(target, '✅ APROVAÇÃO RECEBIDA! Criando arquivo agora...');
                
                const finalFilePath = path.join(process.cwd(), 'final_check.txt');
                fs.writeFileSync(finalFilePath, 'Áquila Pro v1.3.4 - Loop de Aprovação Remota OK.\nAutorizado via WhatsApp em ' + new Date().toLocaleString());
                
                console.log(`[APPROVAL-LOOP] ✅ SUCESSO: Arquivo criado em ${finalFilePath}`);
                setTimeout(() => process.exit(0), 1000);
            } catch (err) {
                console.error('[APPROVAL-LOOP] ❌ Erro ao processar aprovação:', err);
                process.exit(1);
            }
        }
    });

    client.on('auth_failure', () => {
        console.error('[APPROVAL-LOOP] ❌ Falha na autenticação.');
        process.exit(1);
    });

    client.initialize();
}

run();
