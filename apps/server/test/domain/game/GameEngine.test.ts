import { describe, expect, it } from 'vitest';
import type { GameState, PlayerOrder } from '@sam-simul/shared';
import { ACTION_POINTS_PER_TURN } from '@sam-simul/shared';
import { resolveTurn } from '../../../src/domain/game/GameEngine.js';

const MEDIUM_MAP_MULTIPLIER = 1;

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
        nodeId: 'luoyang',
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
    armies: [],
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

    const { nextState, log } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER);
    const city = nextState.cities[0];

    expect(city.facilities.agriculture).toBe(5);
    expect(city.warehouse.rice).toBeGreaterThan(30);
    expect(log[0].resourceProduced.rice).toBeGreaterThan(0);
  });

  it('treats a missing order as fully empty (facility levels unchanged, only base production occurs)', () => {
    const state = makeState();
    const { nextState } = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER);
    expect(nextState.cities[0].facilities.agriculture).toBe(0);
  });

  it('is a pure function: identical inputs always produce identical output', () => {
    const state = makeState();
    const orders = new Map<string, PlayerOrder>([['p1', { investment: { agriculture: 4, animalHusbandry: 3, commerce: {}, industry: {} } }]]);

    const a = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'same-seed', MEDIUM_MAP_MULTIPLIER);
    const b = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'same-seed', MEDIUM_MAP_MULTIPLIER);
    expect(a.nextState).toEqual(b.nextState);
  });

  it('does not mutate the input state', () => {
    const state = makeState();
    const snapshot = JSON.parse(JSON.stringify(state));
    resolveTurn(
      state,
      new Map([['p1', { investment: { agriculture: 5, animalHusbandry: 0, commerce: {}, industry: {} } }]]),
      ACTION_POINTS_PER_TURN,
      'seed-1',
      MEDIUM_MAP_MULTIPLIER,
    );
    expect(state).toEqual(snapshot);
  });

  it('increments turn number and resets submittedPlayerIds', () => {
    const state = { ...makeState(), submittedPlayerIds: ['p1'] };
    const { nextState } = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER);
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

    const { nextState, log } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER);
    const entry = log[0];

    expect(entry.recruited).toEqual({ unitType: 'spearman', count: 5 });
    expect(nextState.cities[0].troops).toHaveLength(1);
    expect(nextState.cities[0].troops[0].count).toBe(5);
    // recruit (5 pts) + train (2 pts) = 7, leaving 3 pts >= MARKET_EXCHANGE_POINT_COST (1), so it should go through
    expect(entry.marketExchange).toBeDefined();
  });

  it('rolls population growth deterministically from the seed', () => {
    const state = makeState();
    const a = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'growth-seed', MEDIUM_MAP_MULTIPLIER).nextState.cities[0].population;
    const b = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'growth-seed', MEDIUM_MAP_MULTIPLIER).nextState.cities[0].population;
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(state.cities[0].population);
  });

  describe('march orders', () => {
    it('creates an army and removes the marching troops from the city (chengdu -> xiangyang, a 6-day edge that outlasts one turn)', () => {
      const state = makeState();
      state.cities[0].nodeId = 'chengdu';
      state.cities[0].troops = [{ unitType: 'spearman', count: 10, trainingLevel: 0 }];

      const orders = new Map<string, PlayerOrder>([
        ['p1', { ...emptyOrder(), march: { unitType: 'spearman', count: 6, destinationNodeId: 'xiangyang' } }],
      ]);

      const { nextState, log } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER);

      expect(nextState.cities[0].troops[0].count).toBe(4);
      expect(nextState.armies).toHaveLength(1);
      expect(nextState.armies[0]).toMatchObject({ ownerId: 'p1', currentNodeId: 'chengdu', destinationNodeId: 'xiangyang' });
      expect(nextState.armies[0].troops[0].count).toBe(6);
      expect(log[0].notes.some((n) => n.includes('출발'))).toBe(true);
    });

    it('marks a short march as arrived the same turn it was ordered, once its travel time is under one turn', () => {
      const state = makeState(); // luoyang -> hulaoGuan is 2 days, well under TURN_DURATION_DAYS (5)
      state.cities[0].troops = [{ unitType: 'spearman', count: 10, trainingLevel: 0 }];

      const orders = new Map<string, PlayerOrder>([
        ['p1', { ...emptyOrder(), march: { unitType: 'spearman', count: 6, destinationNodeId: 'hulaoGuan' } }],
      ]);

      const { nextState, log } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER);

      expect(nextState.armies[0]).toMatchObject({ currentNodeId: 'hulaoGuan', destinationNodeId: null, daysRemaining: 0 });
      expect(log[0].notes.some((n) => n.includes('출발'))).toBe(true);
      expect(log[0].notes.some((n) => n.includes('도착'))).toBe(true);
    });

    it('ignores a march order to a non-adjacent node', () => {
      const state = makeState();
      state.cities[0].troops = [{ unitType: 'spearman', count: 10, trainingLevel: 0 }];

      // jianye is not adjacent to luoyang
      const orders = new Map<string, PlayerOrder>([
        ['p1', { ...emptyOrder(), march: { unitType: 'spearman', count: 6, destinationNodeId: 'jianye' } }],
      ]);

      const { nextState } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER);

      expect(nextState.cities[0].troops[0].count).toBe(10);
      expect(nextState.armies).toHaveLength(0);
    });

    it('advances an existing army toward its destination and marks arrival once days remaining reaches zero', () => {
      const state = makeState();
      state.armies = [
        {
          armyId: 'a1',
          ownerId: 'p1',
          originCityId: 'p1-city1',
          troops: [{ unitType: 'spearman', count: 6, trainingLevel: 0 }],
          currentNodeId: 'luoyang',
          destinationNodeId: 'hulaoGuan',
          daysRemaining: 2, // luoyang->hulaoGuan is 2 base days; TURN_DURATION_DAYS is 5, so this arrives this turn
        },
      ];

      const { nextState, log } = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER);

      expect(nextState.armies[0]).toMatchObject({ currentNodeId: 'hulaoGuan', destinationNodeId: null, daysRemaining: 0 });
      expect(log[0].notes.some((n) => n.includes('도착'))).toBe(true);
    });

    it('does not mark arrival for an army still far from its destination', () => {
      const state = makeState();
      state.armies = [
        {
          armyId: 'a1',
          ownerId: 'p1',
          originCityId: 'p1-city1',
          troops: [{ unitType: 'spearman', count: 6, trainingLevel: 0 }],
          currentNodeId: 'luoyang',
          destinationNodeId: 'wancheng',
          daysRemaining: 20,
        },
      ];

      const { nextState, log } = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER);

      expect(nextState.armies[0].destinationNodeId).toBe('wancheng');
      expect(nextState.armies[0].daysRemaining).toBe(15);
      expect(log[0].notes.some((n) => n.includes('도착'))).toBe(false);
    });

    it('scales march duration with the map-size multiplier', () => {
      const state = makeState();
      state.cities[0].troops = [{ unitType: 'spearman', count: 10, trainingLevel: 0 }];
      const orders = new Map<string, PlayerOrder>([
        ['p1', { ...emptyOrder(), march: { unitType: 'spearman', count: 5, destinationNodeId: 'hulaoGuan' } }],
      ]);

      // small: 2 base days * 0.5 = 1 day, which is under TURN_DURATION_DAYS (5) -> arrives same turn (0 remaining)
      // large: 2 base days * 5 = 10 days, minus TURN_DURATION_DAYS (5) -> still marching afterward
      const small = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', 0.5).nextState.armies[0].daysRemaining;
      const large = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', 5).nextState.armies[0].daysRemaining;

      expect(large).toBeGreaterThan(small);
    });
  });
});
