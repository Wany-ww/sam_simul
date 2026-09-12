import type { PlayerId } from './session.js';
import type { ChatMessage } from './chat.js';

export type RoomId = string;

export type ConnectionStatus = 'connected' | 'disconnected';

export type MapSize = 'small' | 'medium' | 'large';
export type ProbabilityTier = 'none' | 'low' | 'normal' | 'high';

export interface RoomPlayer {
  playerId: PlayerId;
  displayName: string;
  isHost: boolean;
  status: ConnectionStatus;
  joinedAt: number;
  lastDisconnectedAt?: number;
}

export interface RoomSettings {
  turnTimeLimitSeconds: number;
  mapSize: MapSize;
  disasterFrequency: ProbabilityTier;
  generalAppearanceProbability: Exclude<ProbabilityTier, 'none'>;
  eventProbability: Exclude<ProbabilityTier, 'none'>;
  maxPlayers: number;
}

export type RoomStatus = 'lobby' | 'in_progress' | 'ended';

export interface RoomSummary {
  roomId: RoomId;
  name: string;
  hostDisplayName: string;
  playerCount: number;
  maxPlayers: number;
  status: RoomStatus;
}

export interface Room {
  roomId: RoomId;
  name: string;
  hostPlayerId: PlayerId;
  settings: RoomSettings;
  players: RoomPlayer[];
  status: RoomStatus;
  chatLog: ChatMessage[];
  createdAt: number;
  gameStateRef?: string; // reserved for Phase 2+
}
