import type { GameSessionManager } from '../../domain/game/GameSessionManager.js';
import type { AppSocket } from '../types.js';

export function registerGameHandlers(socket: AppSocket, gameSessionManager: GameSessionManager): void {
  socket.on('game:submitOrder', ({ roomId, order }) => {
    gameSessionManager.submitOrder(roomId, socket.data.playerId, order);
  });
}
