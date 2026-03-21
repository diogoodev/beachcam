import React, { useMemo, useEffect } from 'react';
import { getInitials } from '../../utils/helpers';

/**
 * E-1: Head-to-Head player stats modal.
 * Shows a clicked player's win rate against every opponent they faced.
 */
export function PlayerStatsModal({ player, matchHistory = [], onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Build head-to-head stats from match history
  const h2h = useMemo(() => {
    const map = {}; // opponent → { wins, losses }

    for (const m of matchHistory) {
      const isWinner = m.winner_1 === player || m.winner_2 === player;
      const isLoser  = m.loser_1  === player || m.loser_2  === player;
      if (!isWinner && !isLoser) continue;

      const opponents = isWinner
        ? [m.loser_1, m.loser_2].filter(Boolean)
        : [m.winner_1, m.winner_2].filter(Boolean);

      for (const opp of opponents) {
        if (!map[opp]) map[opp] = { wins: 0, losses: 0 };
        if (isWinner) map[opp].wins++;
        else          map[opp].losses++;
      }
    }

    return Object.entries(map)
      .map(([name, { wins, losses }]) => ({
        name,
        wins,
        losses,
        games: wins + losses,
        rate: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
      }))
      .sort((a, b) => b.games - a.games); // most-played first
  }, [player, matchHistory]);

  // Overall stats
  const totalWins   = h2h.reduce((s, r) => s + r.wins,   0);
  const totalLosses = h2h.reduce((s, r) => s + r.losses, 0);
  const totalGames  = totalWins + totalLosses;
  const overallRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--surface-1)] border-t border-[var(--neon-blue)]/20 rounded-t-3xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-[101] shadow-[0_-10px_40px_rgba(0,245,255,0.1)] max-h-[85vh] overflow-y-auto">
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        {/* Player header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full border-2 border-[var(--neon-green)] flex items-center justify-center bg-[var(--neon-green)]/10 text-[var(--neon-green)] text-xl font-black shadow-[0_0_20px_rgba(198,255,0,0.2)]">
            {getInitials(player)}
          </div>
          <div>
            <div className="text-xl font-black uppercase tracking-widest text-white">{player.split(' ')[0]}</div>
            <div className="text-xs text-white/50 font-bold uppercase tracking-wider">{player}</div>
          </div>
          <button onClick={onClose} className="ml-auto bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
            <span className="material-symbols-outlined text-sm text-white/50">close</span>
          </button>
        </div>

        {/* Overall summary bar */}
        <div className="flex gap-3 mb-5">
          {[
            { label: 'Vitórias', value: totalWins, color: 'text-[var(--neon-green)]' },
            { label: 'Derrotas', value: totalLosses, color: 'text-red-400' },
            { label: 'Partidas', value: totalGames, color: 'text-white' },
            { label: 'Taxa', value: `${overallRate}%`, color: 'text-[var(--neon-blue)]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center gap-0.5">
              <div className={`text-lg font-black ${color}`}>{value}</div>
              <div className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* Head-to-head list */}
        <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-3">
          Head-to-Head
        </div>

        {h2h.length === 0 ? (
          <div className="text-center text-white/30 text-sm py-6 italic">Nenhuma partida registrada ainda.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {h2h.map(({ name, wins, losses, games, rate }) => (
              <div key={name} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-3">
                <div className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center bg-white/5 text-white text-xs font-bold shrink-0">
                  {getInitials(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white uppercase truncate">{name.split(' ')[0]}</div>
                  <div className="text-[10px] text-white/40 font-bold">{wins}V – {losses}D · {games} jogos</div>
                </div>
                {/* Win rate bar */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className={`text-sm font-black ${rate >= 50 ? 'text-[var(--neon-green)]' : 'text-red-400'}`}>{rate}%</div>
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${rate >= 50 ? 'bg-[var(--neon-green)]' : 'bg-red-400'}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
