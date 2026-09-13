import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@sam-simul/shared';
import type { Army, GameCity } from '@sam-simul/shared';
import { resolveBattlesForTurn } from '../../../src/domain/game/battleOrchestration.js';

function makeCity(overrides: Partial<GameCity> = {}): GameCity {
  return {
    cityId: 'c1',
    ownerId: 'p1',
    name: '낙양',
    nodeId: 'luoyang',
    population: 100,
    facilities: {
      agriculture: 0,
      animalHusbandry: 0,
      commerce: { tradingPost: 0, taxOffice: 0, market: 0 },
      industry: { armory: 0, weaponsWorkshop: 0, blacksmith: 0, publicWorks: 0 },
    },
    warehouse: {},
    troops: [{ unitType: 'spearman', count: 100, trainingLevel: 0 }],
    garrisonMorale: 100,
    wallDurability: 500,
    ...overrides,
  };
}

function makeArmy(overrides: Partial<Army> = {}): Army {
  return {
    armyId: 'a1',
    ownerId: 'p2',
    originCityId: 'c2',
    troops: [{ unitType: 'spearman', count: 100, trainingLevel: 0 }],
    currentNodeId: 'luoyang',
    destinationNodeId: null,
    daysRemaining: 0,
    morale: 100,
    stance: 'defend',
    fortified: false,
    ...overrides,
  };
}

