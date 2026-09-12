import type { RoomManager } from '../domain/room/RoomManager.js';
import { authenticateSocket } from './middleware/authenticateSocket.js';
import { registerRoomHandlers } from './handlers/roomHandlers.js';
import { registerChatHandlers } from './handlers/chatHandlers.js';
import { registerConnectionHandlers } from './handlers/connectionHandlers.js';
import type { AppServer } from './types.js';

const SWEEP_INTERVAL_MS = 60 * 1000;

export function setupSockets(io: AppServer, roomManager: RoomManager): void {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket, roomManager);
    registerChatHandlers(io, socket, roomManager);
    registerConnectionHandlers(io, socket, roomManager);
  });

  setInterval(() => {
    const sweepResults = roomManager.sweepStaleDisconnections();
    if (sweepResults.length === 0) return;

    for (const result of sweepResults) {
      if (!result.deleted) {
        const room = roomManager.getRoom(result.roomId);
        if (room) io.to(result.roomId).emit('room:state', room);
        if (result.newHostPlayerId) {
          io.to(result.roomId).emit('room:hostChanged', { newHostPlayerId: result.newHostPlayerId });
        }
      }
    }
    io.to('lobby').emit('room:listUpdated', roomManager.listSummaries());
  }, SWEEP_INTERVAL_MS);
}
