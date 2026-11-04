import { NetworkTargetGuard } from '../NetworkTargetGuard';

describe('NetworkTargetGuard (Mitigação GHSA-9h3q-32c7-r533 / SSRF)', () => {
  describe('Detecção e Bloqueio de Representações Alternativas de IPv4', () => {
    it('deve normalizar e bloquear IPv4 em octal (0177.0.0.1 -> 127.0.0.1)', () => {
      const res = NetworkTargetGuard.validateTarget('0177.0.0.1');
      expect(res.allowed).toBe(false);
      expect(res.normalizedIp).toBe('127.0.0.1');
    });

    it('deve normalizar e bloquear IPv4 em hexadecimal (0x7f.0x0.0x0.0x1 -> 127.0.0.1)', () => {
      const res = NetworkTargetGuard.validateTarget('0x7f.0x00.0x00.0x01');
      expect(res.allowed).toBe(false);
      expect(res.normalizedIp).toBe('127.0.0.1');
    });

    it('deve normalizar e bloquear IPv4 em formato dword (2130706433 -> 127.0.0.1)', () => {
      const res = NetworkTargetGuard.validateTarget('2130706433');
      expect(res.allowed).toBe(false);
      expect(res.normalizedIp).toBe('127.0.0.1');
    });

    it('deve bloquear metadados de nuvem AWS/GCP/Azure (169.254.169.254)', () => {
      const res = NetworkTargetGuard.validateTarget('http://169.254.169.254/latest/meta-data/');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('Link Local / Cloud Metadata');
    });

    it('deve bloquear metadados via hostnames internos conhecidos', () => {
      const resGCP = NetworkTargetGuard.validateTarget('http://metadata.google.internal/computeMetadata/v1/');
      expect(resGCP.allowed).toBe(false);

      const resAWS = NetworkTargetGuard.validateTarget('http://instance-data/latest/');
      expect(resAWS.allowed).toBe(false);
    });

    it('deve bloquear faixa 0.0.0.0/8', () => {
      const res = NetworkTargetGuard.validateTarget('0.0.0.0');
      expect(res.allowed).toBe(false);
    });
  });

  describe('Políticas de Acesso em Ambiente Escolar', () => {
    it('deve bloquear IPs privados (192.168.1.10) por padrão quando allowSchoolLan = false', () => {
      const res = NetworkTargetGuard.validateTarget('http://192.168.1.10:8080/api');
      expect(res.allowed).toBe(false);
    });

    it('deve permitir IPs da LAN escolar (192.168.1.10) quando allowSchoolLan = true', () => {
      const res = NetworkTargetGuard.validateTarget('http://192.168.1.10:8080/api', true);
      expect(res.allowed).toBe(true);
      expect(res.normalizedIp).toBe('192.168.1.10');
    });

    it('deve permitir IPs públicos legítimos (ex: 8.8.8.8 ou 1.1.1.1)', () => {
      const res = NetworkTargetGuard.validateTarget('https://8.8.8.8/dns-query');
      expect(res.allowed).toBe(true);
      expect(res.normalizedIp).toBe('8.8.8.8');
    });

    it('deve permitir domínios públicos válidos', () => {
      const res = NetworkTargetGuard.validateTarget('https://api.aquilapro.dev/status');
      expect(res.allowed).toBe(true);
    });
  });
});