describe('resolveBattlesForTurn', () => {
  it('does nothing when no two owners share a node', () => {
    const city = makeCity();
    const army = makeArmy({ currentNodeId: 'wancheng' }); // different node than the city
    const result = resolveBattlesForTurn([city], [army], 5, createSeededRng('s'));

    expect(result.cities[0]).toEqual(city);
    expect(result.armies[0]).toEqual(army);
    expect(result.notesByPlayer.size).toBe(0);
  });

  it('ignores a marching (non-stationary) army even if it shares a node', () => {
    const city = makeCity();
    const marchingArmy = makeArmy({ destinationNodeId: 'hulaoGuan', daysRemaining: 3 });
    const result = resolveBattlesForTurn([city], [marchingArmy], 5, createSeededRng('s'));

    expect(result.notesByPlayer.size).toBe(0);
  });

  it('treats a foreign army at an enemy city as a siege and logs it for both sides', () => {
    const city = makeCity({ ownerId: 'p1' });
    const attacker = makeArmy({ ownerId: 'p2' });
    const result = resolveBattlesForTurn([city], [attacker], 1, createSeededRng('siege'));

    const attackerAcc = result.notesByPlayer.get('p2')!;
    const defenderAcc = result.notesByPlayer.get('p1')!;
    expect(attackerAcc.battles[0].battleType).toBe('siege');
    expect(defenderAcc.battles[0].battleType).toBe('siege');
    expect(attackerAcc.battles[0].opponentPlayerId).toBe('p1');
    expect(defenderAcc.battles[0].opponentPlayerId).toBe('p2');
  });

  it('captures an undefended city without a fight (bloodless capture)', () => {
    const city = makeCity({ ownerId: 'p1', troops: [] });
    const attacker = makeArmy({ ownerId: 'p2', troops: [{ unitType: 'spearman', count: 50, trainingLevel: 0 }] });
    const result = resolveBattlesForTurn([city], [attacker], 5, createSeededRng('s'));

    expect(result.cities[0].ownerId).toBe('p2');
    expect(result.cities[0].troops).toEqual([{ unitType: 'spearman', count: 50, trainingLevel: 0 }]);
    expect(result.armies).toHaveLength(0); // attacker's army merged into the captured city
    expect(result.notesByPlayer.get('p2')!.notes.some((n) => n.includes('무혈'))).toBe(true);
  });

  it('transfers city ownership and merges surviving attacker troops when the siege succeeds', () => {
    const city = makeCity({ ownerId: 'p1', troops: [{ unitType: 'spearman', count: 5, trainingLevel: 0 }], wallDurability: 1 });
    const attacker = makeArmy({ ownerId: 'p2', troops: [{ unitType: 'engineer', count: 500, trainingLevel: 100 }] });
    const result = resolveBattlesForTurn([city], [attacker], 20, createSeededRng('overwhelm'));

    expect(result.cities[0].ownerId).toBe('p2');
    expect(result.cities[0].wallDurability).toBe(500); // reset for the new owner
    expect(result.armies).toHaveLength(0);
  });

  it('keeps the city with its original owner when the defender wins', () => {
    const city = makeCity({ ownerId: 'p1', troops: [{ unitType: 'spearman', count: 1000, trainingLevel: 100 }] });
    const attacker = makeArmy({ ownerId: 'p2', troops: [{ unitType: 'spearman', count: 5, trainingLevel: 0 }] });
    const result = resolveBattlesForTurn([city], [attacker], 20, createSeededRng('crush'));

    expect(result.cities[0].ownerId).toBe('p1');
    expect(result.armies).toHaveLength(0); // attacker eliminated
  });

  it('resolves a field battle between two armies at a battlefield node with no home city', () => {
    const armyA = makeArmy({ armyId: 'a1', ownerId: 'p1', currentNodeId: 'hulaoGuan' });
    const armyB = makeArmy({ armyId: 'a2', ownerId: 'p2', currentNodeId: 'hulaoGuan' });
    const result = resolveBattlesForTurn([], [armyA, armyB], 1, createSeededRng('field'));

    expect(result.notesByPlayer.get('p1')!.battles[0].battleType).toBe('field');
    expect(result.notesByPlayer.get('p2')!.battles[0].battleType).toBe('field');
  });

  it('eliminates the losing side entirely in a field battle rout', () => {
    const strong = makeArmy({ armyId: 'a1', ownerId: 'p1', currentNodeId: 'hulaoGuan', troops: [{ unitType: 'cavalry', count: 1000, trainingLevel: 100 }] });
    const weak = makeArmy({ armyId: 'a2', ownerId: 'p2', currentNodeId: 'hulaoGuan', troops: [{ unitType: 'spearman', count: 5, trainingLevel: 0 }] });
    const result = resolveBattlesForTurn([], [strong, weak], 20, createSeededRng('rout'));

    expect(result.armies).toHaveLength(1);
    expect(result.armies[0].ownerId).toBe('p1');
  });

  it('pools multiple armies from the same owner at a node into one combined side', () => {
    const cityOwner = makeCity({ ownerId: 'p1', troops: [{ unitType: 'spearman', count: 5, trainingLevel: 0 }] });
    const attacker1 = makeArmy({ armyId: 'a1', ownerId: 'p2', troops: [{ unitType: 'spearman', count: 50, trainingLevel: 0 }] });
    const attacker2 = makeArmy({ armyId: 'a2', ownerId: 'p2', troops: [{ unitType: 'spearman', count: 50, trainingLevel: 0 }] });

    const result = resolveBattlesForTurn([cityOwner], [attacker1, attacker2], 20, createSeededRng('pool'));

    // Whether the attacker wins or the fight continues, the two armies should
    // have been consolidated into at most one entry, not left as two.
    const p2Armies = result.armies.filter((a) => a.ownerId === 'p2');
    expect(p2Armies.length).toBeLessThanOrEqual(1);
  });

  it('leaves an ongoing battle with both sides damaged but still present for next turn', () => {
    const city = makeCity({ ownerId: 'p1', troops: [{ unitType: 'spearman', count: 500, trainingLevel: 0 }] });
    const attacker = makeArmy({ ownerId: 'p2', troops: [{ unitType: 'spearman', count: 500, trainingLevel: 0 }] });
    const result = resolveBattlesForTurn([city], [attacker], 1, createSeededRng('ongoing'));

    expect(result.notesByPlayer.get('p1')!.battles[0].outcome).toBe('ongoing');
    expect(result.notesByPlayer.get('p2')!.battles[0].outcome).toBe('ongoing');
    expect(result.armies).toHaveLength(1); // attacker survives, damaged
    expect(result.cities[0].ownerId).toBe('p1');
  });
});
