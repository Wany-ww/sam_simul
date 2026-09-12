import type { RoomErrorCode } from '@sam-simul/shared';

export class RoomError extends Error {
  constructor(
    public code: RoomErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'RoomError';
  }
}
