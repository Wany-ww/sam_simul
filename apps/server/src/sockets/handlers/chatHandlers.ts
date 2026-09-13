import { RoomError } from '../../domain/room/RoomError.js';
import type { RoomManager } from '../../domain/room/RoomManager.js';
import type { AppServer, AppSocket } from '../types.js';

const MIN_MS_BETWEEN_MESSAGES = 400;

export function registerChatHandlers(io: AppServer, socket: AppSocket, roomManager: RoomManager): void {
  let lastMessageAt = 0;

  socket.on('room:chat', ({ roomId, text }) => {
    const now = Date.now();
    if (now - lastMessageAt < MIN_MS_BETWEEN_MESSAGES) {
      socket.emit('room:error', { code: 'RATE_LIMITED', message: '너무 빠르게 채팅을 보내고 있습니다' });
      return;
    }

    try {
      const message = roomManager.addChatMessage({ roomId, playerId: socket.data.playerId, text });
      lastMessageAt = now;
      io.to(roomId).emit('room:chatMessage', message);
    } catch (err) {
      if (err instanceof RoomError) {
        socket.emit('room:error', { code: err.code, message: err.message });
        return;
      }
      socket.emit('room:error', { code: 'NOT_IN_ROOM', message: '메시지 전송에 실패했습니다.' });
    }
  });
}
