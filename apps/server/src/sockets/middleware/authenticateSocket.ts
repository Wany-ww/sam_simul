import { sessionStore } from '../../domain/session/SessionStore.js';
import type { AppSocket } from '../types.js';

export function authenticateSocket(socket: AppSocket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    next(new Error('UNAUTHENTICATED'));
    return;
  }

  const playerId = sessionStore.verifyToken(token);
  if (!playerId) {
    next(new Error('UNAUTHENTICATED'));
    return;
  }

  socket.data.playerId = playerId;
  next();
}
