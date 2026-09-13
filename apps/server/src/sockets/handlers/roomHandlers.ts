import type { RoomErrorCode } from '@sam-simul/shared';
import { sessionStore } from '../../domain/session/SessionStore.js';
import { RoomError } from '../../domain/room/RoomError.js';
import type { RoomManager } from '../../domain/room/RoomManager.js';
import type { GameSessionManager } from '../../domain/game/GameSessionManager.js';
import type { AppServer, AppSocket } from '../types.js';

const LOBBY_CHANNEL = 'lobby';

function emitRoomError(socket: AppSocket, code: RoomErrorCode, message: string): void {
  socket.emit('room:error', { code, message });
}

function broadcastLobbyList(io: AppServer, roomManager: RoomManager): void {
  io.to(LOBBY_CHANNEL).emit('room:listUpdated', roomManager.listSummaries());
}

function displayNameFor(playerId: string): string {
  return sessionStore.getIdentity(playerId)?.displayName ?? '익명';
}

export function registerRoomHandlers(io: AppServer, socket: AppSocket, roomManager: RoomManager, gameSessionManager: GameSessionManager): void {
  socket.join(LOBBY_CHANNEL);

  socket.on('room:list', () => {
    socket.emit('room:listUpdated', roomManager.listSummaries());
  });

  socket.on('room:create', ({ name, settings }) => {
    try {
      const room = roomManager.createRoom({
        name,
        settings,
        hostPlayerId: socket.data.playerId,
        hostDisplayName: displayNameFor(socket.data.playerId),
      });
      socket.join(room.roomId);
      socket.emit('room:state', room);
      broadcastLobbyList(io, roomManager);
    } catch (err) {
      handleError(socket, err);
    }
  });

  socket.on('room:join', ({ roomId }) => {
    try {
      const room = roomManager.joinRoom({
        roomId,
        playerId: socket.data.playerId,
        displayName: displayNameFor(socket.data.playerId),
      });
      socket.join(room.roomId);
      io.to(room.roomId).emit('room:state', room);
      broadcastLobbyList(io, roomManager);
    } catch (err) {
      handleError(socket, err);
    }
  });

  socket.on('room:rejoin', ({ roomId }) => {
    try {
      const room = roomManager.rejoinRoom({ roomId, playerId: socket.data.playerId });
      socket.join(room.roomId);
      io.to(room.roomId).emit('room:state', room);
      io.to(room.roomId).emit('room:playerStatusChanged', { playerId: socket.data.playerId, status: 'connected' });

      if (room.status === 'in_progress') {
        const gameState = gameSessionManager.getState(room.roomId);
        if (gameState) socket.emit('game:state', gameState);
      }
    } catch (err) {
      handleError(socket, err);
    }
  });

  socket.on('room:leave', ({ roomId }) => {
    try {
      const { room, newHostPlayerId } = roomManager.leaveRoom({ roomId, playerId: socket.data.playerId });
      socket.leave(roomId);
      if (room) {
        io.to(room.roomId).emit('room:state', room);
        if (newHostPlayerId) {
          io.to(room.roomId).emit('room:hostChanged', { newHostPlayerId });
        }
      } else {
        gameSessionManager.endGame(roomId);
      }
      broadcastLobbyList(io, roomManager);
    } catch (err) {
      handleError(socket, err);
    }
  });

  socket.on('room:updateSettings', ({ roomId, settings }) => {
    try {
      const room = roomManager.updateSettings({ roomId, playerId: socket.data.playerId, settings });
      io.to(room.roomId).emit('room:state', room);
      broadcastLobbyList(io, roomManager);
    } catch (err) {
      handleError(socket, err);
    }
  });

  socket.on('room:start', ({ roomId }) => {
    try {
      const room = roomManager.startRoom({ roomId, playerId: socket.data.playerId });
      io.to(room.roomId).emit('room:state', room);
      gameSessionManager.startGame(room);
      io.to(room.roomId).emit('room:started', { roomId: room.roomId });
      broadcastLobbyList(io, roomManager);
    } catch (err) {
      handleError(socket, err);
    }
  });
}

function handleError(socket: AppSocket, err: unknown): void {
  if (err instanceof RoomError) {
    emitRoomError(socket, err.code, err.message);
    return;
  }
  emitRoomError(socket, 'ROOM_NOT_FOUND', err instanceof Error ? err.message : 'unknown error');
}
