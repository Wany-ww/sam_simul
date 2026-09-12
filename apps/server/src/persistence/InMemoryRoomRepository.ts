import type { Room, RoomId } from '@sam-simul/shared';
import type { RoomRepository } from './RoomRepository.js';

export class InMemoryRoomRepository implements RoomRepository {
  private rooms = new Map<RoomId, Room>();

  get(roomId: RoomId): Room | undefined {
    return this.rooms.get(roomId);
  }

  set(room: Room): void {
    this.rooms.set(room.roomId, room);
  }

  delete(roomId: RoomId): void {
    this.rooms.delete(roomId);
  }

  list(): Room[] {
    return [...this.rooms.values()];
  }
}
