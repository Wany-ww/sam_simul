import { randomUUID } from 'node:crypto';
import type { ActiveEffect, EffectDefinition, EffectDomain, Rng } from '@sam-simul/shared';
import { DISASTER_DEFINITIONS, EVENT_DEFINITIONS, EVENT_PROBABILITY_BONUS_PER_TRADING_POST_LEVEL, MIN_EFFECT_PRODUCTION_MULTIPLIER } from '@sam-simul/shared';

/** Rolls whether a disaster strikes this city this turn, and if so, which one. */
export function rollDisaster(rng: Rng, baseChance: number): EffectDefinition | null {
  if (rng() >= baseChance) return null;
  return DISASTER_DEFINITIONS[Math.floor(rng() * DISASTER_DEFINITIONS.length)];
}

/** Rolls whether a positive event occurs this turn; Trading Post investment adds to (not replaces) the room's base chance. */
export function rollEvent(rng: Rng, baseChance: number, tradingPostLevel: number): EffectDefinition | null {
  const chance = baseChance + tradingPostLevel * EVENT_PROBABILITY_BONUS_PER_TRADING_POST_LEVEL;
  if (rng() >= chance) return null;
  return EVENT_DEFINITIONS[Math.floor(rng() * EVENT_DEFINITIONS.length)];
}

export function instantiateEffect(def: EffectDefinition): ActiveEffect {
  return {
    id: randomUUID(),
    definitionId: def.id,
    kind: def.kind,
    name: def.name,
    domain: def.domain,
    magnitude: def.magnitude,
    turnsRemaining: def.durationTurns,
  };
}

/** Ages every active effect by one turn, splitting out the ones that just expired (for turn-log notes) from the ones still running. */
export function tickActiveEffects(effects: ActiveEffect[]): { active: ActiveEffect[]; expired: ActiveEffect[] } {
  const active: ActiveEffect[] = [];
  const expired: ActiveEffect[] = [];

  for (const effect of effects) {
    const turnsRemaining = effect.turnsRemaining - 1;
    if (turnsRemaining <= 0) expired.push(effect);
    else active.push({ ...effect, turnsRemaining });
  }

  return { active, expired };
}

const ALL_DOMAINS: EffectDomain[] = ['agriculture', 'animalHusbandry', 'commerce', 'industry'];

/** Combines every active effect on the same domain additively into one multiplier per domain (e.g. two -30% disasters -> 0.4x, not 0.49x), floored so production never zeroes out or inverts. */
export function computeEffectMultipliers(effects: ActiveEffect[]): Record<EffectDomain, number> {
  const sums: Record<EffectDomain, number> = { agriculture: 0, animalHusbandry: 0, commerce: 0, industry: 0 };
  for (const effect of effects) sums[effect.domain] += effect.magnitude;

  const result = {} as Record<EffectDomain, number>;
  for (const domain of ALL_DOMAINS) result[domain] = Math.max(MIN_EFFECT_PRODUCTION_MULTIPLIER, 1 + sums[domain]);
  return result;
}
