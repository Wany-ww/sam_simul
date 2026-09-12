import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSessionToken } from '../../net/api';
import { connectSocket, getSocket } from '../../net/socket';
import { bindSocketEvents } from '../../net/socketBindings';
import { getLastRoomId, getOrCreatePlayerId, getStoredDisplayName, setStoredDisplayName } from '../../state/identityStore';
import { useRoomStore } from '../../state/roomStore';

export function LoginScreen() {
  const navigate = useNavigate();
  const setIdentity = useRoomStore((s) => s.setIdentity);
  const [name, setName] = useState(getStoredDisplayName());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const playerId = getOrCreatePlayerId();
      const { sessionToken } = await fetchSessionToken(playerId, trimmed);
      setStoredDisplayName(trimmed);
      setIdentity(playerId, trimmed);

      connectSocket(sessionToken);
      bindSocketEvents(navigate);

      const lastRoomId = getLastRoomId();
      if (lastRoomId) {
        getSocket().emit('room:rejoin', { roomId: lastRoomId });
        navigate(`/room/${lastRoomId}`);
      } else {
        navigate('/lobby');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen screen-centered">
      <h1>삼국지 시뮬</h1>
      <form onSubmit={handleSubmit} className="card login-card">
        <label htmlFor="displayName">표시 이름</label>
        <input
          id="displayName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 조조"
          maxLength={24}
          autoFocus
        />
        <button type="submit" disabled={loading || !name.trim()}>
          {loading ? '접속 중...' : '로비 입장'}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}
