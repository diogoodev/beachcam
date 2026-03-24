import React, { useState, useMemo } from 'react';
import { ShareSheet } from './ShareSheet';
import { Podium } from './ranking/Podium';
import { RankingList } from './ranking/RankingList';
import { PlayerStatsModal } from './ranking/PlayerStatsModal';

// ---------------------------------------------------------------------------
// Mini helpers for the session calendar
// ---------------------------------------------------------------------------
const MONTHS_PT = ['Jan','Fev','Mar','Apr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DAYS_PT   = ['D','S','T','Q','Q','S','S'];

function buildCalendarDays(year, month) {
  // Returns an array of {day, dateStr} for the full grid (padded with nulls)
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const pad = (n) => String(n).padStart(2, '0');
    cells.push({ day: d, dateStr: `${year}-${pad(month + 1)}-${pad(d)}` });
  }
  return cells;
}

// ---------------------------------------------------------------------------
export function RankingScreen({ rankingRows, matchHistory, todayMatches, todayRanking, todayDuoRanking, calculateDuoRanking }) {
  const [tab, setTab] = useState('today'); // 'today' | 'geral' | 'history' | 'sessoes'
  const [shareData, setShareData] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null); // E-1: head-to-head modal

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD' or null

  // Choose which data source to use based on tab
  const playersSource = tab === 'today' ? todayRanking : rankingRows;
  // 'today' → today's matches only; 'geral' and 'history' both use full matchHistory
  const matchSource = tab === 'today' ? todayMatches : matchHistory;
  
  // Sort players by wins
  const sortedPlayers = [...playersSource].sort((a,b) => b.wins - a.wins);

  // Calcula ranking de duplas a partir do matchHistory (fonte única de verdade) usando a função do hook
  const duoRankings = useMemo(() => calculateDuoRanking(matchSource), [matchSource, calculateDuoRanking]);

  // ── Calendar: build data ──
  const matchDateSet = useMemo(() => {
    const s = new Set();
    matchHistory.forEach(m => {
      if (m.played_at) {
        const d = new Date(m.played_at).toLocaleDateString('sv-SE');
        s.add(d);
      }
    });
    return s;
  }, [matchHistory]);

  const calendarDays = useMemo(() => buildCalendarDays(calYear, calMonth), [calYear, calMonth]);

  const selectedDateMatches = useMemo(() => {
    if (!selectedDate) return [];
    return matchHistory.filter(m => {
      if (!m.played_at) return false;
      return new Date(m.played_at).toLocaleDateString('sv-SE') === selectedDate;
    });
  }, [selectedDate, matchHistory]);

  const selectedDateRanking = useMemo(() => {
    if (!selectedDate || selectedDateMatches.length === 0) return [];
    const stats = {};
    selectedDateMatches.forEach(m => {
      [m.winner_1, m.winner_2].forEach(p => {
        if (!p) return;
        stats[p] = stats[p] || { player_name: p, wins: 0, games: 0 };
        stats[p].wins++; stats[p].games++;
      });
      [m.loser_1, m.loser_2].forEach(p => {
        if (!p) return;
        stats[p] = stats[p] || { player_name: p, wins: 0, games: 0 };
        stats[p].games++;
      });
    });
    return Object.values(stats).sort((a, b) => b.wins - a.wins || (b.wins/b.games || 0) - (a.wins/a.games || 0));
  }, [selectedDate, selectedDateMatches]);

  const selectedDateDuos = useMemo(() => calculateDuoRanking(selectedDateMatches), [selectedDateMatches, calculateDuoRanking]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24 flex flex-col pt-8 text-white relative z-10 w-full max-w-lg mx-auto">
      
      {/* Header */}
      <header className="mb-6 flex flex-col items-center gap-2 relative">
        <div className="absolute top-0 right-0 flex gap-2">
          {tab !== 'history' && tab !== 'sessoes' && playersSource.length > 0 && (
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
          <button 
            onClick={() => setTab('sessoes')}
            className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all ${tab === 'sessoes' ? 'bg-white/20 text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}
          >
            Sessões
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-6">
        
        {/* Jogadores Ranking Card */}
        {tab !== 'history' && tab !== 'sessoes' && (
          <section className="bg-card rounded-[2rem] p-4 shadow-2xl border border-white/5 animate-fadeIn">
            <div className="text-xs font-bold text-neon-green tracking-wide mb-2 px-2">JOGADORES</div>
            {/* UX-9: Empty state for today tab */}
            {sortedPlayers.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="text-4xl">🏖️</span>
                <p className="text-white/50 text-sm">
                  {tab === 'today' ? 'Nenhuma partida registrada hoje.' : 'Nenhuma partida registrada.'}
                </p>
                {tab === 'today' && (
                  <p className="text-white/30 text-xs">Comece uma sessão na aba Sessão!</p>
                )}
              </div>
            ) : (
              <>
                <Podium items={sortedPlayers} isDuo={false} onPlayerClick={setSelectedPlayer} />
                <RankingList items={sortedPlayers} isDuo={false} matchHistory={matchSource} onPlayerClick={setSelectedPlayer} />
              </>
            )}
          </section>
        )}

        {/* Duplas Ranking Card */}
        {tab !== 'history' && tab !== 'sessoes' && (
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

        {/* 📅 Sessões Calendar Tab */}
        {tab === 'sessoes' && (
          <section className="bg-card rounded-[2rem] p-5 shadow-2xl border border-white/5 animate-fadeIn flex flex-col gap-4">
            {/* Month navigator */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="text-sm font-black uppercase tracking-widest">
                {MONTHS_PT[calMonth]} {calYear}
              </span>
              <button
                onClick={nextMonth}
                disabled={calYear === now.getFullYear() && calMonth === now.getMonth()}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAYS_PT.map((d, i) => (
                <div key={i} className="text-[9px] font-bold uppercase text-white/30 py-1">{d}</div>
              ))}
              {calendarDays.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} />;
                const hasMatches = matchDateSet.has(cell.dateStr);
                const isSelected = selectedDate === cell.dateStr;
                const isToday = cell.dateStr === now.toLocaleDateString('sv-SE');
                return (
                  <button
                    key={cell.dateStr}
                    onClick={() => hasMatches ? setSelectedDate(isSelected ? null : cell.dateStr) : undefined}
                    className={`relative rounded-xl py-2 flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[var(--neon-green)] text-black shadow-[0_0_12px_rgba(198,255,0,0.4)]'
                        : hasMatches
                          ? 'bg-white/10 hover:bg-white/20 cursor-pointer active:scale-90'
                          : 'text-white/20 cursor-default'
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${isToday && !isSelected ? 'text-[var(--neon-blue)]' : ''}`}>
                      {cell.day}
                    </span>
                    {hasMatches && !isSelected && (
                      <div className="w-1 h-1 rounded-full bg-[var(--neon-green)] mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day detail */}
            {selectedDate ? (
              <div className="flex flex-col gap-4 mt-2">
                <div className="text-[10px] font-bold text-[var(--neon-green)] uppercase tracking-widest">
                  📅 {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  <span className="text-white/40 ml-2">· {selectedDateMatches.length} partida{selectedDateMatches.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Ranking do dia selecionado */}
                {selectedDateRanking.length > 0 && (
                  <>
                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Jogadores</div>
                    <div className="flex flex-col gap-2">
                      {selectedDateRanking.map((p, i) => (
                        <div key={p.player_name} className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                          <span className="text-[10px] text-white/30 font-bold w-4">#{i+1}</span>
                          <span className="flex-1 text-xs font-bold uppercase tracking-wide truncate">{p.player_name}</span>
                          <span className="text-[var(--neon-green)] font-black text-xs">{p.wins}V</span>
                          <span className="text-white/30 text-[10px]">/{p.games}J</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Partidas</div>
                  </>
                )}

                {/* Partidas do dia selecionado */}
                <div className="flex flex-col gap-2">
                  {selectedDateMatches.map((m, i) => (
                    <div key={m.id ?? i} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[11px] font-black text-[var(--neon-green)] uppercase">
                          {m.winner_1} & {m.winner_2}
                        </div>
                        <div className="text-[9px] text-white/40 font-bold uppercase">
                          vs {m.loser_1} & {m.loser_2}
                        </div>
                      </div>
                      <div className="bg-black/50 px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                        <span className="text-[var(--neon-green)] font-black text-sm">{m.sets_winner}</span>
                        <span className="text-white/30 text-[9px]">x</span>
                        <span className="text-white font-black text-sm">{m.sets_loser}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-white/30 text-xs">
                {matchDateSet.size > 0
                  ? 'Toque em um dia com 🟢 para ver os resultados'
                  : 'Nenhuma sessão registrada ainda.'}
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

      {/* E-1: Head-to-Head modal */}
      {selectedPlayer && (
        <PlayerStatsModal
          player={selectedPlayer}
          matchHistory={matchSource}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
