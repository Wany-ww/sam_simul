import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@sam-simul/shared';
import type { CombatSide } from '../../../src/domain/game/combat.js';
import { applyCasualties, computeCombatPower, resolveBattle, resolveCombatDay, resolveSiege, totalTroopCount } from '../../../src/domain/game/combat.js';

function makeSide(overrides: Partial<CombatSide> = {}): CombatSide {
  return {
    troops: [{ unitType: 'spearman', count: 100, trainingLevel: 0 }],
    morale: 100,
    stance: 'defend',
    fortified: false,
    ...overrides,
  };
}

describe('computeCombatPower', () => {
  it('scales with troop count and unit combat value', () => {
    const spearmen = computeCombatPower(makeSide({ troops: [{ unitType: 'spearman', count: 100, trainingLevel: 0 }] }), false);
    const cavalry = computeCombatPower(makeSide({ troops: [{ unitType: 'cavalry', count: 100, trainingLevel: 0 }] }), false);
    expect(cavalry).toBeGreaterThan(spearmen); // cavalry has a higher UNIT_COMBAT_VALUE
  });

  it('increases with training level', () => {
    const untrained = computeCombatPower(makeSide({ troops: [{ unitType: 'spearman', count: 100, trainingLevel: 0 }] }), false);
    const trained = computeCombatPower(makeSide({ troops: [{ unitType: 'spearman', count: 100, trainingLevel: 50 }] }), false);
    expect(trained).toBeGreaterThan(untrained);
  });

  it('scales down with lower morale', () => {
    const fullMorale = computeCombatPower(makeSide({ morale: 100 }), false);
    const lowMorale = computeCombatPower(makeSide({ morale: 10 }), false);
    expect(lowMorale).toBeLessThan(fullMorale);
  });

  it('gives an attack-stance bonus', () => {
    const defending = computeCombatPower(makeSide({ stance: 'defend' }), false);
    const attacking = computeCombatPower(makeSide({ stance: 'attack' }), false);
    expect(attacking).toBeGreaterThan(defending);
  });

  it('uses siege values (engineers much stronger, cavalry much weaker) when attacking a city', () => {
    const engineerField = computeCombatPower(makeSide({ troops: [{ unitType: 'engineer', count: 100, trainingLevel: 0 }] }), false);
    const engineerSiege = computeCombatPower(makeSide({ troops: [{ unitType: 'engineer', count: 100, trainingLevel: 0 }] }), true);
    expect(engineerSiege).toBeGreaterThan(engineerField);

    const cavalryField = computeCombatPower(makeSide({ troops: [{ unitType: 'cavalry', count: 100, trainingLevel: 0 }] }), false);
    const cavalrySiege = computeCombatPower(makeSide({ troops: [{ unitType: 'cavalry', count: 100, trainingLevel: 0 }] }), true);
    expect(cavalrySiege).toBeLessThan(cavalryField);
  });
});

describe('applyCasualties', () => {
  it('distributes losses proportionally across stacks', () => {
    const { troops } = applyCasualties(
      [
        { unitType: 'spearman', count: 80, trainingLevel: 0 },
        { unitType: 'cavalry', count: 20, trainingLevel: 0 },
      ],
      50,
    );
    const spear = troops.find((t) => t.unitType === 'spearman')!;
    const cavalry = troops.find((t) => t.unitType === 'cavalry')!;
    expect(spear.count).toBe(40); // 80 - 50*0.8
    expect(cavalry.count).toBe(10); // 20 - 50*0.2
  });

  it('drops stacks reduced to zero', () => {
    const { troops } = applyCasualties([{ unitType: 'spearman', count: 10, trainingLevel: 0 }], 10);
    expect(troops).toEqual([]);
  });

  it('never removes more troops than exist', () => {
    const { troops, actualCasualties } = applyCasualties([{ unitType: 'spearman', count: 10, trainingLevel: 0 }], 999);
    expect(totalTroopCount(troops)).toBe(0);
    expect(actualCasualties).toBe(10);
  });
});

