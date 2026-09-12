import type { PlayerId } from './session.js';
import type { RoomId } from './room.js';

export interface ChatMessage {
  id: string;
  roomId: RoomId;
  playerId: PlayerId;
  displayName: string;
  text: string;
  sentAt: number; // epoch ms
}
