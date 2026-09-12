import type { MapSize, ProbabilityTier, RoomSettings } from '../types/room.js';

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

// Phase 2 vertical slice: one city, one resource (agriculture -> grain).
// Formulas are placeholders for proving out the turn-engine architecture;
// real balancing happens when Phase 3 implements all internal-affairs domains.
export const ACTION_POINTS_PER_TURN = 10;
export const STARTING_GRAIN_STOCK = 100;
export const GRAIN_BASE_PRODUCTION_PER_TURN = 20;
export const GRAIN_PRODUCTION_PER_AGRICULTURE_POINT = 5;
