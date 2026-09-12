import { describe, expect, it } from 'vitest';
import type { GameState, PlayerOrder } from '@sam-simul/shared';
import { ACTION_POINTS_PER_TURN, GRAIN_BASE_PRODUCTION_PER_TURN, GRAIN_PRODUCTION_PER_AGRICULTURE_POINT, STARTING_GRAIN_STOCK } from '@sam-simul/shared';
import { resolveTurn } from '../../../src/domain/game/GameEngine.js';

function makeState(): GameState {
  return {
    roomId: 'room-1',
    turnNumber: 1,
    turnEndsAt: 0,
    actionPointsPerTurn: ACTION_POINTS_PER_TURN,
    cities: [
      { cityId: 'p1-city1', ownerId: 'p1', name: 'p1의 도시', agricultureLevel: 0, grainStock: STARTING_GRAIN_STOCK },
      { cityId: 'p2-city1', ownerId: 'p2', name: 'p2의 도시', agricultureLevel: 3, grainStock: STARTING_GRAIN_STOCK },
    ],
    submittedPlayerIds: [],
    lastTurnLog: [],
  };
}

describe('resolveTurn', () => {
  it('increases agricultureLevel by the submitted investment and produces grain accordingly', () => {
    const state = makeState();
    const orders = new Map<string, PlayerOrder>([['p1', { agricultureInvestment: 4 }]]);

    const { nextState } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1');

    const p1 = nextState.cities.find((c) => c.ownerId === 'p1')!;
    expect(p1.agricultureLevel).toBe(4);
    expect(p1.grainStock).toBe(STARTING_GRAIN_STOCK + GRAIN_BASE_PRODUCTION_PER_TURN + 4 * GRAIN_PRODUCTION_PER_AGRICULTURE_POINT);
  });

  it('treats a missing order as zero investment (no auto-submit of prior orders)', () => {
    const state = makeState();
    const orders = new Map<string, PlayerOrder>(); // p2 submitted nothing

    const { nextState } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1');

    const p2 = nextState.cities.find((c) => c.ownerId === 'p2')!;
    expect(p2.agricultureLevel).toBe(3); // unchanged from before
    expect(p2.grainStock).toBe(STARTING_GRAIN_STOCK + GRAIN_BASE_PRODUCTION_PER_TURN + 3 * GRAIN_PRODUCTION_PER_AGRICULTURE_POINT);
  });

  it('clamps investment to the action point budget even if a malformed order exceeds it', () => {
    const state = makeState();
    const orders = new Map<string, PlayerOrder>([['p1', { agricultureInvestment: 999 }]]);

    const { nextState } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1');

    const p1 = nextState.cities.find((c) => c.ownerId === 'p1')!;
    expect(p1.agricultureLevel).toBe(ACTION_POINTS_PER_TURN);
  });

  it('clamps negative investment to zero', () => {
    const state = makeState();
    const orders = new Map<string, PlayerOrder>([['p1', { agricultureInvestment: -5 }]]);

    const { nextState } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1');

    const p1 = nextState.cities.find((c) => c.ownerId === 'p1')!;
    expect(p1.agricultureLevel).toBe(0);
  });

  it('is a pure function: identical inputs always produce identical output', () => {
    const state = makeState();
    const orders = new Map<string, PlayerOrder>([
      ['p1', { agricultureInvestment: 5 }],
      ['p2', { agricultureInvestment: 2 }],
    ]);

    const a = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'same-seed');
    const b = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'same-seed');

    expect(a.nextState).toEqual(b.nextState);
    expect(a.log).toEqual(b.log);
  });

  it('increments the turn number and resets submittedPlayerIds', () => {
    const state = { ...makeState(), submittedPlayerIds: ['p1', 'p2'] };
    const { nextState } = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1');

    expect(nextState.turnNumber).toBe(2);
    expect(nextState.submittedPlayerIds).toEqual([]);
  });

  it('does not mutate the input state', () => {
    const state = makeState();
    const snapshot = JSON.parse(JSON.stringify(state));
    resolveTurn(state, new Map([['p1', { agricultureInvestment: 5 }]]), ACTION_POINTS_PER_TURN, 'seed-1');

    expect(state).toEqual(snapshot);
  });
});
