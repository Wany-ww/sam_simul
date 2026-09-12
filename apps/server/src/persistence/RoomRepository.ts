import type { Room, RoomId } from '@sam-simul/shared';

// Swappable persistence boundary. Phase 1 ships InMemoryRoomRepository; if the
// project ever needs multi-instance scaling or crash durability, only the
// implementation behind this interface needs to change (e.g. Redis-backed).
export interface RoomRepository {
  get(roomId: RoomId): Room | undefined;
  set(room: Room): void;
  delete(roomId: RoomId): void;
  list(): Room[];
}
