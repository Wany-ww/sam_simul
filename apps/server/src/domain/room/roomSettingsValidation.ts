import type { RoomSettings } from '@sam-simul/shared';
import { ROOM_SETTINGS_BOUNDS } from '@sam-simul/shared';
import { RoomError } from './RoomError.js';

const MAP_SIZES = new Set(['small', 'medium', 'large']);
const TIERS = new Set(['low', 'normal', 'high']);
const TIERS_WITH_NONE = new Set(['none', 'low', 'normal', 'high']);

export function validateRoomSettings(settings: RoomSettings): void {
  const { turnTimeLimitSeconds, maxPlayers } = ROOM_SETTINGS_BOUNDS;

  if (
    settings.turnTimeLimitSeconds < turnTimeLimitSeconds.min ||
    settings.turnTimeLimitSeconds > turnTimeLimitSeconds.max
  ) {
    throw new RoomError('INVALID_SETTINGS', `turnTimeLimitSeconds must be between ${turnTimeLimitSeconds.min} and ${turnTimeLimitSeconds.max}`);
  }

  if (settings.maxPlayers < maxPlayers.min || settings.maxPlayers > maxPlayers.max) {
    throw new RoomError('INVALID_SETTINGS', `maxPlayers must be between ${maxPlayers.min} and ${maxPlayers.max}`);
  }

  if (!MAP_SIZES.has(settings.mapSize)) {
    throw new RoomError('INVALID_SETTINGS', 'invalid mapSize');
  }

  if (!TIERS_WITH_NONE.has(settings.disasterFrequency)) {
    throw new RoomError('INVALID_SETTINGS', 'invalid disasterFrequency');
  }

  if (!TIERS.has(settings.generalAppearanceProbability)) {
    throw new RoomError('INVALID_SETTINGS', 'invalid generalAppearanceProbability');
  }

  if (!TIERS.has(settings.eventProbability)) {
    throw new RoomError('INVALID_SETTINGS', 'invalid eventProbability');
  }
}
