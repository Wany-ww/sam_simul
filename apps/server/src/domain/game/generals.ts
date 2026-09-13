import { randomUUID } from 'node:crypto';
import type { FacilityLevels, General, GeneralAssignmentTarget, Rng } from '@sam-simul/shared';
import {
  GENERAL_APPEARANCE_CHANCE_MAX,
  GENERAL_APPEARANCE_FACILITY_LEVEL_BONUS,
  GENERAL_APPEARANCE_POPULATION_DIVISOR,
  GENERAL_ROSTER,
} from '@sam-simul/shared';

function totalFacilityLevels(facilities: FacilityLevels): number {
  return (
    facilities.agriculture +
    facilities.animalHusbandry +
    facilities.commerce.tradingPost +
    facilities.commerce.taxOffice +
    facilities.commerce.market +
    facilities.industry.armory +
    facilities.industry.weaponsWorkshop +
    facilities.industry.blacksmith +
    facilities.industry.publicWorks
  );
}

/** Rolls whether a new general appears this turn, and if so, hands back a fresh instance of a roster entry not already recruited (by rosterId) by this player. */
export function rollGeneralAppearance(rng: Rng, baseChance: number, population: number, facilities: FacilityLevels, alreadyRecruitedRosterIds: string[]): General | null {
  const chance = Math.min(
    GENERAL_APPEARANCE_CHANCE_MAX,
    baseChance + population / GENERAL_APPEARANCE_POPULATION_DIVISOR / 100 + totalFacilityLevels(facilities) * GENERAL_APPEARANCE_FACILITY_LEVEL_BONUS,
  );

  if (rng() >= chance) return null;

  const candidates = GENERAL_ROSTER.filter((g) => !alreadyRecruitedRosterIds.includes(g.rosterId));
  if (candidates.length === 0) return null;

  const picked = candidates[Math.floor(rng() * candidates.length)];
  return { ...picked, generalId: randomUUID(), assignment: null };
}

export interface ArmyGeneralEffect {
  combatPowerMultiplier: number;
  moraleBonus: number;
  marchSpeedBoostFraction: number; // e.g. 0.3 means marches take 30% less time
}

export interface ActiveGeneralEffects {
  facilityMultiplier: { agriculture: number; animalHusbandry: number; commerce: number; industry: number };
  garrison: { combatPowerMultiplier: number; moraleBonus: number };
  perArmy: Map<string, ArmyGeneralEffect>;
  notes: string[];
}

function emptyEffects(): ActiveGeneralEffects {
  return {
    facilityMultiplier: { agriculture: 1, animalHusbandry: 1, commerce: 1, industry: 1 },
    garrison: { combatPowerMultiplier: 1, moraleBonus: 0 },
    perArmy: new Map(),
    notes: [],
  };
}

/** Rolls each assigned general's trigger chance once for this turn and aggregates the resulting bonuses by target. */
export function computeGeneralEffects(rng: Rng, generals: General[]): ActiveGeneralEffects {
  const effects = emptyEffects();

  for (const general of generals) {
    if (!general.assignment) continue;
    if (rng() >= general.skill.triggerChance) continue;

    const { effectType, magnitude, name: skillName } = general.skill;
    const target = general.assignment;

    if (target.kind === 'facility') {
      if (effectType === 'agricultureBoost' && target.facility === 'agriculture') {
        effects.facilityMultiplier.agriculture += magnitude;
      } else if (effectType === 'husbandryBoost' && target.facility === 'animalHusbandry') {
        effects.facilityMultiplier.animalHusbandry += magnitude;
      } else if (effectType === 'commerceBoost' && target.facility === 'commerce') {
        effects.facilityMultiplier.commerce += magnitude;
      } else if (effectType === 'industryBoost' && target.facility === 'industry') {
        effects.facilityMultiplier.industry += magnitude;
      } else {
        continue; // skill doesn't match the facility it's assigned to; no effect
      }
      effects.notes.push(`${general.name}의 ${skillName}이(가) 발동했습니다.`);
    } else if (target.kind === 'garrison') {
      if (effectType === 'combatPowerBoost') effects.garrison.combatPowerMultiplier += magnitude;
      else if (effectType === 'moraleBoost') effects.garrison.moraleBonus += magnitude * 100;
      else continue;
      effects.notes.push(`${general.name}의 ${skillName}이(가) 발동했습니다.`);
    } else if (target.kind === 'army') {
      const existing = effects.perArmy.get(target.armyId) ?? { combatPowerMultiplier: 1, moraleBonus: 0, marchSpeedBoostFraction: 0 };
      if (effectType === 'combatPowerBoost') existing.combatPowerMultiplier += magnitude;
      else if (effectType === 'moraleBoost') existing.moraleBonus += magnitude * 100;
      else if (effectType === 'cavalryMarchSpeedBoost') existing.marchSpeedBoostFraction += magnitude;
      else continue;
      effects.perArmy.set(target.armyId, existing);
      effects.notes.push(`${general.name}의 ${skillName}이(가) 발동했습니다.`);
    }
  }

  return effects;
}

/** Assigns a recruited-but-unassigned (or reassigns an already-assigned) general to a new target. No-op if the general isn't found. */
export function applyGeneralAssignment(generals: General[], generalId: string, target: GeneralAssignmentTarget): General[] {
  return generals.map((g) => (g.generalId === generalId ? { ...g, assignment: target } : g));
}

export function applyGeneralUnassignment(generals: General[], generalId: string): General[] {
  return generals.map((g) => (g.generalId === generalId ? { ...g, assignment: null } : g));
}
