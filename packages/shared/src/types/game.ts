import type { PlayerId } from './session.js';
import type { RoomId } from './room.js';
import type { Army, ArmyStanceOrder, FortifyOrder, MapNodeId, MarchOrder } from './map.js';
import type { AssignGeneralOrder, General, UnassignGeneralOrder } from './general.js';
import type { ActiveEffect } from './effects.js';

export type CityId = string;

// Grain, textile, meat, and equipment sub-types the spec asks to break out.
// Kept as a flat union (rather than nested groups) so warehouse/production
// code can treat every resource uniformly; grouping arrays below cover the
// "which sub-types belong to which domain" question.
export type ResourceType =
  | 'rice'
  | 'wheat'
  | 'potato'
  | 'cotton'
  | 'hemp'
  | 'cattle'
  | 'horse'
  | 'pig'
  | 'leather'
  | 'spear'
  | 'bow'
  | 'crossbow'
  | 'shield'
  | 'horseArmor'
  | 'armor'
  | 'gold';

export const GRAIN_RESOURCES: readonly ResourceType[] = ['rice', 'wheat', 'potato'];
export const TEXTILE_RESOURCES: readonly ResourceType[] = ['cotton', 'hemp'];
export const MEAT_RESOURCES: readonly ResourceType[] = ['cattle', 'horse', 'pig'];
export const ARMORY_RESOURCES: readonly ResourceType[] = ['spear', 'bow', 'crossbow', 'shield', 'horseArmor', 'armor'];
// The subset of armory equipment that the Weapons Workshop (조병창) additionally boosts.
export const WEAPONS_WORKSHOP_RESOURCES: readonly ResourceType[] = ['spear', 'bow', 'shield', 'horseArmor'];

export type Warehouse = Partial<Record<ResourceType, number>>;

export interface CommerceLevels {
  tradingPost: number;
  taxOffice: number;
  market: number;
}

export interface IndustryLevels {
  armory: number;
  weaponsWorkshop: number;
  blacksmith: number;
  publicWorks: number;
}

export interface FacilityLevels {
  agriculture: number;
  animalHusbandry: number;
  commerce: CommerceLevels;
  industry: IndustryLevels;
}

// Base recruitable troop categories (per the spec's "창병 < 장창병" etc.):
// the upgraded/specialized variants unlock once combat (Phase 5) and armory
// tech gating (Phase 6) exist, so Phase 3 only tracks these base types.
export type UnitType = 'spearman' | 'crossbowman' | 'cavalry' | 'engineer';

export interface TroopStack {
  unitType: UnitType;
  count: number;
  trainingLevel: number; // 0..MAX_TRAINING_LEVEL
}

export interface GameCity {
  cityId: CityId;
  ownerId: PlayerId;
  name: string;
  nodeId: MapNodeId;
  population: number;
  facilities: FacilityLevels;
  warehouse: Warehouse;
  troops: TroopStack[];
  garrisonMorale: number; // the city's own defending troops, separate from any visiting Army's morale
  wallDurability: number; // 0 means the city falls to a besieging attacker
  generals: General[]; // every general this player has recruited, whether assigned or idle
  activeEffects: ActiveEffect[]; // temporary disaster/event modifiers currently in effect
}

export interface CommerceInvestment {
  tradingPost: number;
  taxOffice: number;
  market: number;
}

export interface IndustryInvestment {
  armory: number;
  weaponsWorkshop: number;
  blacksmith: number;
  publicWorks: number;
}

export interface FacilityInvestment {
  agriculture: number;
  animalHusbandry: number;
  commerce: Partial<CommerceInvestment>;
  industry: Partial<IndustryInvestment>;
}

export interface MarketExchangeOrder {
  from: ResourceType; // resource sold
  amount: number; // amount of `from` offered
}

export interface RecruitOrder {
  unitType: UnitType;
  count: number;
}

export interface TrainOrder {
  unitType: UnitType;
  pointsInvested: number;
}

export interface PlayerOrder {
  investment: FacilityInvestment;
  marketExchange?: MarketExchangeOrder;
  recruit?: RecruitOrder;
  train?: TrainOrder;
  march?: MarchOrder;
  armyStance?: ArmyStanceOrder;
  fortify?: FortifyOrder;
  assignGeneral?: AssignGeneralOrder;
  unassignGeneral?: UnassignGeneralOrder;
}

export type BattleType = 'field' | 'siege';

export interface BattleLogEntry {
  nodeId: MapNodeId;
  battleType: BattleType;
  opponentPlayerId: PlayerId;
  daysFought: number;
  ownCasualties: number;
  opponentCasualties: number;
  outcome: 'ongoing' | 'won' | 'lost';
  wallDurabilityRemaining?: number; // present only for the siege attacker/defender
}

export interface TurnLogEntry {
  turnNumber: number;
  cityId: CityId;
  playerId: PlayerId;
  populationDelta: number;
  resourceProduced: Warehouse;
  resourceConsumed: Warehouse;
  marketExchange?: { from: ResourceType; amountIn: number; amountOut: number };
  recruited?: { unitType: UnitType; count: number };
  trained?: { unitType: UnitType; levelsGained: number };
  battles: BattleLogEntry[];
  notes: string[];
}

export interface GameState {
  roomId: RoomId;
  turnNumber: number;
  turnEndsAt: number; // epoch ms
  actionPointsPerTurn: number;
  cities: GameCity[];
  armies: Army[];
  submittedPlayerIds: PlayerId[]; // who has submitted orders for the current turn
  lastTurnLog: TurnLogEntry[];
}
