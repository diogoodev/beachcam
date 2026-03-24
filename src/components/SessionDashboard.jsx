import React from 'react';
import { SetupScreen } from './SetupScreen';
import { RotationScreen } from './RotationScreen';

export function SessionDashboard(props) {
  const { teamA, screen } = props;
  // Use screen === 'game' as the true signal that a match started.
  // Using teamA.length > 0 caused SessionDashboard to intercept mid-way
  // through manual team selection in SetupScreen Step 1.
  const isSessionActive = screen === 'game' || (Array.isArray(teamA) && teamA.length > 0 && Array.isArray(props.teamB) && props.teamB.length > 0);
  // A match is "active" only when both teams are fully formed (not just navigated away)
  const isMatchActive = Array.isArray(teamA) && teamA.length > 0 && Array.isArray(props.teamB) && props.teamB.length > 0;

  // Extract only what each screen needs, avoiding prop pollution
  const {
    players, addPlayer, removePlayer,
    setTeamA, teamB, setTeamB, bench, setBench, startGame,
    setsA, setsB, sortedBench, gamesPlayed, rankingRows,
    setScreen, reorderBench, endSession,
    removePlayerFromBench, promotePlayersToNext, addPlayerMidGame,
  } = props;

  if (isSessionActive) {
    return (
      <RotationScreen
        teamA={teamA} teamB={teamB} setsA={setsA} setsB={setsB}
        bench={bench} sortedBench={sortedBench}
        gamesPlayed={gamesPlayed} rankingRows={rankingRows}
        setScreen={setScreen} reorderBench={reorderBench} endSession={endSession}
        removePlayerFromBench={removePlayerFromBench}
        promotePlayersToNext={promotePlayersToNext}
        addPlayerMidGame={addPlayerMidGame}
        players={players}
        isMatchActive={isMatchActive}
      />
    );
  }
  
  return (
    <SetupScreen
      players={players} addPlayer={addPlayer} removePlayer={removePlayer}
      teamA={teamA} setTeamA={setTeamA} teamB={teamB} setTeamB={setTeamB}
      bench={bench} setBench={setBench} startGame={startGame}
      rankingRows={rankingRows}
    />
  );
}
