import { describe, expect, it } from 'vitest';
import type { GameState, PlayerOrder } from '@sam-simul/shared';
import { ACTION_POINTS_PER_TURN } from '@sam-simul/shared';
import { resolveTurn } from '../../../src/domain/game/GameEngine.js';

function emptyOrder(): PlayerOrder {
  return { investment: { agriculture: 0, animalHusbandry: 0, commerce: {}, industry: {} } };
}

function makeState(): GameState {
  return {
    roomId: 'room-1',
    turnNumber: 1,
    turnEndsAt: 0,
    actionPointsPerTurn: ACTION_POINTS_PER_TURN,
    cities: [
      {
        cityId: 'p1-city1',
        ownerId: 'p1',
        name: 'p1의 도시',
        population: 100,
        facilities: {
          agriculture: 0,
          animalHusbandry: 0,
          commerce: { tradingPost: 0, taxOffice: 0, market: 0 },
          industry: { armory: 0, weaponsWorkshop: 0, blacksmith: 0, publicWorks: 0 },
        },
        warehouse: { rice: 30, wheat: 30, potato: 30, gold: 50 },
        troops: [],
      },
    ],
    submittedPlayerIds: [],
    lastTurnLog: [],
  };
}

describe('resolveTurn', () => {
  it('applies facility investment and produces resources accordingly', () => {
    const state = makeState();
    const orders = new Map<string, PlayerOrder>([
      ['p1', { investment: { agriculture: 5, animalHusbandry: 0, commerce: {}, industry: {} } }],
    ]);

    const { nextState, log } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1');
    const city = nextState.cities[0];

    expect(city.facilities.agriculture).toBe(5);
    expect(city.warehouse.rice).toBeGreaterThan(30);
    expect(log[0].resourceProduced.rice).toBeGreaterThan(0);
  });

  it('treats a missing order as fully empty (facility levels unchanged, only base production occurs)', () => {
    const state = makeState();
    const { nextState } = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1');
    expect(nextState.cities[0].facilities.agriculture).toBe(0);
  });

  it('is a pure function: identical inputs always produce identical output', () => {
    const state = makeState();
    const orders = new Map<string, PlayerOrder>([['p1', { investment: { agriculture: 4, animalHusbandry: 3, commerce: {}, industry: {} } }]]);

    const a = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'same-seed');
    const b = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'same-seed');
    expect(a.nextState).toEqual(b.nextState);
  });

  it('does not mutate the input state', () => {
    const state = makeState();
    const snapshot = JSON.parse(JSON.stringify(state));
    resolveTurn(state, new Map([['p1', { investment: { agriculture: 5, animalHusbandry: 0, commerce: {}, industry: {} } }]]), ACTION_POINTS_PER_TURN, 'seed-1');
    expect(state).toEqual(snapshot);
  });

  it('increments turn number and resets submittedPlayerIds', () => {
    const state = { ...makeState(), submittedPlayerIds: ['p1'] };
    const { nextState } = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1');
    expect(nextState.turnNumber).toBe(2);
    expect(nextState.submittedPlayerIds).toEqual([]);
  });

  it('handles a full order (investment + recruit + train + market exchange) within one turn, clamped to budget', () => {
    const state = makeState();
    state.cities[0].facilities.industry.armory = 10; // ensure spear stock exists for recruitment
    state.cities[0].warehouse.spear = 50;

    const orders = new Map<string, PlayerOrder>([
      [
        'p1',
        {
          investment: { agriculture: 0, animalHusbandry: 0, commerce: {}, industry: {} },
          recruit: { unitType: 'spearman', count: 5 },
          train: { unitType: 'spearman', pointsInvested: 2 },
          marketExchange: { from: 'rice', amount: 5 },
        },
      ],
    ]);

    const { nextState, log } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1');
    const entry = log[0];

    expect(entry.recruited).toEqual({ unitType: 'spearman', count: 5 });
    expect(nextState.cities[0].troops).toHaveLength(1);
    expect(nextState.cities[0].troops[0].count).toBe(5);
    // recruit (5 pts) + train (2 pts) = 7, leaving 3 pts >= MARKET_EXCHANGE_POINT_COST (1), so it should go through
    expect(entry.marketExchange).toBeDefined();
  });

  it('rolls population growth deterministically from the seed', () => {
    const state = makeState();
    const a = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'growth-seed').nextState.cities[0].population;
    const b = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'growth-seed').nextState.cities[0].population;
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(state.cities[0].population);
  });
});
