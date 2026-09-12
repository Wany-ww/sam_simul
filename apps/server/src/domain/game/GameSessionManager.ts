import type { GameCity, GameState, PlayerId, PlayerOrder, Room, RoomId } from '@sam-simul/shared';
import { ACTION_POINTS_PER_TURN, STARTING_GRAIN_STOCK } from '@sam-simul/shared';
import { resolveTurn } from './GameEngine.js';
import type { AppServer } from '../../sockets/types.js';

interface GameSession {
  state: GameState;
  orders: Map<PlayerId, PlayerOrder>;
  turnTimeLimitSeconds: number;
  timer: NodeJS.Timeout;
}

// Orchestrates per-room game state: owns the turn timer and pushes game:state
// to clients on start/submit/resolve. resolveTurn itself (GameEngine.ts) stays
// a pure function; this class is the only place that touches the clock or the
// socket layer, so the domain logic remains unit-testable in isolation.
export class GameSessionManager {
  private sessions = new Map<RoomId, GameSession>();

  constructor(private io: AppServer) {}

  startGame(room: Room): void {
    const cities: GameCity[] = room.players.map((player) => ({
      cityId: `${player.playerId}-city1`,
      ownerId: player.playerId,
      name: `${player.displayName}의 도시`,
      agricultureLevel: 0,
      grainStock: STARTING_GRAIN_STOCK,
    }));

    const state: GameState = {
      roomId: room.roomId,
      turnNumber: 1,
      turnEndsAt: Date.now() + room.settings.turnTimeLimitSeconds * 1000,
      actionPointsPerTurn: ACTION_POINTS_PER_TURN,
      cities,
      submittedPlayerIds: [],
      lastTurnLog: [],
    };

    this.sessions.set(room.roomId, {
      state,
      orders: new Map(),
      turnTimeLimitSeconds: room.settings.turnTimeLimitSeconds,
      timer: this.scheduleResolution(room.roomId, room.settings.turnTimeLimitSeconds),
    });

    this.broadcast(room.roomId);
  }

  submitOrder(roomId: RoomId, playerId: PlayerId, order: PlayerOrder): void {
    const session = this.sessions.get(roomId);
    if (!session) return;

    const isCityOwner = session.state.cities.some((c) => c.ownerId === playerId);
    if (!isCityOwner) return;

    session.orders.set(playerId, order);
    if (!session.state.submittedPlayerIds.includes(playerId)) {
      session.state.submittedPlayerIds = [...session.state.submittedPlayerIds, playerId];
    }

    const allSubmitted = session.state.cities.every((c) => session.orders.has(c.ownerId));
    if (allSubmitted) {
      clearTimeout(session.timer);
      this.resolve(roomId);
      return;
    }

    this.broadcast(roomId);
  }

  endGame(roomId: RoomId): void {
    const session = this.sessions.get(roomId);
    if (!session) return;
    clearTimeout(session.timer);
    this.sessions.delete(roomId);
  }

  private resolve(roomId: RoomId): void {
    const session = this.sessions.get(roomId);
    if (!session) return;

    const { nextState } = resolveTurn(session.state, session.orders, ACTION_POINTS_PER_TURN, `${roomId}:${session.state.turnNumber}`);

    session.state = { ...nextState, turnEndsAt: Date.now() + session.turnTimeLimitSeconds * 1000 };
    session.orders = new Map();
    session.timer = this.scheduleResolution(roomId, session.turnTimeLimitSeconds);

    this.broadcast(roomId);
  }

  private scheduleResolution(roomId: RoomId, turnTimeLimitSeconds: number): NodeJS.Timeout {
    return setTimeout(() => this.resolve(roomId), turnTimeLimitSeconds * 1000);
  }

  private broadcast(roomId: RoomId): void {
    const session = this.sessions.get(roomId);
    if (!session) return;
    this.io.to(roomId).emit('game:state', session.state);
  }
}
