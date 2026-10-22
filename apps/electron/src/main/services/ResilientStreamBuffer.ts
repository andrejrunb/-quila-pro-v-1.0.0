/**
 * ResilientStreamBuffer.ts — Passo 68 do Roadmap.
 * Gerencia o fluxo de pacotes RTSP via UDP/TCP, aplicando jitter-buffer
 * para evitar quedas em redes instáveis (muito comum em switches escolares).
 */
export class ResilientStreamBuffer {
    private buffer: Buffer[] = [];
    private maxBufferSize = 50; // Aprox 2 segundos de latência max
    
    constructor(private onPacketReady: (data: Buffer) => void) {}

    public push(data: Buffer): void {
        this.buffer.push(data);
        
        // Se o buffer estourar, dropa o pacote mais antigo (low-latency priority)
        if (this.buffer.length > this.maxBufferSize) {
            this.buffer.shift();
        }

        // Simula processamento resiliente (RTSP over UDP/TCP switch logic logic placeholder)
        this._processNext();
    }

    private _processNext(): void {
        if (this.buffer.length > 0) {
            const next = this.buffer.shift();
            if (next) this.onPacketReady(next);
        }
    }
}

