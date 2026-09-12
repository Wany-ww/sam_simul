import type { PlayerId, RoomPlayer } from '@sam-simul/shared';

export function PlayerList({ players, hostPlayerId }: { players: RoomPlayer[]; hostPlayerId: PlayerId }) {
  return (
    <div className="card">
      <h2>플레이어 ({players.length})</h2>
      <ul className="player-list">
        {players.map((p) => (
          <li key={p.playerId} className={p.status === 'disconnected' ? 'player-disconnected' : ''}>
            <span className={`status-dot status-${p.status}`} />
            <span>{p.displayName}</span>
            {p.playerId === hostPlayerId && <span className="host-badge">호스트</span>}
            {p.status === 'disconnected' && <span className="muted"> (연결 끊김)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
