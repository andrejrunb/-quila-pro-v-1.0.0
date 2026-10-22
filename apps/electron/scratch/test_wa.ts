import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

console.log('[WA-TEST] Inicializando cliente WhatsApp...');

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
    console.log('[WA-TEST] QR Code gerado (Sessão expirada ou não autenticada):');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('[WA-TEST] Cliente conectado e pronto!');
    const target = '120363425999976493@g.us'; // Grupo 'Aquila' mestre
    const message = `🦅 *RELATÓRIO MESTRE: ECOSSISTEMA ÁQUILA PRO v1.3.4* 💎

Olá, este é o resumo completo das interfaces e funções operacionais do sistema.

---
🖥️ *PORTAIS E SOFTWARES*
- *Áquila Pro Core (Desktop):* Gestão de licenças, IA e auditoria (Admin).
- *Áquila SOC (Command Center):* Monitoramento em tempo real e Biometria 3D.
- *Portal da Secretaria:* Matrículas, gestão de contatos e mensageria.
- *Edu Science Hub:* Chamada inteligente e resumos de aula (Docentes).
- *Centro de Coordenação:* Gestão disciplinar e alertas de risco.

📱 *APLICATIVOS E MOBILE*
- *Áquila Pais APP:* Recebimento de alertas e relatório pedagógico IA.
- *Áquila Aluno (RPG):*Notas, faltas e desafios gamificados.
- *Scanner de Biometria:* Captura de faces em Totems/Portaria.

📈 *FUNÇÕES OPERACIONAIS (FOGO REAL)*
✅ *Feed de Inteligência:* Agora exibe dados REAIS de presença e estudos.
✅ *Gamificação:* XP e Moedas Áquila agora são persistidos no banco de dados.
✅ *Ponte WhatsApp:* Notificações para pais totalmente integradas e ativas.
✅ *Audio Engine:* Geração e histórico de Podcasts educacionais funcional.

A soberania operacional do Áquila Pro atingiu 100%. Sistema pronto para a rotina escolar. ✅`;
    
    console.log(`[WA-TEST] Enviando Relatório Mestre para o grupo ${target}...`);
    
    client.sendMessage(target, message)
        .then(() => {
            console.log('[WA-TEST] ✅ RELATÓRIO ENVIADO COM SUCESSO!');
            setTimeout(() => process.exit(0), 3000);
        })
        .catch(err => {
            console.error('[WA-TEST] ❌ FALHA AO ENVIAR:', err);
            process.exit(1);
        });
});

client.on('auth_failure', (msg) => {
    console.error('[WA-TEST] ❌ Falha na autenticação:', msg);
    process.exit(1);
});

client.initialize();
