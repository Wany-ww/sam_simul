import type { PlayerId } from './session.js';
import type { RoomId } from './room.js';

export type CityId = string;

export interface GameCity {
  cityId: CityId;
  ownerId: PlayerId;
  name: string;
  agricultureLevel: number;
  grainStock: number;
}

// Phase 2 vertical slice: the only order a player can submit is how many of
// their action points go into agriculture. Later phases extend this shape
// (animal husbandry/commerce/industry allocations, troop orders, etc.).
export interface PlayerOrder {
  agricultureInvestment: number;
}

export interface TurnLogEntry {
  turnNumber: number;
  cityId: CityId;
  playerId: PlayerId;
  agricultureInvestment: number;
  grainProduced: number;
  newAgricultureLevel: number;
  newGrainStock: number;
}

export interface GameState {
  roomId: RoomId;
  turnNumber: number;
  turnEndsAt: number; // epoch ms
  actionPointsPerTurn: number;
  cities: GameCity[];
  submittedPlayerIds: PlayerId[]; // who has submitted orders for the current turn
  lastTurnLog: TurnLogEntry[];
}
