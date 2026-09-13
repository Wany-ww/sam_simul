import type { PlayerId, RoomId, RoomPlayer } from '@sam-simul/shared';
import { getSocket } from '../../net/socket';

export function PlayerList({
  players,
  hostPlayerId,
  roomId,
  isHost,
  maxPlayers,
}: {
  players: RoomPlayer[];
  hostPlayerId: PlayerId;
  roomId: RoomId;
  isHost: boolean;
  maxPlayers: number;
}) {
  function removeAi(playerId: PlayerId) {
    getSocket().emit('room:removeAi', { roomId, playerId });
  }

  function addAi() {
    getSocket().emit('room:addAi', { roomId });
  }

  return (
    <div className="card">
      <div className="player-list-header">
        <h2>플레이어 ({players.length}/{maxPlayers})</h2>
        {isHost && (
          <button onClick={addAi} disabled={players.length >= maxPlayers}>
            AI 추가
          </button>
        )}
      </div>
      <ul className="player-list">
        {players.map((p) => (
          <li key={p.playerId} className={p.status === 'disconnected' ? 'player-disconnected' : ''}>
            <span className={`status-dot status-${p.status}`} />
            <span>{p.displayName}</span>
            {p.isAI && <span className="ai-badge">AI</span>}
            {p.playerId === hostPlayerId && <span className="host-badge">호스트</span>}
            {p.status === 'disconnected' && <span className="muted"> (연결 끊김)</span>}
            {p.isAI && isHost && (
              <button className="remove-ai-button" onClick={() => removeAi(p.playerId)}>
                제거
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
