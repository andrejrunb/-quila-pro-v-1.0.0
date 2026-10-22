import React from 'react';

const rankingData = [
  { rank: 1, name: '3º Ano A', points: 9850, punctuality: '98%', engagement: 'Alto', color: 'from-amber-400 to-yellow-600' },
  { rank: 2, name: '2º Ano B', points: 8420, punctuality: '95%', engagement: 'Médio', color: 'from-zinc-300 to-zinc-500' },
  { rank: 3, name: '1º Ano C', points: 7900, punctuality: '92%', engagement: 'Médio', color: 'from-amber-600 to-orange-800' },
  { rank: 4, name: '3º Ano B', points: 7100, punctuality: '88%', engagement: 'Baixo', color: 'from-purple-500/20 to-purple-500/10' },
  { rank: 5, name: '2º Ano A', points: 6800, punctuality: '85%', engagement: 'Baixo', color: 'from-cyan-500/20 to-cyan-500/10' },
];

export function ClassRanking() {
  return (
    <div className="min-h-screen p-8 bg-zinc-950 text-white font-sans selection:bg-cyan-500/30">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Pódio das Turmas
        </h1>
        <p className="text-zinc-400 mt-2 text-lg">Ranking de engajamento e pontualidade geral.</p>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-end justify-center gap-4 mb-16 h-64">
          {/* Rank 2 */}
          <div className="w-1/4 flex flex-col items-center">
            <div className="text-3xl mb-2">🥈</div>
            <div className="text-lg font-bold mb-2 text-zinc-300">{rankingData[1].name}</div>
            <div className="w-full h-32 bg-gradient-to-t from-zinc-800 to-zinc-700/50 rounded-t-2xl border-t border-x border-white/10 flex justify-center items-start pt-4 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <span className="font-mono text-zinc-300 font-medium">{rankingData[1].points} pts</span>
            </div>
          </div>
          
          {/* Rank 1 */}
          <div className="w-1/3 flex flex-col items-center z-10">
            <div className="text-5xl mb-2 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">👑</div>
            <div className="text-xl font-bold mb-2 text-amber-400">{rankingData[0].name}</div>
            <div className="w-full h-48 bg-gradient-to-t from-zinc-800 to-amber-900/40 rounded-t-2xl border-t border-x border-amber-500/30 flex justify-center items-start pt-4 backdrop-blur-md shadow-[0_0_30px_rgba(251,191,36,0.15)] relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-amber-400/10 to-transparent"></div>
              <span className="font-mono text-amber-300 font-bold text-lg relative z-10">{rankingData[0].points} pts</span>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="w-1/4 flex flex-col items-center">
            <div className="text-3xl mb-2">🥉</div>
            <div className="text-lg font-bold mb-2 text-orange-400">{rankingData[2].name}</div>
            <div className="w-full h-24 bg-gradient-to-t from-zinc-800 to-orange-900/30 rounded-t-2xl border-t border-x border-orange-500/20 flex justify-center items-start pt-4 backdrop-blur-md shadow-[0_0_20px_rgba(234,88,12,0.05)]">
              <span className="font-mono text-orange-300 font-medium">{rankingData[2].points} pts</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {rankingData.map((cls) => (
            <div 
              key={cls.rank} 
              className="flex items-center justify-between p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 hover:border-white/10 hover:bg-white/10 transition-colors duration-300 group"
            >
              <div className="flex items-center gap-6">
                <span className="text-2xl font-black text-zinc-600 w-8 text-center group-hover:text-cyan-500/50 transition-colors">
                  {cls.rank}
                </span>
                <span className="text-xl font-semibold">{cls.name}</span>
              </div>
              
              <div className="flex items-center gap-10">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Pontualidade</span>
                  <span className="text-cyan-400 font-medium">{cls.punctuality}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Engajamento</span>
                  <span className="text-purple-400 font-medium">{cls.engagement}</span>
                </div>
                <div className="w-24 text-right">
                  <span className="font-mono text-lg font-bold text-zinc-200">{cls.points}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
