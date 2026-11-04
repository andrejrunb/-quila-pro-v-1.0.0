import { SovereignMeshService } from '../SovereignMeshService';
import { NexusMeshService } from '../NexusMeshService';
import { NetworkTargetGuard } from '../NetworkTargetGuard';

describe('H-01 Quarentena de Mesh & Defesa Determinística de Rede', () => {
  const originalEnv = process.env.AQUILA_ENABLE_MESH;

  afterEach(() => {
    process.env.AQUILA_ENABLE_MESH = originalEnv;
  });

  describe('1. Quarentena Estrita de Mesh/P2P (Desativação de @libp2p/mdns & private-ip)', () => {
    it('SovereignMeshService não deve inicializar nós ou carregar mDNS quando AQUILA_ENABLE_MESH != true', async () => {
      delete process.env.AQUILA_ENABLE_MESH;
      const meshService = new SovereignMeshService('test-school');
      
      await meshService.init();
      
      expect(meshService.getStatus().active).toBe(false);
      expect((meshService as any).node).toBeNull();
    });

    it('NexusMeshService não deve iniciar libp2p quando AQUILA_ENABLE_MESH != true', async () => {
      delete process.env.AQUILA_ENABLE_MESH;
      const nexus = NexusMeshService.getInstance();
      
      await nexus.start();
      
      expect((nexus as any).node).toBeNull();
    });
  });

  describe('2. Defesa Ativa contra SSRF e Private IP Bypass (GHSA-9h3q-32c7-r533)', () => {
    it('deve interceptar e bloquear tentativas de bypass com formato octal/hex/dword', () => {
      const octal = NetworkTargetGuard.validateTarget('http://0177.0.0.1:8080/admin');
      expect(octal.allowed).toBe(false);
      expect(octal.normalizedIp).toBe('127.0.0.1');

      const hex = NetworkTargetGuard.validateTarget('http://0x7f.0.0.1/flag');
      expect(hex.allowed).toBe(false);
      expect(hex.normalizedIp).toBe('127.0.0.1');

      const dword = NetworkTargetGuard.validateTarget('http://2130706433/internal');
      expect(dword.allowed).toBe(false);
      expect(dword.normalizedIp).toBe('127.0.0.1');
    });

    it('deve bloquear acesso a metadados de nuvem e IP loopback', () => {
      expect(NetworkTargetGuard.validateTarget('169.254.169.254').allowed).toBe(false);
      expect(NetworkTargetGuard.validateTarget('127.0.0.1').allowed).toBe(false);
      expect(NetworkTargetGuard.validateTarget('localhost').allowed).toBe(false);
    });
  });
});
