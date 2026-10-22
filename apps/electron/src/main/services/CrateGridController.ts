/**
 * Crate-Grid: Logistics Controller
 * Orchestrates replenishment and consumption forecasting for school assets.
 */

import { inventoryVision, StockDetection } from './InventoryVisionService';

export interface ReplenishmentOrder {
  orderId: string;
  itemId: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

class CrateGridController {
  private static instance: CrateGridController;
  private readonly REPLENISH_THRESHOLD = 5;

  private constructor() {}

  public static getInstance(): CrateGridController {
    if (!CrateGridController.instance) {
      CrateGridController.instance = new CrateGridController();
    }
    return CrateGridController.instance;
  }

  /**
   * Evaluates current stock and generates autonomous replenishment triggers.
   */
  public auditStock(): ReplenishmentOrder[] {
    const stock = inventoryVision.getStockSnapshot();
    const orders: ReplenishmentOrder[] = [];

    stock.forEach(item => {
      if (item.count < this.REPLENISH_THRESHOLD) {
        orders.push({
          orderId: `ORD_${Math.random().toString(36).substr(2, 9)}`,
          itemId: item.itemId,
          quantity: 20, // Default batch
          priority: item.count === 0 ? 'critical' : 'high',
          timestamp: new Date().toISOString()
        });
      }
    });

    return orders;
  }
}

export const crateGrid = CrateGridController.getInstance();

