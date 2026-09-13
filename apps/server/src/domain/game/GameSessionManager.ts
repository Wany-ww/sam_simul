import type { GameCity, GameState, PlayerId, PlayerOrder, Room, RoomId, Warehouse } from '@sam-simul/shared';
import {
  ACTION_POINTS_PER_TURN,
  DISASTER_FREQUENCY_PER_TURN_PROBABILITY,
  EVENT_PROBABILITY_PER_TURN_PROBABILITY,
  GENERAL_APPEARANCE_BASE_PROBABILITY,
  GRAIN_RESOURCES,
  MAP_SIZE_TRAVEL_DAY_MULTIPLIER,
  MAX_WALL_DURABILITY,
  STARTING_CITY_NODE_IDS,
  STARTING_GOLD,
  STARTING_GRAIN_PER_TYPE,
  STARTING_MORALE,
  STARTING_POPULATION,
  createSeededRng,
} from '@sam-simul/shared';
import { resolveTurn } from './GameEngine.js';
import { decideAiOrder } from './ai.js';
import type { AppServer } from '../../sockets/types.js';

function startingWarehouse(): Warehouse {
  const warehouse: Warehouse = { gold: STARTING_GOLD };
  for (const grain of GRAIN_RESOURCES) warehouse[grain] = STARTING_GRAIN_PER_TYPE;
  return warehouse;
}

interface GameSession {
  state: GameState;
  orders: Map<PlayerId, PlayerOrder>;
  turnTimeLimitSeconds: number;
  mapSizeMultiplier: number;
  generalAppearanceBaseChance: number;
  disasterBaseChance: number;
  eventBaseChance: number;
  aiPlayerIds: Set<PlayerId>;
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
    const cities: GameCity[] = room.players.map((player, index) => ({
      cityId: `${player.playerId}-city1`,
      ownerId: player.playerId,
      name: `${player.displayName}의 도시`,
      nodeId: STARTING_CITY_NODE_IDS[index % STARTING_CITY_NODE_IDS.length],
      population: STARTING_POPULATION,
      facilities: {
        agriculture: 0,
        animalHusbandry: 0,
        commerce: { tradingPost: 0, taxOffice: 0, market: 0 },
        industry: { armory: 0, weaponsWorkshop: 0, blacksmith: 0, publicWorks: 0 },
      },
      warehouse: startingWarehouse(),
      troops: [],
      garrisonMorale: STARTING_MORALE,
      wallDurability: MAX_WALL_DURABILITY,
      generals: [],
      activeEffects: [],
    }));

    const state: GameState = {
      roomId: room.roomId,
      turnNumber: 1,
      turnEndsAt: Date.now() + room.settings.turnTimeLimitSeconds * 1000,
      actionPointsPerTurn: ACTION_POINTS_PER_TURN,
      cities,
      armies: [],
      submittedPlayerIds: [],
      lastTurnLog: [],
    };

    const session: GameSession = {
      state,
      orders: new Map(),
      turnTimeLimitSeconds: room.settings.turnTimeLimitSeconds,
      mapSizeMultiplier: MAP_SIZE_TRAVEL_DAY_MULTIPLIER[room.settings.mapSize],
      generalAppearanceBaseChance: GENERAL_APPEARANCE_BASE_PROBABILITY[room.settings.generalAppearanceProbability],
      disasterBaseChance: DISASTER_FREQUENCY_PER_TURN_PROBABILITY[room.settings.disasterFrequency],
      eventBaseChance: EVENT_PROBABILITY_PER_TURN_PROBABILITY[room.settings.eventProbability],
      aiPlayerIds: new Set(room.players.filter((p) => p.isAI).map((p) => p.playerId)),
      timer: this.scheduleResolution(room.roomId, room.settings.turnTimeLimitSeconds),
    };
    this.sessions.set(room.roomId, session);
    this.fillAiOrders(session);

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

  getState(roomId: RoomId): GameState | undefined {
    return this.sessions.get(roomId)?.state;
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

    const { nextState } = resolveTurn(
      session.state,
      session.orders,
      ACTION_POINTS_PER_TURN,
      `${roomId}:${session.state.turnNumber}`,
      session.mapSizeMultiplier,
      session.generalAppearanceBaseChance,
      session.disasterBaseChance,
      session.eventBaseChance,
    );

    session.state = { ...nextState, turnEndsAt: Date.now() + session.turnTimeLimitSeconds * 1000 };
    session.orders = new Map();
    session.timer = this.scheduleResolution(roomId, session.turnTimeLimitSeconds);
    this.fillAiOrders(session);

    this.broadcast(roomId);
  }

  /** Pre-fills this turn's orders for every AI-controlled city so a room only ever waits on its human players. */
  private fillAiOrders(session: GameSession): void {
    if (session.aiPlayerIds.size === 0) return;

    for (const aiPlayerId of session.aiPlayerIds) {
      const city = session.state.cities.find((c) => c.ownerId === aiPlayerId);
      if (!city) continue;

      const rng = createSeededRng(`${session.state.roomId}:${session.state.turnNumber}:ai:${aiPlayerId}`);
      session.orders.set(aiPlayerId, decideAiOrder(city, ACTION_POINTS_PER_TURN, rng));
      if (!session.state.submittedPlayerIds.includes(aiPlayerId)) {
        session.state.submittedPlayerIds = [...session.state.submittedPlayerIds, aiPlayerId];
      }
    }
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
