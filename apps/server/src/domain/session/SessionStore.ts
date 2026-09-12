import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PlayerId, PlayerIdentity, SessionTokenPayload } from '@sam-simul/shared';
import { SESSION_TOKEN_TTL_MS } from '@sam-simul/shared';
import { env } from '../../config/env.js';

// Minimal identity layer: no accounts/passwords. A client-generated persistent
// playerId is the stable key everywhere in the system; the session token just
// proves "this socket/request currently speaks for that playerId" for a while.
export class SessionStore {
  private identities = new Map<PlayerId, PlayerIdentity>();

  upsertIdentity(playerId: PlayerId, displayName: string): PlayerIdentity {
    const identity: PlayerIdentity = { playerId, displayName };
    this.identities.set(playerId, identity);
    return identity;
  }

  getIdentity(playerId: PlayerId): PlayerIdentity | undefined {
    return this.identities.get(playerId);
  }

  issueToken(playerId: PlayerId): string {
    const payload: SessionTokenPayload = { playerId, exp: Date.now() + SESSION_TOKEN_TTL_MS };
    const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const signature = this.sign(body);
    return `${body}.${signature}`;
  }

  verifyToken(token: string): PlayerId | null {
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;

    const expectedSignature = this.sign(body);
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    let payload: SessionTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      return null;
    }

    if (payload.exp < Date.now()) return null;
    return payload.playerId;
  }

  private sign(body: string): string {
    return createHmac('sha256', env.sessionSecret).update(body).digest('base64url');
  }
}

export const sessionStore = new SessionStore();
