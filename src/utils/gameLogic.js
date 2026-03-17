export const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
};

/**
 * Shared bench sorting: prioritizes players who have waited the longest,
 * then by fewest games played.
 */
export function sortBenchPlayers(bench, benchSince, gamesPlayed) {
  return [...bench].sort((a, b) => {
    const d = (benchSince[b] ?? 0) - (benchSince[a] ?? 0);
    return d !== 0 ? d : (gamesPlayed[a] ?? 0) - (gamesPlayed[b] ?? 0);
  });
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickNextFour(winners, losers, bench, gamesPlayed, benchSince) {
  const sortedBench = sortBenchPlayers(bench, benchSince, gamesPlayed);
  const [w1, w2] = winners;
  const benchSize = bench.length;
  const winnersCanStay = benchSize < 2 ||
    ((benchSince[w1] ?? 0) < benchSize && (benchSince[w2] ?? 0) < benchSize);

  let nextTeamA, nextTeamB, nextBench;
  if (winnersCanStay && benchSize >= 2) {
    nextTeamA = winners; nextTeamB = sortedBench.slice(0, 2);
    nextBench = [...sortedBench.slice(2), ...losers];
  } else if (winnersCanStay && benchSize === 1) {
    nextTeamA = winners; nextTeamB = [sortedBench[0], losers[0]];
    nextBench = [losers[1]];
  } else if (winnersCanStay && benchSize === 0) {
    nextTeamA = winners; nextTeamB = losers; nextBench = [];
  } else {
    if (benchSize >= 2) {
      nextTeamA = sortedBench.slice(0, 2); nextTeamB = [...losers];
      nextBench = [...sortedBench.slice(2), ...winners];
    } else {
      const ws = [...winners].sort((a, b) => (benchSince[b] ?? 0) - (benchSince[a] ?? 0));
      nextTeamA = [sortedBench[0] ?? ws[0], losers[0]];
      nextTeamB = [sortedBench[1] ?? ws[1], losers[1]];
      nextBench = [];
    }
  }
  const playing = new Set([...nextTeamA, ...nextTeamB]);
  nextBench = [...new Set(nextBench.filter(p => !playing.has(p)))];
  return { nextTeamA, nextTeamB, nextBench };
}

export function updateStats(gamesPlayed, benchSince, nextTeamA, nextTeamB, nextBench) {
  const newGP = { ...gamesPlayed }, newBS = { ...benchSince };
  for (const p of [...nextTeamA, ...nextTeamB]) { newGP[p] = (newGP[p] ?? 0) + 1; newBS[p] = 0; }
  for (const p of nextBench) { newBS[p] = (newBS[p] ?? 0) + 1; }
  return { newGP, newBS };
}
