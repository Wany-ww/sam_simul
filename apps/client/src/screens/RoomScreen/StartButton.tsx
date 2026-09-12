import { MIN_PLAYERS_TO_START } from '@sam-simul/shared';
import type { RoomId, RoomPlayer } from '@sam-simul/shared';
import { getSocket } from '../../net/socket';

export function StartButton({ roomId, isHost, players }: { roomId: RoomId; isHost: boolean; players: RoomPlayer[] }) {
  if (!isHost) return null;

  const connectedCount = players.filter((p) => p.status === 'connected').length;
  const canStart = connectedCount >= MIN_PLAYERS_TO_START;

  function handleStart() {
    getSocket().emit('room:start', { roomId });
  }

  return (
    <div className="card">
      <button onClick={handleStart} disabled={!canStart} title={canStart ? undefined : `연결된 플레이어가 최소 ${MIN_PLAYERS_TO_START}명 필요합니다`}>
        게임 시작
      </button>
    </div>
  );
}
