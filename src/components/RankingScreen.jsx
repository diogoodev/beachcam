import React, { useState, useMemo } from 'react';
import { ShareSheet } from './ShareSheet';
import { Podium } from './ranking/Podium';
import { RankingList } from './ranking/RankingList';

export function RankingScreen({ rankingRows, matchHistory, todayMatches, todayRanking, todayDuoRanking, calculateDuoRanking }) {
  const [tab, setTab] = useState('today'); // 'today' | 'geral' | 'history'
  const [shareData, setShareData] = useState(null); // { type: 'ranking' | 'match', data: any, isDuo: boolean }
  
  // Choose which data source to use based on tab
  const playersSource = tab === 'today' ? todayRanking : rankingRows;
  // 'today' → today's matches only; 'geral' and 'history' both use full matchHistory
  const matchSource = tab === 'today' ? todayMatches : matchHistory;
  
  // Sort players by wins
  const sortedPlayers = [...playersSource].sort((a,b) => b.wins - a.wins);

  // Calcula ranking de duplas a partir do matchHistory (fonte única de verdade) usando a função do hook
  const duoRankings = useMemo(() => calculateDuoRanking(matchSource), [matchSource, calculateDuoRanking]);

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24 flex flex-col pt-8 text-white relative z-10 w-full max-w-lg mx-auto">
      
      {/* Header */}
      <header className="mb-6 flex flex-col items-center gap-2 relative">
        <div className="absolute top-0 right-0 flex gap-2">
          {tab !== 'history' && playersSource.length > 0 && (
            <button 
              onClick={() => setShareData({ type: 'ranking', data: sortedPlayers, isDuo: false, duoData: duoRankings })}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-[var(--neon-blue)] shadow-[0_0_15px_rgba(0,245,255,0.1)]"
              aria-label="Compartilhar Ranking"
            >
              <span className="material-symbols-outlined text-xl">ios_share</span>
            </button>
          )}
        </div>
        
        <h1 className="text-4xl font-black italic tracking-widest text-glow-cyan uppercase">Ranking</h1>
        <span className="material-symbols-outlined crown-icon text-4xl mt-2">workspace_premium</span>
        
        {/* Tabs */}
        <div className="flex bg-black/50 p-1 rounded-full border border-white/10 mt-4 w-full max-w-[340px]">
          <button 
            onClick={() => setTab('today')}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all ${tab === 'today' ? 'bg-white/20 text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}
          >
            Hoje
          </button>
          <button 
            onClick={() => setTab('geral')}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all ${tab === 'geral' ? 'bg-white/20 text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}
          >
            Geral
          </button>
          <button 
            onClick={() => setTab('history')}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all ${tab === 'history' ? 'bg-white/20 text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}
          >
            Histórico
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-6">
        
        {/* Jogadores Ranking Card */}
        {tab !== 'history' && (
          <section className="bg-card rounded-[2rem] p-4 shadow-2xl border border-white/5 animate-fadeIn">
            <div className="text-xs font-bold text-neon-green tracking-wide mb-2 px-2">JOGADORES</div>
            <Podium items={sortedPlayers} isDuo={false} />
            <RankingList items={sortedPlayers} isDuo={false} />
          </section>
        )}

        {/* Duplas Ranking Card */}
        {tab !== 'history' && (
          <section className="bg-card rounded-[2rem] p-4 shadow-2xl border border-white/5 animate-fadeIn">
            <div className="text-xs font-bold text-neon-orange tracking-wide mb-2 px-2">DUPLAS</div>
            <Podium items={duoRankings} isDuo={true} />
            <RankingList items={duoRankings} isDuo={true} />
          </section>
        )}

        {/* Historico Card */}
        {tab === 'history' && (
          <section className="bg-card rounded-[2rem] p-5 shadow-2xl border border-white/5 animate-fadeIn">
            <div className="text-xs font-bold text-white tracking-wide mb-4">HISTÓRICO DE PARTIDAS</div>
            {matchSource.length === 0 ? (
              <div className="text-gray-500 text-sm italic py-2">Nenhuma partida registrada.</div>
            ) : (
            <div className="flex flex-col gap-3">
              {matchSource.map((m, i) => (
                <div key={m.id ?? i} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5 relative group">
                  <div className="flex flex-col gap-1 pr-12">
                    <div className="text-xs font-black text-[var(--neon-green)] flex items-center gap-1 uppercase">
                      <span className="material-symbols-outlined text-[14px]">emoji_events</span>
                      <span>{m.winner_1} <span className="text-[10px] text-white/50 text-normal">&</span> {m.winner_2}</span>
                    </div>
                    <div className="text-[10px] text-gray-sub font-bold uppercase pl-5">
                      VS {m.loser_1} & {m.loser_2}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShareData({ type: 'match', data: m, isDuo: false })}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 active:scale-90 transition-all text-white/50 hover:text-white"
                      title="Compartilhar Resultado"
                    >
                      <span className="material-symbols-outlined text-[16px]">ios_share</span>
                    </button>
                    
                    <div className="bg-black/50 px-3 py-1 rounded-xl border border-white/10 flex items-center gap-1">
                      <span className="text-[var(--neon-green)] font-black text-sm">{m.sets_winner}</span>
                      <span className="text-white/30 text-[10px]">x</span>
                      <span className="text-white font-black text-sm">{m.sets_loser}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </section>
        )}

      </main>
      
      {shareData && (
        <ShareSheet 
          type={shareData.type} 
          data={shareData.data} 
          isDuo={shareData.isDuo} 
          duoData={shareData.duoData || []}
          onClose={() => setShareData(null)} 
        />
      )}
    </div>
  );
}
