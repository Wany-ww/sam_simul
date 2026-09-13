import type { GameCity, MarchOrder, PlayerOrder, ResourceType, Rng, UnitType } from '@sam-simul/shared';
import { MARCH_ORDER_POINT_COST, RECRUIT_EQUIPMENT_COST, getAdjacentNodeIds } from '@sam-simul/shared';

// A simple, deterministic rule-based bot for AI-controlled cities. It goes
// through the exact same resolveTurn/clampOrderToBudget path as any human
// order -- this only decides *what* to request, not how it gets applied --
// so an AI turn is just as replayable and budget-safe as a real one.
//
// Behavior: grow the economy every turn (agriculture/husbandry/armory),
// recruit whatever unit type its current equipment stock actually supports
// (falling back to equipment-free engineers before any armory investment has
// paid off), and once its garrison has more than a defensive buffer, march
// the surplus toward a random adjacent node fairly rarely rather than every
// turn.
export const AI_HOME_DEFENSE_MIN_TROOPS = 10;
export const AI_MARCH_CHANCE = 0.3;
const AI_AGRICULTURE_POINTS = 3;
const AI_HUSBANDRY_POINTS = 2;
const AI_ARMORY_POINTS = 2;

function pickRecruitUnitType(city: GameCity): UnitType {
  const equipped = (Object.entries(RECRUIT_EQUIPMENT_COST) as [UnitType, ResourceType][]).find(
    ([, resource]) => (city.warehouse[resource] ?? 0) >= 1,
  );
  return equipped?.[0] ?? 'engineer';
}

function decideMarch(city: GameCity, remaining: number, rng: Rng): MarchOrder | undefined {
  const homeTroopTotal = city.troops.reduce((sum, t) => sum + t.count, 0);
  if (homeTroopTotal <= AI_HOME_DEFENSE_MIN_TROOPS || remaining < MARCH_ORDER_POINT_COST) return undefined;
  if (rng() >= AI_MARCH_CHANCE) return undefined;

  const biggestStack = [...city.troops].sort((a, b) => b.count - a.count)[0];
  const destinations = getAdjacentNodeIds(city.nodeId);
  if (!biggestStack || destinations.length === 0) return undefined;

  const destinationNodeId = destinations[Math.floor(rng() * destinations.length)];
  const marchCount = Math.min(biggestStack.count, Math.max(1, homeTroopTotal - AI_HOME_DEFENSE_MIN_TROOPS));
  return { unitType: biggestStack.unitType, count: marchCount, destinationNodeId };
}

export function decideAiOrder(city: GameCity, budget: number, rng: Rng): PlayerOrder {
  let remaining = Math.max(0, budget);
  const take = (requested: number): number => {
    const amount = Math.max(0, Math.min(requested, remaining));
    remaining -= amount;
    return amount;
  };

  const agriculture = take(AI_AGRICULTURE_POINTS);
  const animalHusbandry = take(AI_HUSBANDRY_POINTS);
  const armory = take(AI_ARMORY_POINTS);

  // Decide (and reserve budget for) the march before recruiting, so recruit
  // doesn't greedily consume every remaining point and starve the march out
  // the same way clampOrderToBudget would if we requested more than we can
  // actually afford together.
  const march = decideMarch(city, remaining, rng);
  if (march) remaining -= MARCH_ORDER_POINT_COST;

  const recruit = remaining > 0 ? { unitType: pickRecruitUnitType(city), count: remaining } : undefined;

  return {
    investment: { agriculture, animalHusbandry, commerce: {}, industry: { armory } },
    recruit,
    march,
  };
}
