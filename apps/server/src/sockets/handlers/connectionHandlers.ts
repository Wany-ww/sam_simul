import type { RoomManager } from '../../domain/room/RoomManager.js';
import type { AppServer, AppSocket } from '../types.js';

export function registerConnectionHandlers(io: AppServer, socket: AppSocket, roomManager: RoomManager): void {
  socket.on('disconnect', () => {
    const result = roomManager.handleDisconnect(socket.data.playerId);
    if (!result) return;

    io.to(result.room.roomId).emit('room:playerStatusChanged', {
      playerId: socket.data.playerId,
      status: 'disconnected',
    });
    io.to('lobby').emit('room:listUpdated', roomManager.listSummaries());
  });
}
