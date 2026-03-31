/**
 * Zero-Debt EventEmitter (Browser & Node compatible)
 * A simple replacement for Node.js 'events' to ensure renderer stability.
 */
export class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);

    // Retorna função de unsubscribe
    return () => this.off(event, listener);
  }

  off(event: string, listener: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      this.listeners.set(event, eventListeners.filter(l => l !== listener));
    }
  }

  emit(event: string, ...args: any[]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(...args));
    }
  }
}
