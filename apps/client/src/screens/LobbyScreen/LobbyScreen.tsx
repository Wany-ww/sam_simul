import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_ROOM_SETTINGS, type RoomSettings } from '@sam-simul/shared';
import { getSocket } from '../../net/socket';
import { useRoomStore } from '../../state/roomStore';
import { setLastRoomId } from '../../state/identityStore';

const STATUS_LABEL: Record<string, string> = { lobby: '대기 중', in_progress: '진행 중', ended: '종료됨' };

export function LobbyScreen() {
  const navigate = useNavigate();
  const playerId = useRoomStore((s) => s.playerId);
  const rooms = useRoomStore((s) => s.rooms);
  const lastError = useRoomStore((s) => s.lastError);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_ROOM_SETTINGS);

  useEffect(() => {
    if (!playerId) {
      navigate('/');
      return;
    }
    getSocket().emit('room:list');
  }, [playerId, navigate]);

  function joinRoom(roomId: string) {
    const socket = getSocket();
    socket.once('room:state', (room) => {
      setLastRoomId(room.roomId);
      navigate(`/room/${room.roomId}`);
    });
    socket.emit('room:join', { roomId });
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    const socket = getSocket();
    socket.once('room:state', (room) => {
      setLastRoomId(room.roomId);
      navigate(`/room/${room.roomId}`);
    });
    socket.emit('room:create', { name: roomName.trim() || '이름 없는 방', settings });
  }

  return (
    <div className="screen lobby-screen">
      <header className="lobby-header">
        <h1>로비</h1>
        <div className="lobby-header-actions">
          <button onClick={() => navigate('/codex')}>장수 도감</button>
          <button onClick={() => setShowCreateForm((v) => !v)}>{showCreateForm ? '취소' : '방 만들기'}</button>
        </div>
      </header>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="card">
          <h2>새 방 만들기</h2>
          <label>
            방 이름
            <input value={roomName} onChange={(e) => setRoomName(e.target.value)} maxLength={60} placeholder="예: 적벽대전 한판" />
          </label>
          <div className="settings-grid">
            <label>
              턴 시간(초)
              <input
                type="number"
                min={30}
                max={900}
                value={settings.turnTimeLimitSeconds}
                onChange={(e) => setSettings({ ...settings, turnTimeLimitSeconds: Number(e.target.value) })}
              />
            </label>
            <label>
              최대 인원
              <input
                type="number"
                min={2}
                max={8}
                value={settings.maxPlayers}
                onChange={(e) => setSettings({ ...settings, maxPlayers: Number(e.target.value) })}
              />
            </label>
            <label>
              맵 크기
              <select value={settings.mapSize} onChange={(e) => setSettings({ ...settings, mapSize: e.target.value as RoomSettings['mapSize'] })}>
                <option value="small">소</option>
                <option value="medium">중</option>
                <option value="large">대</option>
              </select>
            </label>
            <label>
              재난 빈도
              <select
                value={settings.disasterFrequency}
                onChange={(e) => setSettings({ ...settings, disasterFrequency: e.target.value as RoomSettings['disasterFrequency'] })}
              >
                <option value="none">없음</option>
                <option value="low">낮음</option>
                <option value="normal">보통</option>
                <option value="high">높음</option>
              </select>
            </label>
            <label>
              장수 등장 확률
              <select
                value={settings.generalAppearanceProbability}
                onChange={(e) =>
                  setSettings({ ...settings, generalAppearanceProbability: e.target.value as RoomSettings['generalAppearanceProbability'] })
                }
              >
                <option value="low">낮음</option>
                <option value="normal">보통</option>
                <option value="high">높음</option>
              </select>
            </label>
            <label>
              이벤트 발생 확률
              <select
                value={settings.eventProbability}
                onChange={(e) => setSettings({ ...settings, eventProbability: e.target.value as RoomSettings['eventProbability'] })}
              >
                <option value="low">낮음</option>
                <option value="normal">보통</option>
                <option value="high">높음</option>
              </select>
            </label>
          </div>
          <button type="submit">방 생성</button>
        </form>
      )}

      <div className="room-list">
        {rooms.length === 0 && <p className="muted">아직 생성된 방이 없습니다. 방을 만들어보세요.</p>}
        {rooms.map((room) => (
          <div key={room.roomId} className="card room-list-item">
            <div>
              <strong>{room.name}</strong>
              <p className="muted">
                호스트: {room.hostDisplayName} · {room.playerCount}/{room.maxPlayers}명 · {STATUS_LABEL[room.status]}
              </p>
            </div>
            <button onClick={() => joinRoom(room.roomId)} disabled={room.status !== 'lobby' || room.playerCount >= room.maxPlayers}>
              입장
            </button>
          </div>
        ))}
      </div>

      {lastError && <p className="error-text">{lastError.message}</p>}
    </div>
  );
}
