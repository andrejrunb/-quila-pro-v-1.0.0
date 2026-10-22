/**
 * Crate-Grid: Inventory Vision Service
 * Automates physical stock tracking via NPU-accelerated computer vision.
 */

export interface StockDetection {
  itemId: string;
  name: string;
  count: number;
  confidence: number;
  lastDetected: string;
  zone: 'pantry' | 'storage_a' | 'storage_b';
}

class InventoryVisionService {
  private static instance: InventoryVisionService;
  private currentStock: Map<string, StockDetection> = new Map();

  private constructor() {}

  public static getInstance(): InventoryVisionService {
    if (!InventoryVisionService.instance) {
      InventoryVisionService.instance = new InventoryVisionService();
    }
    return InventoryVisionService.instance;
  }

  /**
   * Processes a frame from a specific zone to detect items.
   * In production, this bridges to the Python NPU worker.
   */
  public async processZoneStream(zone: string): Promise<StockDetection[]> {
    // Mocking CV detection results
    const detections: StockDetection[] = [
      { itemId: 'mat_001', name: 'A4 Paper Reams', count: 12, confidence: 0.98, lastDetected: new Date().toISOString(), zone: 'storage_a' },
      { itemId: 'fnb_002', name: 'Organic Milk Cartons', count: 4, confidence: 0.94, lastDetected: new Date().toISOString(), zone: 'pantry' },
    ];

    detections.forEach(d => this.currentStock.set(d.itemId, d));
    return detections;
  }

  public getStockSnapshot(): StockDetection[] {
    return Array.from(this.currentStock.values());
  }
}

export const inventoryVision = InventoryVisionService.getInstance();

