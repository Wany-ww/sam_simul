import { Router } from 'express';
import { sessionStore } from '../../domain/session/SessionStore.js';

export const authRouter = Router();

authRouter.post('/session', (req, res) => {
  const { persistentPlayerId, displayName } = req.body ?? {};

  if (typeof persistentPlayerId !== 'string' || !persistentPlayerId) {
    res.status(400).json({ error: 'persistentPlayerId is required' });
    return;
  }

  const trimmedName = typeof displayName === 'string' ? displayName.trim().slice(0, 24) : '';
  if (!trimmedName) {
    res.status(400).json({ error: 'displayName is required' });
    return;
  }

  sessionStore.upsertIdentity(persistentPlayerId, trimmedName);
  const sessionToken = sessionStore.issueToken(persistentPlayerId);

  res.json({ sessionToken, playerId: persistentPlayerId });
});
