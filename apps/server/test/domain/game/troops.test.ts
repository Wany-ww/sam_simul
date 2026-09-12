import { describe, expect, it } from 'vitest';
import { applyRecruitment, applyTraining } from '../../../src/domain/game/troops.js';

describe('applyRecruitment', () => {
  it('recruits spearmen when gold, equipment (spear), and population headroom all allow it', () => {
    const result = applyRecruitment([], { gold: 100, spear: 20 }, 1000, { unitType: 'spearman', count: 10 });
    expect(result.count).toBe(10);
    expect(result.warehouse.gold).toBe(100 - 10 * 2);
    expect(result.warehouse.spear).toBe(10);
    expect(result.troops).toEqual([{ unitType: 'spearman', count: 10, trainingLevel: 0 }]);
  });

  it('clamps recruitment to whichever resource runs out first (equipment, here)', () => {
    const result = applyRecruitment([], { gold: 1000, spear: 3 }, 1000, { unitType: 'spearman', count: 10 });
    expect(result.count).toBe(3);
    expect(result.warehouse.spear).toBe(0);
  });

  it('clamps recruitment to the population cap', () => {
    // population 10 * MAX_TROOPS_PER_POPULATION_RATIO (0.3) = 3
    const result = applyRecruitment([], { gold: 1000, spear: 1000 }, 10, { unitType: 'spearman', count: 10 });
    expect(result.count).toBe(3);
  });

  it('cavalry additionally consumes horses as mounts', () => {
    const result = applyRecruitment([], { gold: 1000, horseArmor: 1000, horse: 5 }, 1000, { unitType: 'cavalry', count: 10 });
    expect(result.count).toBe(5);
    expect(result.warehouse.horse).toBe(0);
  });

  it('engineers require no equipment or mount, only gold and population', () => {
    const result = applyRecruitment([], { gold: 20 }, 1000, { unitType: 'engineer', count: 10 });
    expect(result.count).toBe(10);
  });

  it('adds to an existing stack rather than creating a duplicate', () => {
    const existing = [{ unitType: 'spearman' as const, count: 5, trainingLevel: 10 }];
    const result = applyRecruitment(existing, { gold: 100, spear: 100 }, 1000, { unitType: 'spearman', count: 5 });
    expect(result.troops).toHaveLength(1);
    expect(result.troops[0].count).toBe(10);
    expect(result.troops[0].trainingLevel).toBe(10); // training level unaffected by adding raw recruits
  });
});

describe('applyTraining', () => {
  it('increases training level proportional to points invested', () => {
    const troops = [{ unitType: 'spearman' as const, count: 10, trainingLevel: 0 }];
    const result = applyTraining(troops, { unitType: 'spearman', pointsInvested: 4 });
    expect(result.levelsGained).toBe(2); // TRAIN_POINTS_PER_LEVEL = 2
    expect(result.troops[0].trainingLevel).toBe(2);
  });

  it('caps training level at the maximum', () => {
    const troops = [{ unitType: 'spearman' as const, count: 10, trainingLevel: 99 }];
    const result = applyTraining(troops, { unitType: 'spearman', pointsInvested: 100 });
    expect(result.troops[0].trainingLevel).toBe(100);
  });

  it('is a no-op if the unit type has no existing troops', () => {
    const result = applyTraining([], { unitType: 'cavalry', pointsInvested: 10 });
    expect(result.levelsGained).toBe(0);
    expect(result.troops).toEqual([]);
  });
});
