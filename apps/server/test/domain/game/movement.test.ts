import { describe, expect, it } from 'vitest';
import type { GameCity } from '@sam-simul/shared';
import { createArmyFromMarchOrder, advanceArmy } from '../../../src/domain/game/movement.js';

function makeCity(overrides: Partial<GameCity> = {}): GameCity {
  return {
    cityId: 'c1',
    ownerId: 'p1',
    name: '도시',
    nodeId: 'luoyang',
    population: 100,
    facilities: {
      agriculture: 0,
      animalHusbandry: 0,
      commerce: { tradingPost: 0, taxOffice: 0, market: 0 },
      industry: { armory: 0, weaponsWorkshop: 0, blacksmith: 0, publicWorks: 0 },
    },
    warehouse: {},
    troops: [{ unitType: 'spearman', count: 10, trainingLevel: 5 }],
    ...overrides,
  };
}

describe('createArmyFromMarchOrder', () => {
  it('creates an army carrying the requested troops and the training level from the source stack', () => {
    const result = createArmyFromMarchOrder(makeCity(), { unitType: 'spearman', count: 4, destinationNodeId: 'hulaoGuan' }, 1);
    expect(result.army).toMatchObject({ ownerId: 'p1', currentNodeId: 'luoyang', destinationNodeId: 'hulaoGuan' });
    expect(result.army!.troops).toEqual([{ unitType: 'spearman', count: 4, trainingLevel: 5 }]);
    expect(result.troops.find((t) => t.unitType === 'spearman')!.count).toBe(6);
  });

  it('clamps the marched count to what is actually available', () => {
    const result = createArmyFromMarchOrder(makeCity(), { unitType: 'spearman', count: 999, destinationNodeId: 'hulaoGuan' }, 1);
    expect(result.army!.troops[0].count).toBe(10);
    expect(result.troops.find((t) => t.unitType === 'spearman')).toBeUndefined(); // fully depleted stack is dropped
  });

  it('returns no army when the city has none of the requested unit type', () => {
    const result = createArmyFromMarchOrder(makeCity(), { unitType: 'cavalry', count: 5, destinationNodeId: 'hulaoGuan' }, 1);
    expect(result.army).toBeNull();
  });

  it('returns no army when the destination is not directly adjacent', () => {
    const result = createArmyFromMarchOrder(makeCity(), { unitType: 'spearman', count: 5, destinationNodeId: 'jianye' }, 1);
    expect(result.army).toBeNull();
  });

  it('scales days remaining by the map-size multiplier', () => {
    const small = createArmyFromMarchOrder(makeCity(), { unitType: 'spearman', count: 1, destinationNodeId: 'hulaoGuan' }, 0.5).army!.daysRemaining;
    const large = createArmyFromMarchOrder(makeCity(), { unitType: 'spearman', count: 1, destinationNodeId: 'hulaoGuan' }, 3).army!.daysRemaining;
    expect(large).toBeGreaterThan(small);
  });
});

describe('advanceArmy', () => {
  const marchingArmy = {
    armyId: 'a1',
    ownerId: 'p1',
    originCityId: 'c1',
    troops: [{ unitType: 'spearman' as const, count: 5, trainingLevel: 0 }],
    currentNodeId: 'luoyang',
    destinationNodeId: 'wancheng',
    daysRemaining: 12,
  };

  it('decrements days remaining without arriving if the trip is not yet complete', () => {
    const result = advanceArmy(marchingArmy);
    expect(result.destinationNodeId).toBe('wancheng');
    expect(result.daysRemaining).toBe(7);
  });

  it('snaps to the destination once days remaining would go to zero or below', () => {
    const result = advanceArmy({ ...marchingArmy, daysRemaining: 3 });
    expect(result).toMatchObject({ currentNodeId: 'wancheng', destinationNodeId: null, daysRemaining: 0 });
  });

  it('is a no-op for a stationary army', () => {
    const stationary = { ...marchingArmy, destinationNodeId: null, daysRemaining: 0 };
    expect(advanceArmy(stationary)).toEqual(stationary);
  });
});