describe('resolveCombatDay', () => {
  const rng = createSeededRng('day-seed');

  it('deals casualties to both sides based on the other side\'s power', () => {
    const attacker = makeSide();
    const defender = makeSide();
    const result = resolveCombatDay(attacker, defender, false, rng);

    expect(result.attackerCasualties).toBeGreaterThan(0);
    expect(result.defenderCasualties).toBeGreaterThan(0);
  });

  it('reduces casualties taken for a defending or fortified side', () => {
    const attacker = makeSide();
    const rng1 = createSeededRng('same');
    const rng2 = createSeededRng('same');

    const normal = resolveCombatDay(attacker, makeSide({ stance: 'defend', fortified: false }), false, rng1);
    const fortified = resolveCombatDay(attacker, makeSide({ stance: 'defend', fortified: true }), false, rng2);

    expect(fortified.defenderCasualties).toBeLessThan(normal.defenderCasualties);
  });

  it('applies wall damage only during a siege', () => {
    const field = resolveCombatDay(makeSide(), makeSide(), false, createSeededRng('x'));
    const siege = resolveCombatDay(makeSide(), makeSide(), true, createSeededRng('x'));
    expect(field.wallDamage).toBe(0);
    expect(siege.wallDamage).toBeGreaterThan(0);
  });

  it('decays morale daily and never drops it below zero', () => {
    const result = resolveCombatDay(makeSide({ morale: 1 }), makeSide({ morale: 1 }), false, rng);
    expect(result.attacker.morale).toBe(0);
    expect(result.defender.morale).toBe(0);
  });
});

describe('resolveBattle', () => {
  it('is deterministic for a given seed', () => {
    const a = resolveBattle(makeSide(), makeSide({ troops: [{ unitType: 'spearman', count: 50, trainingLevel: 0 }] }), 5, createSeededRng('battle-1'));
    const b = resolveBattle(makeSide(), makeSide({ troops: [{ unitType: 'spearman', count: 50, trainingLevel: 0 }] }), 5, createSeededRng('battle-1'));
    expect(a).toEqual(b);
  });

  it('declares the stronger side the winner given enough days', () => {
    const strongAttacker = makeSide({ troops: [{ unitType: 'cavalry', count: 500, trainingLevel: 80 }] });
    const weakDefender = makeSide({ troops: [{ unitType: 'spearman', count: 20, trainingLevel: 0 }] });
    const result = resolveBattle(strongAttacker, weakDefender, 20, createSeededRng('mismatch'));
    expect(result.outcome).toBe('attackerVictory');
  });

  it('stops early once a side routs rather than always using maxDays', () => {
    const result = resolveBattle(
      makeSide({ troops: [{ unitType: 'cavalry', count: 1000, trainingLevel: 100 }] }),
      makeSide({ troops: [{ unitType: 'spearman', count: 6, trainingLevel: 0 }] }),
      100,
      createSeededRng('fast-rout'),
    );
    expect(result.daysFought).toBeLessThan(100);
    expect(result.outcome).toBe('attackerVictory');
  });

  it('reports ongoing if neither side routs within maxDays', () => {
    const evenlyMatched = () => makeSide({ troops: [{ unitType: 'spearman', count: 200, trainingLevel: 0 }] });
    const result = resolveBattle(evenlyMatched(), evenlyMatched(), 1, createSeededRng('short'));
    expect(result.outcome).toBe('ongoing');
    expect(result.daysFought).toBe(1);
  });
});

describe('resolveSiege', () => {
  it('declares attacker victory once wall durability reaches zero, even if the garrison survives', () => {
    const attacker = makeSide({ troops: [{ unitType: 'engineer', count: 200, trainingLevel: 50 }] });
    const defender = makeSide({ troops: [{ unitType: 'spearman', count: 500, trainingLevel: 0 }] });
    const result = resolveSiege(attacker, defender, 10, 50, createSeededRng('wall-break'));

    expect(result.wallDurability).toBe(0);
    expect(result.outcome).toBe('attackerVictory');
  });

  it('never lets wall durability go negative', () => {
    const attacker = makeSide({ troops: [{ unitType: 'engineer', count: 1000, trainingLevel: 100 }] });
    const defender = makeSide();
    const result = resolveSiege(attacker, defender, 5, 20, createSeededRng('overkill'));
    expect(result.wallDurability).toBe(0);
  });

  it('applies an extra daily morale penalty to the besieged defender', () => {
    const attacker = makeSide({ troops: [{ unitType: 'spearman', count: 1, trainingLevel: 0 }] }); // negligible attack power
    const defender = makeSide({ morale: 100, troops: [{ unitType: 'spearman', count: 1000, trainingLevel: 0 }] });

    const siege = resolveSiege(attacker, defender, 10_000, 1, createSeededRng('morale'));
    const field = resolveBattle(attacker, defender, 1, createSeededRng('morale'));

    expect(siege.defender.morale).toBeLessThan(field.defender.morale);
  });
});
