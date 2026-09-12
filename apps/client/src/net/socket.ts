import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@sam-simul/shared';
import { SERVER_URL } from './serverUrl';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function connectSocket(sessionToken: string): AppSocket {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SERVER_URL, {
    auth: { token: sessionToken },
    autoConnect: true,
  });

  return socket;
}

export function getSocket(): AppSocket {
  if (!socket) throw new Error('socket is not connected yet; call connectSocket first');
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
