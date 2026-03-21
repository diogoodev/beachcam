import React from 'react';
import { SetupScreen } from './SetupScreen';
import { RotationScreen } from './RotationScreen';

export function SessionDashboard(props) {
  const { teamA } = props;
  const isSessionActive = Array.isArray(teamA) && teamA.length > 0;

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
      />
    );
  }
  
  return (
    <SetupScreen
      players={players} addPlayer={addPlayer} removePlayer={removePlayer}
      teamA={teamA} setTeamA={setTeamA} teamB={teamB} setTeamB={setTeamB}
      bench={bench} setBench={setBench} startGame={startGame}
    />
  );
}
