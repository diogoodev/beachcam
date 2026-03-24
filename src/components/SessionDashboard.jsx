import React from 'react';
import { SetupScreen } from './SetupScreen';
import { RotationScreen } from './RotationScreen';

/**
 * SessionDashboard — renders the non-game views for the Sessão tab.
 * App.jsx handles routing to GameScreen when h.screen === 'game'.
 * This component only needs to decide between SetupScreen and RotationScreen.
 */
export function SessionDashboard(props) {
  const { teamA, teamB } = props;

  // A match is "active" (has teams on court) — show rotation status
  const isMatchActive = Array.isArray(teamA) && teamA.length > 0
                     && Array.isArray(teamB) && teamB.length > 0;

  const {
    players, addPlayer, removePlayer,
    setTeamA, setTeamB, bench, setBench, startGame,
    setsA, setsB, sortedBench, gamesPlayed, rankingRows,
    setScreen, reorderBench, endSession,
    removePlayerFromBench, promotePlayersToNext, addPlayerMidGame,
  } = props;

  if (isMatchActive) {
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
