import * as fs from 'fs';
import * as path from 'path';

const mainPath = 'c:/aquila/apps/electron/src/main.ts';

function auditMainIntegrity() {
    console.log('--- AUDITORIA DE INTEGRIDADE ÁQUILA PRO v4002-Elite ---');
    if (!fs.existsSync(mainPath)) {
        console.error('ERRO: main.ts não encontrado!');
        return;
    }

    const content = fs.readFileSync(mainPath, 'utf-8');
    const lines = content.split('\n');

    const handlers = new Map<string, number[]>();
    const ipcOn = new Map<string, number[]>();

    const handleRegex = /ipcMain\.handle\(['"](.+?)['"]/g;
    const onRegex = /ipcMain\.on\(['"](.+?)['"]/g;

    let match;
    while ((match = handleRegex.exec(content)) !== null) {
        const event = match[1];
        const line = content.substring(0, match.index).split('\n').length;
        if (!handlers.has(event)) handlers.set(event, []);
        handlers.get(event)!.push(line);
    }

    while ((match = onRegex.exec(content)) !== null) {
        const event = match[1];
        const line = content.substring(0, match.index).split('\n').length;
        if (!ipcOn.has(event)) ipcOn.set(event, []);
        ipcOn.get(event)!.push(line);
    }

    console.log('\n- Verificando Handlers Duplicados (ipcMain.handle)...');
    let hasConflicts = false;
    handlers.forEach((lines, event) => {
        if (lines.length > 1) {
            console.error(`- CONFLITO: Handler '${event}' definido múltiplas vezes nas linhas: ${lines.join(', ')}`);
            hasConflicts = true;
        }
    });

    if (!hasConflicts) console.log('  OK: Nenhum conflito de handle detectado.');

    console.log('\n- Verificando IPC Listeners (ipcMain.on)...');
    ipcOn.forEach((lines, event) => {
        if (lines.length > 1) {
            console.warn(`- ALERTA: Listener '${event}' definido múltiplas vezes nas linhas: ${lines.join(', ')}. Isso pode causar vazamento de memória se não houver cleanup.`);
        }
    });

    console.log('\n--- FIM DA AUDITORIA ---');
}

auditMainIntegrity();
