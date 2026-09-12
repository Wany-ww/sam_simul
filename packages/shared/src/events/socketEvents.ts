import type { ChatMessage } from '../types/chat.js';
import type { PlayerId } from '../types/session.js';
import type { ConnectionStatus, Room, RoomId, RoomSettings, RoomSummary } from '../types/room.js';

export type RoomErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_ALREADY_STARTED'
  | 'NOT_HOST'
  | 'INVALID_SETTINGS'
  | 'NOT_ENOUGH_PLAYERS'
  | 'NOT_IN_ROOM'
  | 'RATE_LIMITED'
  | 'INVALID_NAME';

export interface RoomErrorPayload {
  code: RoomErrorCode;
  message: string;
}

// Client -> Server
export interface ClientToServerEvents {
  'room:list': () => void;
  'room:create': (payload: { name: string; settings: RoomSettings }) => void;
  'room:join': (payload: { roomId: RoomId }) => void;
  'room:rejoin': (payload: { roomId: RoomId }) => void;
  'room:leave': (payload: { roomId: RoomId }) => void;
  'room:updateSettings': (payload: { roomId: RoomId; settings: Partial<RoomSettings> }) => void;
  'room:chat': (payload: { roomId: RoomId; text: string }) => void;
  'room:start': (payload: { roomId: RoomId }) => void;
}

// Server -> Client
export interface ServerToClientEvents {
  'room:listUpdated': (rooms: RoomSummary[]) => void;
  'room:state': (room: Room) => void;
  'room:playerStatusChanged': (payload: { playerId: PlayerId; status: ConnectionStatus }) => void;
  'room:hostChanged': (payload: { newHostPlayerId: PlayerId }) => void;
  'room:chatMessage': (message: ChatMessage) => void;
  'room:started': (payload: { roomId: RoomId }) => void;
  'room:error': (payload: RoomErrorPayload) => void;
}

export interface SocketAuthPayload {
  token: string;
}
