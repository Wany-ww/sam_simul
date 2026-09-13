import { describe, expect, it } from 'vitest';
import { createSeededRng, GENERAL_ROSTER } from '@sam-simul/shared';
import type { FacilityLevels, General } from '@sam-simul/shared';
import { applyGeneralAssignment, applyGeneralUnassignment, computeGeneralEffects, rollGeneralAppearance } from '../../../src/domain/game/generals.js';

function emptyFacilities(): FacilityLevels {
  return {
    agriculture: 0,
    animalHusbandry: 0,
    commerce: { tradingPost: 0, taxOffice: 0, market: 0 },
    industry: { armory: 0, weaponsWorkshop: 0, blacksmith: 0, publicWorks: 0 },
  };
}

describe('rollGeneralAppearance', () => {
  it('never appears when the roll fails', () => {
    const rng = () => 0.999; // always "fails" a low-chance roll
    expect(rollGeneralAppearance(rng, 0.02, 100, emptyFacilities(), [])).toBeNull();
  });

  it('appears when the roll succeeds, with a fresh unique id derived from the roster entry', () => {
    const rng = () => 0; // always succeeds, and picks index 0 of candidates
    const general = rollGeneralAppearance(rng, 0.5, 100, emptyFacilities(), []);
    expect(general).not.toBeNull();
    expect(general!.rosterId).toBe(GENERAL_ROSTER[0].rosterId);
    expect(general!.assignment).toBeNull();
  });

  it('never returns a general the player has already recruited, and returns null once the whole roster is taken', () => {
    const rng = () => 0;
    const allIds = GENERAL_ROSTER.map((g) => g.rosterId);
    expect(rollGeneralAppearance(rng, 0.5, 100, emptyFacilities(), allIds)).toBeNull();
  });

  it('increases appearance chance with population and facility levels', () => {
    // rng returns a value that succeeds only above a certain chance threshold
    const rng = () => 0.05;
    const lowChanceState = rollGeneralAppearance(rng, 0.02, 0, emptyFacilities(), []);
    const highChanceState = rollGeneralAppearance(rng, 0.02, 100_000, { ...emptyFacilities(), agriculture: 500 }, []);
    expect(lowChanceState).toBeNull();
    expect(highChanceState).not.toBeNull();
  });
});

function makeGeneral(overrides: Partial<General> = {}): General {
  return {
    generalId: 'g1',
    rosterId: 'g1',
    name: '테스트장수',
    role: 'domestic',
    skill: { name: '테스트특기', effectType: 'agricultureBoost', magnitude: 0.2, triggerChance: 1 },
    portraitSeed: 'g1',
    assignment: null,
    ...overrides,
  };
}

describe('computeGeneralEffects', () => {
  it('ignores unassigned generals', () => {
    const effects = computeGeneralEffects(createSeededRng('s'), [makeGeneral({ assignment: null })]);
    expect(effects.facilityMultiplier.agriculture).toBe(1);
    expect(effects.notes).toHaveLength(0);
  });

  it('applies a facility boost only when the effect type matches the assigned facility', () => {
    const matching = computeGeneralEffects(createSeededRng('s'), [
      makeGeneral({ assignment: { kind: 'facility', facility: 'agriculture' } }),
    ]);
    expect(matching.facilityMultiplier.agriculture).toBeCloseTo(1.2);

    const mismatched = computeGeneralEffects(createSeededRng('s'), [
      makeGeneral({ assignment: { kind: 'facility', facility: 'commerce' } }), // agricultureBoost skill assigned to commerce
    ]);
    expect(mismatched.facilityMultiplier.commerce).toBe(1);
  });

  it('never triggers when the roll fails (triggerChance respected)', () => {
    const general = makeGeneral({ skill: { name: 's', effectType: 'agricultureBoost', magnitude: 0.2, triggerChance: 0 }, assignment: { kind: 'facility', facility: 'agriculture' } });
    const effects = computeGeneralEffects(createSeededRng('s'), [general]);
    expect(effects.facilityMultiplier.agriculture).toBe(1);
  });

  it('applies combat power and morale boosts to the garrison target', () => {
    const powerGeneral = makeGeneral({ skill: { name: 's', effectType: 'combatPowerBoost', magnitude: 0.25, triggerChance: 1 }, assignment: { kind: 'garrison' } });
    const effects = computeGeneralEffects(createSeededRng('s'), [powerGeneral]);
    expect(effects.garrison.combatPowerMultiplier).toBeCloseTo(1.25);
  });

  it('applies per-army effects keyed by armyId, accumulating multiple generals on the same army', () => {
    const g1 = makeGeneral({ generalId: 'g1', skill: { name: 's1', effectType: 'combatPowerBoost', magnitude: 0.2, triggerChance: 1 }, assignment: { kind: 'army', armyId: 'a1' } });
    const g2 = makeGeneral({ generalId: 'g2', skill: { name: 's2', effectType: 'moraleBoost', magnitude: 0.1, triggerChance: 1 }, assignment: { kind: 'army', armyId: 'a1' } });
    const effects = computeGeneralEffects(createSeededRng('s'), [g1, g2]);
    const armyEffect = effects.perArmy.get('a1')!;
    expect(armyEffect.combatPowerMultiplier).toBeCloseTo(1.2);
    expect(armyEffect.moraleBonus).toBeCloseTo(10);
  });

  it('applies cavalry march speed boost as a fraction on the assigned army', () => {
    const general = makeGeneral({ skill: { name: 's', effectType: 'cavalryMarchSpeedBoost', magnitude: 0.3, triggerChance: 1 }, assignment: { kind: 'army', armyId: 'a1' } });
    const effects = computeGeneralEffects(createSeededRng('s'), [general]);
    expect(effects.perArmy.get('a1')!.marchSpeedBoostFraction).toBeCloseTo(0.3);
  });
});

describe('applyGeneralAssignment / applyGeneralUnassignment', () => {
  it('assigns and unassigns without mutating the input array', () => {
    const generals = [makeGeneral({ generalId: 'g1' })];
    const assigned = applyGeneralAssignment(generals, 'g1', { kind: 'garrison' });
    expect(assigned[0].assignment).toEqual({ kind: 'garrison' });
    expect(generals[0].assignment).toBeNull(); // original untouched

    const unassigned = applyGeneralUnassignment(assigned, 'g1');
    expect(unassigned[0].assignment).toBeNull();
  });

  it('is a no-op for an unknown generalId', () => {
    const generals = [makeGeneral({ generalId: 'g1' })];
    expect(applyGeneralAssignment(generals, 'does-not-exist', { kind: 'garrison' })).toEqual(generals);
  });
});
