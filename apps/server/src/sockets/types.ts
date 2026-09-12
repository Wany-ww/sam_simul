import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, PlayerId, ServerToClientEvents } from '@sam-simul/shared';

export interface SocketData {
  playerId: PlayerId;
}

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
