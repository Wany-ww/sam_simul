import type { MapSize, ProbabilityTier, RoomSettings } from '../types/room.js';
import type { ResourceType, UnitType } from '../types/game.js';

// Single source of truth mapping a room's semantic settings tiers to concrete
// numeric values. Later phases (map travel days, disaster/event rolls) read
// from these tables instead of re-deriving meaning from raw numbers.

export const MAP_SIZE_TRAVEL_DAY_MULTIPLIER: Record<MapSize, number> = {
  small: 0.75,
  medium: 1,
  large: 1.5,
};

export const DISASTER_FREQUENCY_PER_TURN_PROBABILITY: Record<ProbabilityTier, number> = {
  none: 0,
  low: 0.03,
  normal: 0.08,
  high: 0.15,
};

export const EVENT_PROBABILITY_PER_TURN_PROBABILITY: Record<Exclude<ProbabilityTier, 'none'>, number> = {
  low: 0.05,
  normal: 0.12,
  high: 0.22,
};

export const GENERAL_APPEARANCE_BASE_PROBABILITY: Record<Exclude<ProbabilityTier, 'none'>, number> = {
  low: 0.02,
  normal: 0.05,
  high: 0.1,
};

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  turnTimeLimitSeconds: 180,
  mapSize: 'medium',
  disasterFrequency: 'normal',
  generalAppearanceProbability: 'normal',
  eventProbability: 'normal',
  maxPlayers: 6,
};

export const ROOM_SETTINGS_BOUNDS = {
  turnTimeLimitSeconds: { min: 30, max: 900 },
  maxPlayers: { min: 2, max: 8 },
};

export const MIN_PLAYERS_TO_START = 2;

export const DISCONNECTED_PLAYER_GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes

export const CHAT_LOG_MAX_MESSAGES = 200;

export const SESSION_TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export const ACTION_POINTS_PER_TURN = 10;

// Phase 3: full internal affairs. All formulas below are explicitly
// placeholders to get a working, testable economy end-to-end -- real
// balancing is a separate pass called out in the roadmap, not part of this
// architecture work.

export const STARTING_POPULATION = 100;
export const STARTING_GOLD = 50;
export const STARTING_GRAIN_PER_TYPE = 30;

export const WAREHOUSE_CAPACITY: Record<ResourceType, number> = {
  rice: 500,
  wheat: 500,
  potato: 500,
  cotton: 300,
  hemp: 300,
  cattle: 300,
  horse: 300,
  pig: 300,
  leather: 200,
  spear: 200,
  bow: 200,
  crossbow: 150,
  shield: 200,
  horseArmor: 150,
  armor: 150,
  gold: 999_999, // effectively uncapped
};

export const WAREHOUSE_DECAY_RATE = 0.02; // applied per turn after production/consumption; gold does not decay

export const AGRICULTURE_BASE_OUTPUT_PER_TYPE = 4;
export const AGRICULTURE_OUTPUT_PER_LEVEL = 1.5;

export const HUSBANDRY_BASE_OUTPUT_PER_TYPE = 3;
export const HUSBANDRY_OUTPUT_PER_LEVEL = 1.2;
export const LEATHER_YIELD_RATIO = 0.25; // leather produced = this fraction of total meat produced

export const TAX_OFFICE_GOLD_PER_LEVEL = 8;
export const TRADING_POST_GOLD_PER_LEVEL = 3; // "trade profit" placeholder; its event-probability effect wires in during Phase 7

export const ARMORY_BASE_OUTPUT_PER_TYPE = 1;
export const ARMORY_OUTPUT_PER_LEVEL = 0.8;
export const WEAPONS_WORKSHOP_BOOST_PER_LEVEL = 1; // added on top of armory output, spear/bow/shield/horseArmor only

export const BLACKSMITH_PRODUCTION_BOOST_PER_LEVEL = 0.1; // +10% agriculture & husbandry output per level
export const PUBLIC_WORKS_GOLD_BOOST_PER_LEVEL = 0.05; // +5% tax office gold per level
export const PUBLIC_WORKS_MARKET_RATE_BOOST_PER_LEVEL = 0.03;

export const MARKET_BASE_EXCHANGE_RATE = 0.33; // roughly 3:1 at market level 0
export const MARKET_RATE_IMPROVEMENT_PER_LEVEL = 0.05;
export const MARKET_MAX_EXCHANGE_RATE = 0.95; // never reaches a full 1:1
export const MARKET_EXCHANGE_POINT_COST = 1;
export const MARKET_EXCHANGE_TARGET: ResourceType = 'gold'; // simplification: the market always converts a chosen surplus resource into gold

export const POPULATION_GROWTH_BASE_CHANCE = 0.15;
export const POPULATION_GROWTH_CHANCE_PER_FACILITY_LEVEL = 0.01; // summed across every facility level in the city
export const POPULATION_GROWTH_CHANCE_MAX = 0.6;
export const POPULATION_GROWTH_MIN = 2;
export const POPULATION_GROWTH_MAX = 8;

export const GRAIN_CONSUMPTION_PER_POPULATION = 0.05; // per turn, drawn from the rice/wheat/potato pool
export const PRODUCTION_BONUS_PER_CAPITA = 0.001; // multiplier bonus to total production based on population

export const RECRUIT_POINT_COST_PER_UNIT = 1;
export const RECRUIT_GOLD_COST_PER_UNIT = 2;
export const RECRUIT_EQUIPMENT_COST: Partial<Record<UnitType, ResourceType>> = {
  spearman: 'spear',
  crossbowman: 'bow',
  cavalry: 'horseArmor',
};
export const RECRUIT_MOUNT_COST_PER_CAVALRY = 1; // consumes 1 horse (livestock) per cavalry recruited
export const MAX_TROOPS_PER_POPULATION_RATIO = 0.3;

export const TRAIN_POINTS_PER_LEVEL = 2;
export const MAX_TRAINING_LEVEL = 100;
