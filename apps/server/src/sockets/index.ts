import type { RoomManager } from '../domain/room/RoomManager.js';
import { GameSessionManager } from '../domain/game/GameSessionManager.js';
import { authenticateSocket } from './middleware/authenticateSocket.js';
import { registerRoomHandlers } from './handlers/roomHandlers.js';
import { registerChatHandlers } from './handlers/chatHandlers.js';
import { registerConnectionHandlers } from './handlers/connectionHandlers.js';
import { registerGameHandlers } from './handlers/gameHandlers.js';
import type { AppServer } from './types.js';

const SWEEP_INTERVAL_MS = 60 * 1000;

export function setupSockets(io: AppServer, roomManager: RoomManager): void {
  io.use(authenticateSocket);

  const gameSessionManager = new GameSessionManager(io);

  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket, roomManager, gameSessionManager);
    registerChatHandlers(io, socket, roomManager);
    registerConnectionHandlers(io, socket, roomManager);
    registerGameHandlers(socket, gameSessionManager);
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
      } else {
        gameSessionManager.endGame(result.roomId);
      }
    }
    io.to('lobby').emit('room:listUpdated', roomManager.listSummaries());
  }, SWEEP_INTERVAL_MS);
}
