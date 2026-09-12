import type { FacilityLevels } from '@sam-simul/shared';
import type { Rng } from '@sam-simul/shared';
import {
  POPULATION_GROWTH_BASE_CHANCE,
  POPULATION_GROWTH_CHANCE_MAX,
  POPULATION_GROWTH_CHANCE_PER_FACILITY_LEVEL,
  POPULATION_GROWTH_MAX,
  POPULATION_GROWTH_MIN,
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

/** Rolls whether population grows this turn, and by how much. The first real consumer of the seeded rng threaded through resolveTurn since Phase 2. */
export function rollPopulationGrowth(rng: Rng, facilities: FacilityLevels): number {
  const chance = Math.min(
    POPULATION_GROWTH_CHANCE_MAX,
    POPULATION_GROWTH_BASE_CHANCE + totalFacilityLevels(facilities) * POPULATION_GROWTH_CHANCE_PER_FACILITY_LEVEL,
  );

  if (rng() >= chance) return 0;

  const span = POPULATION_GROWTH_MAX - POPULATION_GROWTH_MIN;
  return POPULATION_GROWTH_MIN + Math.floor(rng() * (span + 1));
}
