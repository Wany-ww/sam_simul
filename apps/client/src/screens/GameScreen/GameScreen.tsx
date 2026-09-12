import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSocket } from '../../net/socket';
import { useGameStore } from '../../state/gameStore';
import { useRoomStore } from '../../state/roomStore';

export function GameScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const playerId = useRoomStore((s) => s.playerId);
  const gameState = useGameStore((s) => s.gameState);
  const hasSubmittedThisTurn = useGameStore((s) => s.hasSubmittedThisTurn);
  const markSubmitted = useGameStore((s) => s.markSubmitted);
  const [investment, setInvestment] = useState(0);
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

  useEffect(() => {
    setInvestment(0);
  }, [gameState?.turnNumber]);

  if (!gameState || gameState.roomId !== roomId) {
    return (
      <div className="screen screen-centered">
        <p>게임 정보를 불러오는 중...</p>
      </div>
    );
  }

  const myCity = gameState.cities.find((c) => c.ownerId === playerId);
  const myLastTurnLog = gameState.lastTurnLog.find((l) => l.playerId === playerId);
  const submittedCount = gameState.submittedPlayerIds.length;
  const totalCount = gameState.cities.length;

  function handleSubmit() {
    if (!roomId) return;
    getSocket().emit('game:submitOrder', { roomId, order: { agricultureInvestment: investment } });
    markSubmitted();
  }

  return (
    <div className="screen game-screen">
      <header className="room-header">
        <h1>턴 {gameState.turnNumber}</h1>
        <span className="muted">남은 시간: {secondsLeft}초</span>
      </header>

      {myLastTurnLog && (
        <div className="card">
          <p className="muted">
            지난 턴: 농업에 {myLastTurnLog.agricultureInvestment} 투자 → 곡물 {myLastTurnLog.grainProduced} 생산 (창고: {myLastTurnLog.newGrainStock})
          </p>
        </div>
      )}

      {myCity && (
        <div className="card">
          <h2>{myCity.name}</h2>
          <ul className="settings-readout">
            <li>농업 수준: {myCity.agricultureLevel}</li>
            <li>곡물 창고: {myCity.grainStock}</li>
          </ul>
        </div>
      )}

      <div className="card">
        <h2>이번 턴 명령</h2>
        <label>
          농업 투자 (사용 가능 포인트: {gameState.actionPointsPerTurn})
          <input
            type="range"
            min={0}
            max={gameState.actionPointsPerTurn}
            value={investment}
            disabled={hasSubmittedThisTurn}
            onChange={(e) => setInvestment(Number(e.target.value))}
          />
        </label>
        <p className="muted">농업에 {investment} 포인트 투자</p>
        <button onClick={handleSubmit} disabled={hasSubmittedThisTurn}>
          {hasSubmittedThisTurn ? '제출 완료' : '명령 제출'}
        </button>
        <p className="muted">
          제출 완료: {submittedCount}/{totalCount}명
        </p>
      </div>
    </div>
  );
}
