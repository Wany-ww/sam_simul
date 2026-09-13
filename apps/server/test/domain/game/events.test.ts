import { describe, expect, it } from 'vitest';
import { DISASTER_DEFINITIONS, EVENT_DEFINITIONS } from '@sam-simul/shared';
import type { ActiveEffect } from '@sam-simul/shared';
import { computeEffectMultipliers, instantiateEffect, rollDisaster, rollEvent, tickActiveEffects } from '../../../src/domain/game/events.js';

describe('rollDisaster', () => {
  it('never strikes when the roll fails', () => {
    expect(rollDisaster(() => 0.999, 0.08)).toBeNull();
  });

  it('strikes with a definition from the roster when the roll succeeds', () => {
    const disaster = rollDisaster(() => 0, 0.5);
    expect(disaster).not.toBeNull();
    expect(DISASTER_DEFINITIONS).toContainEqual(disaster);
  });
});

describe('rollEvent', () => {
  it('never occurs when the roll fails', () => {
    expect(rollEvent(() => 0.999, 0.12, 0)).toBeNull();
  });

  it('occurs with a definition from the roster when the roll succeeds', () => {
    const event = rollEvent(() => 0, 0.5, 0);
    expect(event).not.toBeNull();
    expect(EVENT_DEFINITIONS).toContainEqual(event);
  });

  it('adds the Trading Post bonus on top of the base chance rather than replacing it', () => {
    // rng always returns a value that only clears the combined (base + bonus) chance
    const rng = () => 0.1;
    expect(rollEvent(rng, 0.05, 0)).toBeNull(); // base alone (0.05) doesn't clear 0.1
    expect(rollEvent(rng, 0.05, 10)).not.toBeNull(); // +10 levels * 0.01 = +0.1 -> 0.15 total, clears 0.1
  });
});

describe('instantiateEffect', () => {
  it('creates an active effect with a fresh id and full duration from the definition', () => {
    const def = DISASTER_DEFINITIONS[0];
    const a = instantiateEffect(def);
    const b = instantiateEffect(def);

    expect(a.definitionId).toBe(def.id);
    expect(a.turnsRemaining).toBe(def.durationTurns);
    expect(a.id).not.toBe(b.id); // unique per instance
  });
});

describe('tickActiveEffects', () => {
  function makeEffect(overrides: Partial<ActiveEffect> = {}): ActiveEffect {
    return { id: 'e1', definitionId: 'locusts', kind: 'disaster', name: '메뚜기 떼', domain: 'agriculture', magnitude: -0.5, turnsRemaining: 2, ...overrides };
  }

  it('decrements turnsRemaining for effects that are still active', () => {
    const { active, expired } = tickActiveEffects([makeEffect({ turnsRemaining: 2 })]);
    expect(active).toEqual([makeEffect({ turnsRemaining: 1 })]);
    expect(expired).toEqual([]);
  });

  it('moves an effect to expired once its turns run out', () => {
    const { active, expired } = tickActiveEffects([makeEffect({ turnsRemaining: 1 })]);
    expect(active).toEqual([]);
    expect(expired).toHaveLength(1);
  });
});

describe('computeEffectMultipliers', () => {
  it('returns 1x for every domain when there are no active effects', () => {
    const result = computeEffectMultipliers([]);
    expect(result).toEqual({ agriculture: 1, animalHusbandry: 1, commerce: 1, industry: 1 });
  });

  it('applies a single effect as a direct multiplier adjustment', () => {
    const result = computeEffectMultipliers([{ id: '1', definitionId: 'locusts', kind: 'disaster', name: '메뚜기 떼', domain: 'agriculture', magnitude: -0.5, turnsRemaining: 2 }]);
    expect(result.agriculture).toBeCloseTo(0.5);
    expect(result.industry).toBe(1);
  });

  it('sums multiple effects on the same domain additively rather than multiplying them', () => {
    const effects: ActiveEffect[] = [
      { id: '1', definitionId: 'locusts', kind: 'disaster', name: '메뚜기 떼', domain: 'agriculture', magnitude: -0.3, turnsRemaining: 2 },
      { id: '2', definitionId: 'goodHarvest', kind: 'event', name: '풍년', domain: 'agriculture', magnitude: 0.3, turnsRemaining: 2 },
    ];
    // -0.3 + 0.3 = 0 -> multiplier stays at 1 (a disaster and a bonus of equal size cancel out)
    expect(computeEffectMultipliers(effects).agriculture).toBeCloseTo(1);
  });

  it('floors the multiplier so stacked disasters never zero out or invert production', () => {
    const effects: ActiveEffect[] = [
      { id: '1', definitionId: 'locusts', kind: 'disaster', name: 'a', domain: 'agriculture', magnitude: -0.6, turnsRemaining: 2 },
      { id: '2', definitionId: 'drought', kind: 'disaster', name: 'b', domain: 'agriculture', magnitude: -0.6, turnsRemaining: 2 },
    ];
    expect(computeEffectMultipliers(effects).agriculture).toBeGreaterThan(0);
    expect(computeEffectMultipliers(effects).agriculture).toBeCloseTo(0.1); // floored at MIN_EFFECT_PRODUCTION_MULTIPLIER
  });
});
