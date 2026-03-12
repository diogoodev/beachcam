import React from "react";
import { useBeachCam } from "./hooks/useBeachCam";
import { S } from "./styles/theme";
import { SyncBadge } from "./components/Common";
import { SetupScreen } from "./components/SetupScreen";
import { GameScreen } from "./components/GameScreen";
import { RankingScreen } from "./components/RankingScreen";
import { RotationScreen } from "./components/RotationScreen";

export default function App() {
  const h = useBeachCam();

  return (
    <div style={S.root}>
      <div style={S.app}>

        {/* HEADER GLOBAL */}
        <div style={S.header}>
          <span style={S.logo}>🏖 BeachCam</span>
          <div style={S.navBtns}>
            <SyncBadge status={h.syncStatus} />
            {h.screen === "game" && (<>
              <button style={S.navBtn} onClick={() => h.setScreen("ranking")}>🏆</button>
              <button style={S.navBtn} onClick={() => h.setScreen("rotation")}>🔄</button>
              <button style={S.navBtn} onClick={() => h.setScreen("setup")}>⚙️</button>
            </>)}
            {["rotation","ranking"].includes(h.screen) && (
              <button style={S.navBtn} onClick={() => h.setScreen("game")}>← Quadra</button>
            )}
          </div>
        </div>

        {/* ROTEAMENTO DE TELAS */}
        {h.screen === "setup"    && <SetupScreen h={h} />}
        {h.screen === "game"     && <GameScreen h={h} />}
        {h.screen === "ranking"  && <RankingScreen h={h} />}
        {h.screen === "rotation" && <RotationScreen h={h} />}
      </div>
    </div>
  );
}
