/**
 * pixUtils.ts
 * Utilitários para a economia soberana Áquila Pro.
 * Implementação manual de CRC16-CCITT para garantir zero-dependência externa.
 */

export function calculateCRC16(data: string): string {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < data.length; i++) {
        crc ^= (data.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) ^ polynomial) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formata um campo no padrão TLV (Tag-Length-Value) do EMVCo/PIX.
 */
export function formatTLV(id: string, value: string): string {
    const length = String(value.length).padStart(2, '0');
    return `${id}${length}${value}`;
}
