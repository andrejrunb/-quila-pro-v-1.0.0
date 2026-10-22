import React, { useState } from 'react';

const rewards = [
  { id: 1, title: 'Passe Livre na Cantina', cost: 50, icon: '🍔', description: 'Ganhe um lanche grátis na cantina.' },
  { id: 2, title: 'Ticket Biblioteca', cost: 20, icon: '📚', description: 'Acesso VIP à área de estudos por 1 semana.' },
  { id: 3, title: 'Personalização de Avatar', cost: 100, icon: '🎨', description: 'Desbloqueie cores exclusivas no sistema.' },
  { id: 4, title: 'Isenção de Falta (Justificada)', cost: 500, icon: '🛡️', description: 'Troque por uma justificativa premium.' },
];

export function SovereignStore() {
  const [coins, setCoins] = useState(1250);

  return (
    <div className="min-h-screen p-8 bg-zinc-950 text-white font-sans selection:bg-purple-500/30">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
            Sovereign Store
          </h1>
          <p className="text-zinc-400 mt-2">Troque suas SovereignCoins por recompensas exclusivas.</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <span className="text-xl">🪙</span>
          <span className="text-2xl font-bold text-purple-400">{coins} SC</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rewards.map((reward) => (
          <div 
            key={reward.id} 
            className="group relative flex flex-col p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="text-5xl mb-4 relative z-10">{reward.icon}</div>
            <h2 className="text-xl font-semibold mb-2 relative z-10">{reward.title}</h2>
            <p className="text-zinc-400 text-sm mb-6 flex-grow relative z-10">{reward.description}</p>
            <button className="relative z-10 w-full py-3 rounded-xl bg-white/10 hover:bg-purple-600 transition-colors duration-200 font-medium border border-white/5 shadow-sm">
              Comprar - {reward.cost} SC
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
