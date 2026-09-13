import { describe, expect, it } from 'vitest';
import type { General, GameState, PlayerOrder } from '@sam-simul/shared';
import { ACTION_POINTS_PER_TURN } from '@sam-simul/shared';
import { resolveTurn } from '../../../src/domain/game/GameEngine.js';

const MEDIUM_MAP_MULTIPLIER = 1;
const NO_GENERAL_APPEARANCE = 0; // keeps these tests focused on economy/movement/combat, not general RNG
const NO_DISASTER = 0;
const NO_EVENT = 0;

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
        garrisonMorale: 100,
        wallDurability: 500,
        generals: [],
        activeEffects: [],
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

    const { nextState, log } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);
    const city = nextState.cities[0];

    expect(city.facilities.agriculture).toBe(5);
    expect(city.warehouse.rice).toBeGreaterThan(30);
    expect(log[0].resourceProduced.rice).toBeGreaterThan(0);
  });

  it('treats a missing order as fully empty (facility levels unchanged, only base production occurs)', () => {
    const state = makeState();
    const { nextState } = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);
    expect(nextState.cities[0].facilities.agriculture).toBe(0);
  });

  it('is a pure function: identical inputs always produce identical output', () => {
    const state = makeState();
    const orders = new Map<string, PlayerOrder>([['p1', { investment: { agriculture: 4, animalHusbandry: 3, commerce: {}, industry: {} } }]]);

    const a = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'same-seed', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);
    const b = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'same-seed', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);
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
      NO_GENERAL_APPEARANCE,
      NO_DISASTER,
      NO_EVENT,
    );
    expect(state).toEqual(snapshot);
  });

  it('increments turn number and resets submittedPlayerIds', () => {
    const state = { ...makeState(), submittedPlayerIds: ['p1'] };
    const { nextState } = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);
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

    const { nextState, log } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);
    const entry = log[0];

    expect(entry.recruited).toEqual({ unitType: 'spearman', count: 5 });
    expect(nextState.cities[0].troops).toHaveLength(1);
    expect(nextState.cities[0].troops[0].count).toBe(5);
    // recruit (5 pts) + train (2 pts) = 7, leaving 3 pts >= MARKET_EXCHANGE_POINT_COST (1), so it should go through
    expect(entry.marketExchange).toBeDefined();
  });

  it('rolls population growth deterministically from the seed', () => {
    const state = makeState();
    const a = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'growth-seed', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT).nextState.cities[0].population;
    const b = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'growth-seed', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT).nextState.cities[0].population;
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

      const { nextState, log } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);

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

      const { nextState, log } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);

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

      const { nextState } = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);

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
          morale: 100,
          stance: 'defend',
          fortified: false,
        },
      ];

      const { nextState, log } = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);

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
          morale: 100,
          stance: 'defend',
          fortified: false,
        },
      ];

      const { nextState, log } = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);

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
      const small = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', 0.5, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT).nextState.armies[0].daysRemaining;
      const large = resolveTurn(state, orders, ACTION_POINTS_PER_TURN, 'seed-1', 5, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT).nextState.armies[0].daysRemaining;

      expect(large).toBeGreaterThan(small);
    });
  });

  describe('generals', () => {
    function makeDomesticGeneral(facility: 'agriculture' | 'commerce'): General {
      return {
        generalId: 'g1',
        rosterId: 'test-domestic',
        name: '테스트내정장수',
        role: 'domestic',
        skill: { name: '테스트특기', effectType: facility === 'agriculture' ? 'agricultureBoost' : 'commerceBoost', magnitude: 0.5, triggerChance: 1 },
        portraitSeed: 'g1',
        assignment: { kind: 'facility', facility },
      };
    }

    it('boosts production when a matching domestic general is assigned to a facility', () => {
      const withGeneral = makeState();
      withGeneral.cities[0].generals = [makeDomesticGeneral('agriculture')];

      const without = makeState();

      const withResult = resolveTurn(withGeneral, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);
      const withoutResult = resolveTurn(without, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);

      expect(withResult.nextState.cities[0].warehouse.rice!).toBeGreaterThan(withoutResult.nextState.cities[0].warehouse.rice!);
      expect(withResult.log[0].notes.some((n) => n.includes('테스트특기'))).toBe(true);
    });

    it('does not boost an unrelated facility (skill/assignment type mismatch)', () => {
      const state = makeState();
      state.cities[0].generals = [makeDomesticGeneral('commerce')]; // commerceBoost skill assigned to commerce, agriculture untouched

      const withMismatch = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);
      const baseline = resolveTurn(makeState(), new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);

      expect(withMismatch.nextState.cities[0].warehouse.rice!).toBeCloseTo(baseline.nextState.cities[0].warehouse.rice!);
    });

    it('assigns and unassigns a general via orders, clamped into the action-point budget', () => {
      const state = makeState();
      state.cities[0].generals = [{ ...makeDomesticGeneral('agriculture'), assignment: null }];

      const assignOrders = new Map<string, PlayerOrder>([
        ['p1', { ...emptyOrder(), assignGeneral: { generalId: 'g1', target: { kind: 'facility', facility: 'agriculture' } } }],
      ]);
      const afterAssign = resolveTurn(state, assignOrders, ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT).nextState;
      expect(afterAssign.cities[0].generals[0].assignment).toEqual({ kind: 'facility', facility: 'agriculture' });

      const unassignOrders = new Map<string, PlayerOrder>([['p1', { ...emptyOrder(), unassignGeneral: { generalId: 'g1' } }]]);
      const afterUnassign = resolveTurn({ ...afterAssign, turnNumber: 1 }, unassignOrders, ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT).nextState;
      expect(afterUnassign.cities[0].generals[0].assignment).toBeNull();
    });

    it('boosts garrison defense when a combat general is assigned to the garrison', () => {
      const attacker = {
        armyId: 'a1',
        ownerId: 'p2',
        originCityId: 'other',
        troops: [{ unitType: 'spearman' as const, count: 200, trainingLevel: 0 }],
        currentNodeId: 'luoyang',
        destinationNodeId: null,
        daysRemaining: 0,
        morale: 100,
        stance: 'attack' as const,
        fortified: false,
      };

      const defended = makeState();
      defended.cities[0].troops = [{ unitType: 'spearman', count: 200, trainingLevel: 0 }];
      defended.cities[0].generals = [
        {
          generalId: 'g1',
          rosterId: 'test-combat',
          name: '테스트전투장수',
          role: 'combat',
          skill: { name: '방어특기', effectType: 'combatPowerBoost', magnitude: 0.5, triggerChance: 1 },
          portraitSeed: 'g1',
          assignment: { kind: 'garrison' },
        },
      ];
      defended.armies = [attacker];

      const undefended = makeState();
      undefended.cities[0].troops = [{ unitType: 'spearman', count: 200, trainingLevel: 0 }];
      undefended.armies = [{ ...attacker }];

      const withGeneral = resolveTurn(defended, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);
      const without = resolveTurn(undefended, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);

      const withGeneralAttackerCasualties = withGeneral.log[0].battles.find((b) => b.battleType === 'siege')?.opponentCasualties ?? 0;
      const withoutAttackerCasualties = without.log[0].battles.find((b) => b.battleType === 'siege')?.opponentCasualties ?? 0;

      expect(withGeneralAttackerCasualties).toBeGreaterThan(withoutAttackerCasualties);
    });

    it('never recruits a general from the passive background chance when the room has none', () => {
      for (let i = 0; i < 15; i++) {
        const { nextState } = resolveTurn(makeState(), new Map(), ACTION_POINTS_PER_TURN, `no-scout-${i}`, MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);
        expect(nextState.cities[0].generals).toHaveLength(0);
      }
    });

    it('scouting (scoutForGeneral) meaningfully raises the appearance chance above the passive baseline', () => {
      const state = makeState();
      const scoutOrders = new Map<string, PlayerOrder>([['p1', { ...emptyOrder(), scoutForGeneral: true }]]);

      const results = Array.from({ length: 15 }, (_, i) =>
        resolveTurn(state, scoutOrders, ACTION_POINTS_PER_TURN, `scout-${i}`, MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT),
      );
      expect(results.some((r) => r.nextState.cities[0].generals.length > 0)).toBe(true);
    });

    it('leaves a note when scouting fails to find anyone that turn', () => {
      const state = makeState();
      const scoutOrders = new Map<string, PlayerOrder>([['p1', { ...emptyOrder(), scoutForGeneral: true }]]);

      // With NO_GENERAL_APPEARANCE as the base chance, only the scout bonus applies -- pick a seed where that roll still misses.
      const misses = Array.from({ length: 30 }, (_, i) =>
        resolveTurn(state, scoutOrders, ACTION_POINTS_PER_TURN, `scout-miss-${i}`, MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT),
      ).find((r) => r.nextState.cities[0].generals.length === 0);

      expect(misses?.log[0].notes.some((n) => n.includes('탐색했지만'))).toBe(true);
    });
  });

  describe('events & disasters', () => {
    const FORCE_TRIGGER = 1;

    it('reduces matching-domain production and records the effect when a disaster strikes', () => {
      const state = makeState();
      const result = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, FORCE_TRIGGER, NO_EVENT);

      const city = result.nextState.cities[0];
      expect(city.activeEffects).toHaveLength(1);
      expect(city.activeEffects[0].kind).toBe('disaster');
      expect(result.log[0].notes.some((n) => n.includes('생산이 감소'))).toBe(true);
    });

    it('increases matching-domain production and records the effect when an event occurs', () => {
      const state = makeState();
      const result = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, FORCE_TRIGGER);

      const city = result.nextState.cities[0];
      expect(city.activeEffects).toHaveLength(1);
      expect(city.activeEffects[0].kind).toBe('event');
      expect(result.log[0].notes.some((n) => n.includes('생산이 증가'))).toBe(true);
    });

    it('expires an active effect once its duration runs out and logs a note', () => {
      const state = makeState();
      state.cities[0].activeEffects = [{ id: 'e1', definitionId: 'locusts', kind: 'disaster', name: '메뚜기 떼', domain: 'agriculture', magnitude: -0.5, turnsRemaining: 1 }];

      const result = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);

      expect(result.nextState.cities[0].activeEffects).toHaveLength(0);
      expect(result.log[0].notes.some((n) => n.includes('효과가 종료되었습니다'))).toBe(true);
    });

    it('keeps a still-running effect active with one fewer turn remaining', () => {
      const state = makeState();
      state.cities[0].activeEffects = [{ id: 'e1', definitionId: 'locusts', kind: 'disaster', name: '메뚜기 떼', domain: 'agriculture', magnitude: -0.5, turnsRemaining: 3 }];

      const result = resolveTurn(state, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);

      expect(result.nextState.cities[0].activeEffects).toEqual([
        { id: 'e1', definitionId: 'locusts', kind: 'disaster', name: '메뚜기 떼', domain: 'agriculture', magnitude: -0.5, turnsRemaining: 2 },
      ]);
    });

    it('stacks two disasters on the same domain additively, producing less than just one would', () => {
      const withOne = makeState();
      withOne.cities[0].activeEffects = [{ id: 'e1', definitionId: 'locusts', kind: 'disaster', name: 'a', domain: 'agriculture', magnitude: -0.3, turnsRemaining: 5 }];

      const withTwo = makeState();
      withTwo.cities[0].activeEffects = [
        { id: 'e1', definitionId: 'locusts', kind: 'disaster', name: 'a', domain: 'agriculture', magnitude: -0.3, turnsRemaining: 5 },
        { id: 'e2', definitionId: 'drought', kind: 'disaster', name: 'b', domain: 'agriculture', magnitude: -0.3, turnsRemaining: 5 },
      ];

      const oneResult = resolveTurn(withOne, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);
      const twoResult = resolveTurn(withTwo, new Map(), ACTION_POINTS_PER_TURN, 'seed-1', MEDIUM_MAP_MULTIPLIER, NO_GENERAL_APPEARANCE, NO_DISASTER, NO_EVENT);

      expect(twoResult.nextState.cities[0].warehouse.rice!).toBeLessThan(oneResult.nextState.cities[0].warehouse.rice!);
    });
  });
});
