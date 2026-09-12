import { Router } from 'express';
import type { RoomManager } from '../../domain/room/RoomManager.js';

export function createRoomsRouter(roomManager: RoomManager): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(roomManager.listSummaries());
  });

  return router;
}
