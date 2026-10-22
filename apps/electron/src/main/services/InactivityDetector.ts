/**
 * InactivityDetector.ts — Passo 85 do Roadmap.
 * Monitora alunos que não foram detectados por nenhuma câmera por um longo período.
 * Essencial para detectar se alguém ficou trancado em uma sala ou área isolada.
 */
export class InactivityDetector {
    private thresholdMinutes: number = 60;

    /**
     * Verifica alunos "desaparecidos" no banco local.
     */
    public async checkMissingStudents(db: any): Promise<any[]> {
        const thresholdDate = new Date();
        thresholdDate.setMinutes(thresholdDate.getMinutes() - this.thresholdMinutes);

        console.log(`[InactivityDetector] Buscando alunos sem rastro desde: ${thresholdDate.toLocaleTimeString()}`);
        
        // Simulação: Busca no banco quem foi visto pela última vez antes do threshold
        return [
            { id: 'std-99', name: 'Joãozinho Silva', lastSeen: '07:45 AM', zone: 'Entrada' }
        ];
    }
}

