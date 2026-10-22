import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

console.log('[WA-GROUP-FINDER] Inicializando...');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

client.on('qr', (qr) => {
    console.log('[WA-QR-RAW]: ' + qr);
    console.log('[WA-GROUP-FINDER] QR Code necessário:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('[WA-GROUP-FINDER] Cliente pronto. Buscando grupos...');
    const chats = await client.getChats();
    const groups = chats.filter(chat => chat.isGroup);
    
    console.log('\n--- Lista de Grupos Encontrados ---');
    groups.forEach(g => {
        console.log(`- Nome: ${g.name} | ID: ${g.id._serialized}`);
    });
    
    const targetGroup = groups.find(g => g.name.toLowerCase().includes('aquila'));
    
    if (targetGroup) {
        console.log(`\n[MATCH] Grupo encontrado: ${targetGroup.name} (${targetGroup.id._serialized})`);
        console.log('Enviando mensagem de teste...');
        await client.sendMessage(targetGroup.id._serialized, '🤖 Áquila Pro: Teste de integração de Grupo concluído com sucesso!');
        console.log('✅ Mensagem enviada!');
    } else {
        console.log('\n[FAIL] Nenhum grupo com o nome "Aquila" foi encontrado.');
    }
    
    setTimeout(() => process.exit(0), 2000);
});

client.initialize();
