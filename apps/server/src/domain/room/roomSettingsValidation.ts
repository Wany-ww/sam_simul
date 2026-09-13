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
    throw new RoomError('INVALID_SETTINGS', `턴 시간은 ${turnTimeLimitSeconds.min}초에서 ${turnTimeLimitSeconds.max}초 사이여야 합니다.`);
  }

  if (settings.maxPlayers < maxPlayers.min || settings.maxPlayers > maxPlayers.max) {
    throw new RoomError('INVALID_SETTINGS', `최대 인원은 ${maxPlayers.min}명에서 ${maxPlayers.max}명 사이여야 합니다.`);
  }

  if (!MAP_SIZES.has(settings.mapSize)) {
    throw new RoomError('INVALID_SETTINGS', '올바르지 않은 맵 크기입니다.');
  }

  if (!TIERS_WITH_NONE.has(settings.disasterFrequency)) {
    throw new RoomError('INVALID_SETTINGS', '올바르지 않은 재난 빈도입니다.');
  }

  if (!TIERS.has(settings.generalAppearanceProbability)) {
    throw new RoomError('INVALID_SETTINGS', '올바르지 않은 장수 등장 확률입니다.');
  }

  if (!TIERS.has(settings.eventProbability)) {
    throw new RoomError('INVALID_SETTINGS', '올바르지 않은 이벤트 발생 확률입니다.');
  }
}
