import { EventEmitter } from 'events';

export interface Wallet {
    userId: string;
    balance: number;
    lastBonusAt: Date;
    transactions: Transaction[];
}

export interface Transaction {
    id: string;
    amount: number;
    reason: string;
    timestamp: Date;
}

/**
 * GamificationService - Eagle Coins v1.0
 * Sistema soberano de recompensas para engajamento escolar.
 */
class GamificationService extends EventEmitter {
    private wallets: Map<string, Wallet> = new Map();

    constructor() {
        super();
        console.log('Eagle Coins Service Iniciado.');
    }

    public getWallet(userId: string): Wallet {
        if (!this.wallets.has(userId)) {
            this.wallets.set(userId, {
                userId,
                balance: 100, // Saldo inicial de boas-vindas
                lastBonusAt: new Date(),
                transactions: []
            });
        }
        return this.wallets.get(userId)!;
    }

    public reward(userId: string, amount: number, reason: string) {
        const wallet = this.getWallet(userId);
        wallet.balance += amount;
        
        const transaction: Transaction = {
            id: `tx-${Date.now()}`,
            amount,
            reason,
            timestamp: new Date()
        };
        
        wallet.transactions.unshift(transaction);
        this.emit('reward', { userId, amount, reason, newBalance: wallet.balance });
        console.log(`[EagleCoins] Reward: ${userId} +${amount} (${reason})`);
    }

    public purchase(userId: string, amount: number, item: string): boolean {
        const wallet = this.getWallet(userId);
        if (wallet.balance < amount) return false;
        
        wallet.balance -= amount;
        wallet.transactions.unshift({
            id: `tx-${Date.now()}`,
            amount: -amount,
            reason: `Compra: ${item}`,
            timestamp: new Date()
        });
        
        this.emit('purchase', { userId, amount, item, newBalance: wallet.balance });
        return true;
    }
}

export const gamificationService = new GamificationService();
