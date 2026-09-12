export type PlayerId = string; // persistentPlayerId generated client-side, UUID v4

export interface PlayerIdentity {
  playerId: PlayerId;
  displayName: string;
}

export interface SessionTokenPayload {
  playerId: PlayerId;
  exp: number; // epoch ms
}
