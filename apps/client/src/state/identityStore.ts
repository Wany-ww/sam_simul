const PLAYER_ID_KEY = 'sam-simul:playerId';
const DISPLAY_NAME_KEY = 'sam-simul:displayName';
const LAST_ROOM_ID_KEY = 'sam-simul:lastRoomId';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for older browsers without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreatePlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = generateUuid();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getStoredDisplayName(): string {
  return localStorage.getItem(DISPLAY_NAME_KEY) ?? '';
}

export function setStoredDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_NAME_KEY, name);
}

export function getLastRoomId(): string | null {
  return localStorage.getItem(LAST_ROOM_ID_KEY);
}

export function setLastRoomId(roomId: string | null): void {
  if (roomId) localStorage.setItem(LAST_ROOM_ID_KEY, roomId);
  else localStorage.removeItem(LAST_ROOM_ID_KEY);
}
