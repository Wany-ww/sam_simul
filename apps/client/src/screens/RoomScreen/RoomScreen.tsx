import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoomStore } from '../../state/roomStore';
import { setLastRoomId } from '../../state/identityStore';
import { getSocket } from '../../net/socket';
import { PlayerList } from './PlayerList';
import { RoomSettingsPanel } from './RoomSettingsPanel';
import { ChatPanel } from './ChatPanel';
import { StartButton } from './StartButton';

export function RoomScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const currentRoom = useRoomStore((s) => s.currentRoom);
  const playerId = useRoomStore((s) => s.playerId);
  const lastError = useRoomStore((s) => s.lastError);

  useEffect(() => {
    if (!playerId) navigate('/');
  }, [playerId, navigate]);

  useEffect(() => {
    if (currentRoom?.status === 'in_progress') navigate(`/game/${currentRoom.roomId}`);
  }, [currentRoom?.status, currentRoom?.roomId, navigate]);

  useEffect(() => {
    if (lastError?.code === 'ROOM_NOT_FOUND' || lastError?.code === 'NOT_IN_ROOM') {
      setLastRoomId(null);
      navigate('/lobby');
    }
  }, [lastError, navigate]);

  function handleLeave() {
    if (!roomId) return;
    getSocket().emit('room:leave', { roomId });
    setLastRoomId(null);
    navigate('/lobby');
  }

  if (!currentRoom || currentRoom.roomId !== roomId) {
    return (
      <div className="screen screen-centered">
        <p>방 정보를 불러오는 중...</p>
      </div>
    );
  }

  const me = currentRoom.players.find((p) => p.playerId === playerId);
  const isHost = me?.isHost ?? false;

  return (
    <div className="screen room-screen">
      <header className="room-header">
        <h1>{currentRoom.name}</h1>
        <button onClick={handleLeave}>방 나가기</button>
      </header>
      <div className="room-body">
        <div className="room-main">
          <PlayerList players={currentRoom.players} hostPlayerId={currentRoom.hostPlayerId} />
          <RoomSettingsPanel roomId={currentRoom.roomId} settings={currentRoom.settings} isHost={isHost} />
          <StartButton roomId={currentRoom.roomId} isHost={isHost} players={currentRoom.players} />
        </div>
        <ChatPanel roomId={currentRoom.roomId} chatLog={currentRoom.chatLog} playerId={playerId} />
      </div>
      {lastError && <p className="error-text">{lastError.message}</p>}
    </div>
  );
}
