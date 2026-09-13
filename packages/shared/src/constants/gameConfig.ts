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

// Phase 4: map & movement.
export const TURN_DURATION_DAYS = 5; // how many in-game march days one turn resolution advances
export const MARCH_ORDER_POINT_COST = 1;

// Phase 5: combat core. Fought as daily sub-ticks (up to TURN_DURATION_DAYS
// per turn) rather than one batch roll per turn, so morale/panic/rout can
// track the spec's "하루마다 사기 감소" per-day cadence. Uses the 4 base unit
// types only -- specialized variants (장창병/경기병 etc.) unlock in Phase 6
// once armory tech gating and generals exist.
export const STARTING_MORALE = 100;
export const MAX_WALL_DURABILITY = 500;

export const UNIT_COMBAT_VALUE: Record<UnitType, number> = {
  spearman: 3,
  crossbowman: 4,
  cavalry: 5,
  engineer: 1,
};
// Combat value while attacking a city (replaces UNIT_COMBAT_VALUE entirely
// in that context): already encodes the spec's "attack power reduced to 1/3,
// cavalry reduced much further, engineers have high siege value" -- there is
// no separate flat siege penalty multiplier layered on top of this table.
export const UNIT_SIEGE_VALUE: Record<UnitType, number> = {
  spearman: 1,
  crossbowman: 1,
  cavalry: 0.5,
  engineer: 4,
};

export const TRAINING_COMBAT_BONUS_PER_LEVEL = 0.01; // +1% combat power per training level
export const MORALE_COMBAT_MULTIPLIER_MIN = 0.3; // power scales linearly from this (morale 0) up to 1x (morale 100)

export const STANCE_ATTACK_DAMAGE_MULTIPLIER = 1.25;
export const STANCE_ATTACK_MORALE_GAIN = 3; // per day, for the attacking-stance side
export const STANCE_DEFEND_DAMAGE_TAKEN_MULTIPLIER = 0.75;
export const FORTIFICATION_DAMAGE_TAKEN_MULTIPLIER = 0.7;

export const DAILY_CASUALTY_COEFFICIENT = 0.05; // fraction of the opponent's effective power converted to casualties per day
export const MORALE_DAILY_DECAY = 3;
export const PANIC_LOSS_FRACTION_THRESHOLD = 0.15; // losing more than this fraction of one's force in a single day triggers panic
export const PANIC_MORALE_PENALTY = 15;
export const SIEGE_DEFENDER_MORALE_DAILY_PENALTY = 5; // extra morale loss for the besieged side, on top of the normal daily decay
export const ROUT_TROOP_THRESHOLD = 5; // a side at or below this troop count routs (eliminated) immediately
export const WALL_DAMAGE_COEFFICIENT = 0.1; // fraction of the siege attacker's daily power applied directly to wallDurability

export const ARMY_STANCE_ORDER_POINT_COST = 1;
export const FORTIFY_ORDER_POINT_COST = 2;
export const FORTIFICATION_MORALE_BONUS = 10; // one-time, applied when fortifying

// Phase 6: generals. Appearance chance combines the room's
// generalAppearanceProbability tier (GENERAL_APPEARANCE_BASE_PROBABILITY,
// already defined above) with population and total facility development,
// per the spec's "인구 수 + 내정 수치에 따라 장수 등장확률 증가".
export const GENERAL_APPEARANCE_POPULATION_DIVISOR = 500; // +1% appearance chance per this many population
export const GENERAL_APPEARANCE_FACILITY_LEVEL_BONUS = 0.002; // per total facility level, summed across all domains
export const GENERAL_APPEARANCE_CHANCE_MAX = 0.5;

export const ASSIGN_GENERAL_ORDER_POINT_COST = 1;
export const UNASSIGN_GENERAL_ORDER_POINT_COST = 0; // freeing a general back up costs nothing
