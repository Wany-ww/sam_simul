import { describe, expect, it } from 'vitest';
import type { GameCity } from '@sam-simul/shared';
import { createSeededRng } from '@sam-simul/shared';
import { AI_HOME_DEFENSE_MIN_TROOPS, decideAiOrder } from '../../../src/domain/game/ai.js';

function makeCity(overrides: Partial<GameCity> = {}): GameCity {
  return {
    cityId: 'ai-city',
    ownerId: 'ai-1',
    name: 'AI의 도시',
    nodeId: 'luoyang',
    population: 100,
    facilities: {
      agriculture: 0,
      animalHusbandry: 0,
      commerce: { tradingPost: 0, taxOffice: 0, market: 0 },
      industry: { armory: 0, weaponsWorkshop: 0, blacksmith: 0, publicWorks: 0 },
    },
    warehouse: { gold: 200 },
    troops: [],
    garrisonMorale: 100,
    wallDurability: 500,
    generals: [],
    activeEffects: [],
    ...overrides,
  };
}

describe('decideAiOrder', () => {
  it('is deterministic for a given seed', () => {
    const city = makeCity();
    const a = decideAiOrder(city, 10, createSeededRng('ai-1'));
    const b = decideAiOrder(city, 10, createSeededRng('ai-1'));
    expect(a).toEqual(b);
  });

  it('never requests more investment/recruit points than the budget allows', () => {
    const city = makeCity();
    const order = decideAiOrder(city, 10, createSeededRng('budget-check'));
    const spent =
      order.investment.agriculture + order.investment.animalHusbandry + (order.investment.industry.armory ?? 0) + (order.recruit?.count ?? 0);
    expect(spent).toBeLessThanOrEqual(10);
  });

  it('always spends something on economy investment', () => {
    const city = makeCity();
    const order = decideAiOrder(city, 10, createSeededRng('economy'));
    expect(order.investment.agriculture).toBeGreaterThan(0);
    expect(order.investment.animalHusbandry).toBeGreaterThan(0);
  });

  it('falls back to recruiting engineers before any equipment is stocked', () => {
    const city = makeCity();
    const order = decideAiOrder(city, 10, createSeededRng('no-equipment'));
    expect(order.recruit?.unitType).toBe('engineer');
  });

  it('recruits the unit type matching whatever equipment it already has stocked', () => {
    const city = makeCity({ warehouse: { gold: 200, bow: 50 } });
    const order = decideAiOrder(city, 10, createSeededRng('has-bows'));
    expect(order.recruit?.unitType).toBe('crossbowman');
  });

  it('never marches when garrison troops are at or below the home defense minimum', () => {
    const city = makeCity({ troops: [{ unitType: 'engineer', count: AI_HOME_DEFENSE_MIN_TROOPS, trainingLevel: 0 }] });
    // Try many seeds so an unlucky roll doesn't produce a false pass.
    for (let i = 0; i < 25; i++) {
      const order = decideAiOrder(city, 10, createSeededRng(`no-march-${i}`));
      expect(order.march).toBeUndefined();
    }
  });

  it('can march surplus garrison troops to an adjacent node once above the defense minimum', () => {
    const city = makeCity({ troops: [{ unitType: 'engineer', count: AI_HOME_DEFENSE_MIN_TROOPS + 20, trainingLevel: 0 }] });
    const marches = Array.from({ length: 30 }, (_, i) => decideAiOrder(city, 10, createSeededRng(`march-roll-${i}`)).march);
    expect(marches.some((m) => m !== undefined)).toBe(true);
    for (const march of marches) {
      if (!march) continue;
      expect(march.unitType).toBe('engineer');
      expect(march.count).toBeGreaterThan(0);
      expect(march.count).toBeLessThanOrEqual(AI_HOME_DEFENSE_MIN_TROOPS + 20);
    }
  });
});
