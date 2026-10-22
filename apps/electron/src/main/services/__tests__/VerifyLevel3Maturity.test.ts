import { locationIntelligenceService } from '../LocationIntelligenceService';
import { IdentityRecaptureService } from '../IdentityRecaptureService';

describe('Áquila Pro — Maturity Level 3 Validation', () => {
  
  describe('Location Intelligence (Haversine)', () => {
    it('should calculate precise distance between two points (v3520)', () => {
      const p1 = { lat: -23.5505, lon: -46.6333 }; // São Paulo
      const p2 = { lat: -23.5515, lon: -46.6343 }; // ~150m de distância
      
      const distance = locationIntelligenceService.calculateDistance(p1, p2);
      console.log(`[TEST] Distance: ${distance.toFixed(2)}m`);
      
      expect(distance).toBeGreaterThan(100);
      expect(distance).toBeLessThan(200);
    });

    it('should calculate correct ETA for parent arriving', () => {
      const distance = 1000; // 1km
      const speed = 30; // 30km/h
      const eta = locationIntelligenceService.calculateETA(distance, speed);
      
      expect(eta).toBe(2); // 1000m / (30000/60) = 2 min
    });
  });

  describe('Identity Recapture (Autonomous Evolution)', () => {
    it('should refine embeddings using moving average (v3511)', () => {
      const oldEmbedding = new Array(128).fill(0.1);
      const newEmbedding = new Array(128).fill(0.2);
      const alpha = 0.2;
      
      // No Nível 3, usamos a média aritmética do pool de embeddings (0.1 + 0.2) / 2 = 0.15
      const expectedValue = 0.15;
      
      // @ts-ignore (Acessando método privado para teste unitário)
      const service = new IdentityRecaptureService();
      const refined = (service as any).calculateRefinedEmbedding([oldEmbedding, newEmbedding]);
      
      expect(refined[0]).toBeCloseTo(expectedValue);
    });
  });
});
