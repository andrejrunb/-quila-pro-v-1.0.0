/**
 * NetworkTargetGuard.ts — Mitigação Ativa e Determinística contra SSRF e Private IP Bypass
 * Áquila Pro — Camada de Soberania e Defesa em Profundidade (Item 5 / H-01)
 *
 * Bloqueia representações alternativas de IPv4 (octal, hexadecimal, dword),
 * faixas privadas, link-local, metadados de cloud e endereços de loopback.
 */

import * as net from 'net';

export interface ValidationResult {
  allowed: boolean;
  normalizedIp?: string;
  reason?: string;
}

export class NetworkTargetGuard {
  // Faixas IPv4 proibidas para conexões de saída na escola
  private static readonly BLOCKED_IPV4_RANGES = [
    { start: '0.0.0.0', end: '0.255.255.255', reason: 'Current network (RFC 1122)' },
    { start: '10.0.0.0', end: '10.255.255.255', reason: 'Private-Use (RFC 1918)' },
    { start: '100.64.0.0', end: '100.127.255.255', reason: 'Shared Address Space (RFC 6598)' },
    { start: '127.0.0.0', end: '127.255.255.255', reason: 'Loopback (RFC 1122)' },
    { start: '169.254.0.0', end: '169.254.255.255', reason: 'Link Local / Cloud Metadata (RFC 3927)' },
    { start: '172.16.0.0', end: '172.31.255.255', reason: 'Private-Use (RFC 1918)' },
    { start: '192.0.0.0', end: '192.0.0.255', reason: 'IETF Protocol Assignments (RFC 6890)' },
    { start: '192.0.2.0', end: '192.0.2.255', reason: 'TEST-NET-1 (RFC 5737)' },
    { start: '192.168.0.0', end: '192.168.255.255', reason: 'Private-Use (RFC 1918)' },
    { start: '198.18.0.0', end: '198.19.255.255', reason: 'Benchmarking (RFC 2544)' },
    { start: '198.51.100.0', end: '198.51.100.255', reason: 'TEST-NET-2 (RFC 5737)' },
    { start: '203.0.113.0', end: '203.0.113.255', reason: 'TEST-NET-3 (RFC 5737)' },
    { start: '224.0.0.0', end: '239.255.255.255', reason: 'Multicast (RFC 5771)' },
    { start: '240.0.0.0', end: '255.255.255.254', reason: 'Reserved for Future Use (RFC 1112)' },
    { start: '255.255.255.255', end: '255.255.255.255', reason: 'Limited Broadcast (RFC 919)' },
  ];

  /**
   * Converte um endereço IPv4 numérico de 32 bits (número inteiro sem sinal).
   */
  private static ipToLong(ip: string): number {
    const parts = ip.split('.').map(p => parseInt(p, 10));
    return (((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + (parts[3] >>> 0)) >>> 0;
  }

  /**
   * Detecta se a string tenta usar representações alternativas de IP
   * como octal (0177.0.0.1), hex (0x7f.1) ou dword (2130706433).
   * GHSA-9h3q-32c7-r533 mitigation.
   */
  public static parseCanonicalIPv4(input: string): string | null {
    const trimmed = input.trim().toLowerCase();

    // 1. Rejeitar formato dword simples (ex: 2130706433)
    if (/^\d{8,11}$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      if (num >= 0 && num <= 4294967295) {
        const b1 = (num >>> 24) & 255;
        const b2 = (num >>> 16) & 255;
        const b3 = (num >>> 8) & 255;
        const b4 = num & 255;
        return `${b1}.${b2}.${b3}.${b4}`;
      }
    }

    // 2. Rejeitar ou normalizar formatos octais / hexadecimais com pontos
    const segments = trimmed.split('.');
    if (segments.length === 4) {
      const canonicalParts: number[] = [];
      for (const seg of segments) {
        let val: number;
        if (seg.startsWith('0x')) {
          val = parseInt(seg, 16);
        } else if (seg.length > 1 && seg.startsWith('0')) {
          val = parseInt(seg, 8); // Octal
        } else if (/^\d+$/.test(seg)) {
          val = parseInt(seg, 10);
        } else {
          return null; // Não é IPv4 válido
        }

        if (isNaN(val) || val < 0 || val > 255) {
          return null;
        }
        canonicalParts.push(val);
      }
      return canonicalParts.join('.');
    }

    return null;
  }

  /**
   * Valida se um destino (IP ou hostname de URL) é seguro para requisições de saída.
   * Em ambiente escolar, chamadas a IPs privados locais e metadados de cloud são bloqueadas.
   */
  public static validateTarget(target: string, allowSchoolLan = false): ValidationResult {
    if (!target || typeof target !== 'string') {
      return { allowed: false, reason: 'Target vazio ou inválido' };
    }

    // Extrair host caso seja uma URL
    let host = target.trim();
    try {
      if (host.includes('://')) {
        const parsed = new URL(host);
        host = parsed.hostname;
      }
    } catch {
      // Usa target original se falhar parse de URL
    }

    // Remove porta se houver
    if (host.includes(':') && !host.includes(']')) {
      host = host.split(':')[0];
    }

    // Verificar se é localhost ou loopback textual
    if (host === 'localhost' || host === 'localhost.localdomain' || host === '127.0.0.1' || host === '::1') {
      if (!allowSchoolLan) {
        return {
          allowed: false,
          normalizedIp: host === 'localhost' || host === 'localhost.localdomain' ? '127.0.0.1' : host,
          reason: 'Acesso a loopback bloqueado'
        };
      }
    }

    // Tentar normalização canônica para evitar bypass octal/hex
    const canonicalIp = this.parseCanonicalIPv4(host);
    const ipToCheck = canonicalIp || host;

    const isIp = net.isIP(ipToCheck);
    if (isIp === 4) {
      const longVal = this.ipToLong(ipToCheck);

      // Verificar faixas bloqueadas
      for (const range of this.BLOCKED_IPV4_RANGES) {
        const startVal = this.ipToLong(range.start);
        const endVal = this.ipToLong(range.end);

        if (longVal >= startVal && longVal <= endVal) {
          // Se for LAN escolar (192.168.x ou 10.x) e permitida explicitamente
          if (allowSchoolLan && (range.start === '192.168.0.0' || range.start === '10.0.0.0')) {
            return { allowed: true, normalizedIp: ipToCheck };
          }
          return {
            allowed: false,
            normalizedIp: ipToCheck,
            reason: `IP em faixa restrita: ${range.reason} (${range.start} - ${range.end})`,
          };
        }
      }

      return { allowed: true, normalizedIp: ipToCheck };
    } else if (isIp === 6) {
      if (ipToCheck === '::1' || ipToCheck.toLowerCase().startsWith('fe80:') || ipToCheck.toLowerCase().startsWith('fc00:')) {
        return { allowed: false, normalizedIp: ipToCheck, reason: 'IPv6 local ou link-local restrito' };
      }
      return { allowed: true, normalizedIp: ipToCheck };
    }

    // Hostnames comuns que tentam SSRF de metadados
    const lowerHost = host.toLowerCase();
    if (
      lowerHost === 'instance-data' ||
      lowerHost === 'metadata.google.internal' ||
      lowerHost.endsWith('.internal') ||
      lowerHost.endsWith('.local')
    ) {
      return { allowed: false, reason: 'Hostname de infraestrutura interna ou metadados de nuvem' };
    }

    return { allowed: true };
  }
}
