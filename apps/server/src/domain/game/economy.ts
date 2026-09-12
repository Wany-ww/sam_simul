import type { GameCity, ResourceType, Warehouse } from '@sam-simul/shared';
import {
  AGRICULTURE_BASE_OUTPUT_PER_TYPE,
  AGRICULTURE_OUTPUT_PER_LEVEL,
  ARMORY_BASE_OUTPUT_PER_TYPE,
  ARMORY_OUTPUT_PER_LEVEL,
  ARMORY_RESOURCES,
  BLACKSMITH_PRODUCTION_BOOST_PER_LEVEL,
  GRAIN_CONSUMPTION_PER_POPULATION,
  GRAIN_RESOURCES,
  HUSBANDRY_BASE_OUTPUT_PER_TYPE,
  HUSBANDRY_OUTPUT_PER_LEVEL,
  LEATHER_YIELD_RATIO,
  MEAT_RESOURCES,
  PRODUCTION_BONUS_PER_CAPITA,
  PUBLIC_WORKS_GOLD_BOOST_PER_LEVEL,
  TAX_OFFICE_GOLD_PER_LEVEL,
  TEXTILE_RESOURCES,
  TRADING_POST_GOLD_PER_LEVEL,
  WAREHOUSE_CAPACITY,
  WAREHOUSE_DECAY_RATE,
  WEAPONS_WORKSHOP_BOOST_PER_LEVEL,
  WEAPONS_WORKSHOP_RESOURCES,
} from '@sam-simul/shared';

function addAll(target: Warehouse, delta: Warehouse): void {
  for (const [resource, amount] of Object.entries(delta) as [ResourceType, number][]) {
    if (!amount) continue;
    target[resource] = (target[resource] ?? 0) + amount;
  }
}

function splitEvenly(total: number, resources: readonly ResourceType[]): Warehouse {
  const share = total / resources.length;
  const out: Warehouse = {};
  for (const r of resources) out[r] = share;
  return out;
}

/** Agriculture: splits output evenly across the grain group and the textile group, boosted by Blacksmith. */
export function calculateAgricultureOutput(city: GameCity, populationMultiplier: number): Warehouse {
  const level = city.facilities.agriculture;
  const blacksmithBoost = 1 + city.facilities.industry.blacksmith * BLACKSMITH_PRODUCTION_BOOST_PER_LEVEL;
  const grainTotal = (AGRICULTURE_BASE_OUTPUT_PER_TYPE * GRAIN_RESOURCES.length + AGRICULTURE_OUTPUT_PER_LEVEL * level) * blacksmithBoost * populationMultiplier;
  const textileTotal =
    (AGRICULTURE_BASE_OUTPUT_PER_TYPE * TEXTILE_RESOURCES.length + AGRICULTURE_OUTPUT_PER_LEVEL * level) * blacksmithBoost * populationMultiplier;

  return { ...splitEvenly(grainTotal, GRAIN_RESOURCES), ...splitEvenly(textileTotal, TEXTILE_RESOURCES) };
}

/** Animal husbandry: splits output evenly across the meat group, plus a leather yield, boosted by Blacksmith. */
export function calculateHusbandryOutput(city: GameCity, populationMultiplier: number): Warehouse {
  const level = city.facilities.animalHusbandry;
  const blacksmithBoost = 1 + city.facilities.industry.blacksmith * BLACKSMITH_PRODUCTION_BOOST_PER_LEVEL;
  const meatTotal = (HUSBANDRY_BASE_OUTPUT_PER_TYPE * MEAT_RESOURCES.length + HUSBANDRY_OUTPUT_PER_LEVEL * level) * blacksmithBoost * populationMultiplier;

  return { ...splitEvenly(meatTotal, MEAT_RESOURCES), leather: meatTotal * LEATHER_YIELD_RATIO };
}

/** Commerce: Tax Office and Trading Post both produce gold; Public Works boosts Tax Office's output. */
export function calculateCommerceOutput(city: GameCity): Warehouse {
  const publicWorksBoost = 1 + city.facilities.industry.publicWorks * PUBLIC_WORKS_GOLD_BOOST_PER_LEVEL;
  const gold = city.facilities.commerce.taxOffice * TAX_OFFICE_GOLD_PER_LEVEL * publicWorksBoost + city.facilities.commerce.tradingPost * TRADING_POST_GOLD_PER_LEVEL;
  return { gold };
}

/** Industry: Armory produces all six equipment types; Weapons Workshop adds extra output to four of them. */
export function calculateIndustryOutput(city: GameCity): Warehouse {
  const armoryLevel = city.facilities.industry.armory;
  const perType = ARMORY_BASE_OUTPUT_PER_TYPE + ARMORY_OUTPUT_PER_LEVEL * armoryLevel;

  const out: Warehouse = {};
  for (const r of ARMORY_RESOURCES) out[r] = perType;
  for (const r of WEAPONS_WORKSHOP_RESOURCES) {
    out[r] = (out[r] ?? 0) + city.facilities.industry.weaponsWorkshop * WEAPONS_WORKSHOP_BOOST_PER_LEVEL;
  }
  return out;
}

export function populationProductionMultiplier(population: number): number {
  return 1 + population * PRODUCTION_BONUS_PER_CAPITA;
}

/** Adds production to the warehouse, capped per-resource at WAREHOUSE_CAPACITY. */
export function applyProduction(warehouse: Warehouse, production: Warehouse): Warehouse {
  const next: Warehouse = { ...warehouse };
  addAll(next, production);
  for (const resource of Object.keys(next) as ResourceType[]) {
    const cap = WAREHOUSE_CAPACITY[resource];
    if (next[resource]! > cap) next[resource] = cap;
  }
  return next;
}

/** Population upkeep: draws grain proportionally from whichever grain sub-types are in stock. */
export function applyPopulationConsumption(warehouse: Warehouse, population: number): { warehouse: Warehouse; consumed: Warehouse } {
  const needed = population * GRAIN_CONSUMPTION_PER_POPULATION;
  const available = GRAIN_RESOURCES.reduce((sum, r) => sum + (warehouse[r] ?? 0), 0);
  const toConsume = Math.min(needed, available);

  const next: Warehouse = { ...warehouse };
  const consumed: Warehouse = {};
  if (available > 0 && toConsume > 0) {
    for (const r of GRAIN_RESOURCES) {
      const stock = warehouse[r] ?? 0;
      if (stock <= 0) continue;
      const share = (stock / available) * toConsume;
      next[r] = stock - share;
      consumed[r] = share;
    }
  }

  return { warehouse: next, consumed };
}

/** Flat per-turn decay applied after production/consumption; gold is exempt (it isn't a perishable good). */
export function applyDecay(warehouse: Warehouse): Warehouse {
  const next: Warehouse = { ...warehouse };
  for (const [resource, amount] of Object.entries(next) as [ResourceType, number][]) {
    if (resource === 'gold' || !amount) continue;
    next[resource] = amount * (1 - WAREHOUSE_DECAY_RATE);
  }
  return next;
}
