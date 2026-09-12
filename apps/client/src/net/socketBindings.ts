import type { NavigateFunction } from 'react-router-dom';
import { getSocket } from './socket';
import { useRoomStore } from '../state/roomStore';
import { useGameStore } from '../state/gameStore';
import { setLastRoomId } from '../state/identityStore';

// Registers the permanent listeners that mirror server-pushed state into the
// Zustand store. Called once right after the socket connects (from LoginScreen).
export function bindSocketEvents(navigate: NavigateFunction): void {
  const socket = getSocket();

  socket.off('room:state');
  socket.on('room:state', (room) => {
    useRoomStore.getState().setCurrentRoom(room);
    setLastRoomId(room.roomId);
  });

  socket.off('room:listUpdated');
  socket.on('room:listUpdated', (rooms) => {
    useRoomStore.getState().setRooms(rooms);
  });

  socket.off('room:chatMessage');
  socket.on('room:chatMessage', (message) => {
    useRoomStore.getState().appendChatMessage(message);
  });

  socket.off('room:playerStatusChanged');
  socket.on('room:playerStatusChanged', ({ playerId, status }) => {
    const room = useRoomStore.getState().currentRoom;
    if (!room) return;
    useRoomStore.getState().setCurrentRoom({
      ...room,
      players: room.players.map((p) => (p.playerId === playerId ? { ...p, status } : p)),
    });
  });

  socket.off('room:hostChanged');
  socket.on('room:hostChanged', ({ newHostPlayerId }) => {
    const room = useRoomStore.getState().currentRoom;
    if (!room) return;
    useRoomStore.getState().setCurrentRoom({
      ...room,
      hostPlayerId: newHostPlayerId,
      players: room.players.map((p) => ({ ...p, isHost: p.playerId === newHostPlayerId })),
    });
  });

  socket.off('room:started');
  socket.on('room:started', ({ roomId }) => {
    navigate(`/game/${roomId}`);
  });

  socket.off('room:error');
  socket.on('room:error', (error) => {
    useRoomStore.getState().setError(error);
  });

  socket.off('game:state');
  socket.on('game:state', (state) => {
    useGameStore.getState().setGameState(state);
  });
}
