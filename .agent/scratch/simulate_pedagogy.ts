import { PedagogicalOrchestrator } from '../apps/electron/src/main/services/PedagogicalOrchestrator';
import { Logger } from '../apps/electron/src/main/services/Logger';

// Mocking Dependencies for Simulation
const mockLogger = {
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    error: (msg: string) => console.log(`[ERROR] ${msg}`),
} as any;

const mockDb = {
    saveClassReport: async (data: any) => console.log(`[DB] Salvando Relatório: ${data.id}`),
    get: async (query: string, params: any[]) => {
        if (query.includes('FROM classes')) return { name: '3º Ano A - Matemática' };
        if (query.includes('FROM users')) return { id: 'parent_01', name: 'Sr. João (Pai)', phone: '5511999999999', last_app_interaction: new Date().toISOString() };
        return null;
    },
    all: async (query: string, params: any[]) => {
        if (query.includes('FROM students')) return [{ id: 'stu_01', name: 'Enzo Silva', classId: '3A' }];
        return [];
    },
    getCoordinationUsersByClass: async (id: string) => [{ id: 'coord_01', name: 'Dra. Márcia (Coordenadora)' }],
    getParentUserByStudent: async (id: string) => ({ id: 'parent_01', name: 'Sr. João (Pai)' }),
    logAudit: async (uid: string, type: string, msg: string) => console.log(`[AUDIT] ${type}: ${msg}`),
    run: async (query: string, params: any[]) => console.log(`[DB] Notificação inserida para ${params[4]}`),
} as any;

const mockAudioAI = {
    transcribeLocal: async (path: string) => "Hoje revisamos o teorema de Pitágoras e resolvemos exercícios de triângulos retângulos.",
    summarizePedagogically: async (text: string) => "Aula focada em Geometria Plana (Pitágoras). Alunos demonstraram bom domínio, com destaque para a resolução de problemas práticos.",
} as any;

const mockWhatsApp = {
    sendMessage: async (phone: string, msg: string) => console.log(`[WHATSAPP] Enviando para ${phone}: ${msg.substring(0, 50)}...`),
} as any;

// Execute Simulation
async function simulate() {
    const orchestrator = new PedagogicalOrchestrator(mockDb, mockAudioAI, mockWhatsApp, mockLogger);
    
    console.log("--- SIMULAÇÃO DE RELATÓRIO DE ÁUDIO ÁQUILA PRO ---");
    const result = await orchestrator.processAudioReport(
        "prof_andre", 
        "3A", 
        "SALA_04", 
        "/temp/audio_relatorio_001.m4a"
    );
    
    console.log("\n--- RESULTADO FINAL ---");
    console.log(JSON.stringify(result, null, 2));
}

simulate();
