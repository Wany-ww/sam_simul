import type { GameCity, GameState, PlayerId, PlayerOrder, TurnLogEntry } from '@sam-simul/shared';
import { GRAIN_BASE_PRODUCTION_PER_TURN, GRAIN_PRODUCTION_PER_AGRICULTURE_POINT, createSeededRng } from '@sam-simul/shared';

export interface ResolveTurnResult {
  nextState: GameState;
  log: TurnLogEntry[];
}

// Pure, deterministic turn resolution: same (state, orders, seed) always
// produces the same result. No Date.now()/Math.random() calls here -- that is
// what makes turns replayable (debugging, Phase 8 battle-log playback) and
// unit-testable without any network/socket layer. `rngSeed` is threaded
// through from Phase 2 even though no formula below consumes it yet, so
// Phase 3+ (disaster/event rolls) doesn't require changing this signature.
export function resolveTurn(
  state: GameState,
  orders: Map<PlayerId, PlayerOrder>,
  actionPointsPerTurn: number,
  rngSeed: string,
): ResolveTurnResult {
  const rng = createSeededRng(rngSeed);
  void rng; // unused until Phase 3+ introduces probability-driven effects

  const log: TurnLogEntry[] = [];

  const nextCities: GameCity[] = state.cities.map((city) => {
    const order = orders.get(city.ownerId);
    const agricultureInvestment = clamp(order?.agricultureInvestment ?? 0, 0, actionPointsPerTurn);
    const newAgricultureLevel = city.agricultureLevel + agricultureInvestment;
    const grainProduced = GRAIN_BASE_PRODUCTION_PER_TURN + newAgricultureLevel * GRAIN_PRODUCTION_PER_AGRICULTURE_POINT;
    const newGrainStock = city.grainStock + grainProduced;

    log.push({
      turnNumber: state.turnNumber,
      cityId: city.cityId,
      playerId: city.ownerId,
      agricultureInvestment,
      grainProduced,
      newAgricultureLevel,
      newGrainStock,
    });

    return { ...city, agricultureLevel: newAgricultureLevel, grainStock: newGrainStock };
  });

  const nextState: GameState = {
    ...state,
    turnNumber: state.turnNumber + 1,
    cities: nextCities,
    submittedPlayerIds: [],
    lastTurnLog: log,
  };

  return { nextState, log };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
