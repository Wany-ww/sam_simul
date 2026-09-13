import type { PlayerId } from './session.js';
import type { CityId, TroopStack, UnitType } from './game.js';

export type MapNodeId = string;
export type MapNodeType = 'city' | 'battlefield';

// Fixed, hand-authored map (per the roadmap's resolution of the "fixed graph
// vs procedurally-sized" open question): a room's mapSize setting scales
// travel time via MAP_SIZE_TRAVEL_DAY_MULTIPLIER, it never changes which
// nodes exist.
export type RegionId = 'siLi' | 'jizhou' | 'bingzhou' | 'xiliang' | 'yanzhou' | 'yuzhou' | 'jingzhou' | 'yizhou' | 'jiangdong';

export interface MapNode {
  nodeId: MapNodeId;
  name: string;
  type: MapNodeType;
  region: RegionId;
  isStartingCity: boolean;
  x: number; // schematic layout position for the client map view, not to geographic scale
  y: number;
}

export interface MapEdge {
  from: MapNodeId;
  to: MapNodeId;
  baseDistanceDays: number; // at mapSize "medium" (multiplier 1)
}

export interface Region {
  regionId: RegionId;
  name: string;
  horseProductionMultiplier: number; // e.g. Bingzhou/Xiliang start with strong cavalry development
}

export type ArmyStance = 'attack' | 'defend';

export interface Army {
  armyId: string;
  ownerId: PlayerId;
  originCityId: CityId;
  troops: TroopStack[];
  currentNodeId: MapNodeId;
  destinationNodeId: MapNodeId | null; // null when not marching
  daysRemaining: number; // 0 when stationary/arrived
  morale: number; // 0..100+
  stance: ArmyStance;
  fortified: boolean;
}

export interface MarchOrder {
  unitType: UnitType;
  count: number;
  destinationNodeId: MapNodeId;
}

export interface ArmyStanceOrder {
  armyId: string;
  stance: ArmyStance;
}

export interface FortifyOrder {
  armyId: string;
}
