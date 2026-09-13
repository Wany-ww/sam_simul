import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { RoomPlayer } from '@sam-simul/shared';
import { useGameStore } from '../../state/gameStore';
import { useRoomStore } from '../../state/roomStore';
import { ArmiesPanel } from './ArmiesPanel';
import { CityOverview } from './CityOverview';
import { GeneralsPanel } from './GeneralsPanel';
import { MapView } from './MapView';
import { OrderForm } from './OrderForm';
import { TurnLogPanel } from './TurnLogPanel';

const NO_PLAYERS: RoomPlayer[] = [];

export function GameScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const playerId = useRoomStore((s) => s.playerId);
  // A stable fallback reference matters here: returning a fresh `[]` on every
  // call (e.g. `?? []`) makes Zustand's snapshot look like it changes on
  // every render, which starves out into "Maximum update depth exceeded" --
  // hit in practice by reloading the page while sitting on this route with
  // no currentRoom loaded yet (fresh session, or mid-game reconnect).
  const roomPlayers = useRoomStore((s) => s.currentRoom?.players ?? NO_PLAYERS);
  const gameState = useGameStore((s) => s.gameState);
  const hasSubmittedThisTurn = useGameStore((s) => s.hasSubmittedThisTurn);
  const markSubmitted = useGameStore((s) => s.markSubmitted);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!playerId) navigate('/');
  }, [playerId, navigate]);

  useEffect(() => {
    if (!gameState) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.round((gameState.turnEndsAt - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [gameState?.turnEndsAt]);

  if (!gameState || gameState.roomId !== roomId) {
    return (
      <div className="screen screen-centered">
        <p>게임 정보를 불러오는 중...</p>
      </div>
    );
  }

  const myCity = gameState.cities.find((c) => c.ownerId === playerId);
  const myArmies = gameState.armies.filter((a) => a.ownerId === playerId);
  const myLastTurnLog = gameState.lastTurnLog.find((l) => l.playerId === playerId);
  const submittedCount = gameState.submittedPlayerIds.length;
  const totalCount = gameState.cities.length;

  return (
    <div className="screen game-screen">
      <header className="room-header">
        <h1>턴 {gameState.turnNumber}</h1>
        <span className={secondsLeft <= 30 ? 'error-text' : 'muted'}>
          남은 시간: {secondsLeft}초 · 제출 완료 {submittedCount}/{totalCount}명
          {hasSubmittedThisTurn && <span className="submitted-badge">✓ 제출함</span>}
        </span>
      </header>

      <TurnLogPanel entry={myLastTurnLog} />

      {myCity && (
        <div className="game-primary">
          <MapView cities={gameState.cities} armies={gameState.armies} players={roomPlayers} myPlayerId={playerId} />
          <div className="order-form-scroll">
            <OrderForm roomId={gameState.roomId} city={myCity} armies={myArmies} actionPointsPerTurn={gameState.actionPointsPerTurn} disabled={hasSubmittedThisTurn} onSubmit={markSubmitted} />
          </div>
        </div>
      )}

      {myCity && (
        <div className="game-secondary">
          <CityOverview city={myCity} />
          <ArmiesPanel armies={myArmies} />
          <GeneralsPanel generals={myCity.generals} />
        </div>
      )}
    </div>
  );
}
