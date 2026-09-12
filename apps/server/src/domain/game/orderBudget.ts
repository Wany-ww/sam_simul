import type { PlayerOrder } from '@sam-simul/shared';
import { MARKET_EXCHANGE_POINT_COST, RECRUIT_POINT_COST_PER_UNIT } from '@sam-simul/shared';

/**
 * Clamps a submitted order to the action-point budget by walking a fixed
 * priority order (facility investments, then recruit, then train, then market
 * exchange) and taking whatever fits from the remaining budget at each step.
 * This guarantees every resolved order is affordable without ever rejecting
 * a whole submission outright.
 */
export function clampOrderToBudget(order: PlayerOrder, budget: number): PlayerOrder {
  let remaining = Math.max(0, budget);

  const take = (requested: number): number => {
    const amount = Math.max(0, Math.min(requested || 0, remaining));
    remaining -= amount;
    return amount;
  };

  const agriculture = take(order.investment.agriculture);
  const animalHusbandry = take(order.investment.animalHusbandry);
  const tradingPost = take(order.investment.commerce.tradingPost ?? 0);
  const taxOffice = take(order.investment.commerce.taxOffice ?? 0);
  const market = take(order.investment.commerce.market ?? 0);
  const armory = take(order.investment.industry.armory ?? 0);
  const weaponsWorkshop = take(order.investment.industry.weaponsWorkshop ?? 0);
  const blacksmith = take(order.investment.industry.blacksmith ?? 0);
  const publicWorks = take(order.investment.industry.publicWorks ?? 0);

  let recruit: PlayerOrder['recruit'];
  if (order.recruit && order.recruit.count > 0) {
    const maxByBudget = Math.floor(remaining / RECRUIT_POINT_COST_PER_UNIT);
    const count = Math.min(order.recruit.count, maxByBudget);
    if (count > 0) {
      recruit = { unitType: order.recruit.unitType, count };
      remaining -= count * RECRUIT_POINT_COST_PER_UNIT;
    }
  }

  let train: PlayerOrder['train'];
  if (order.train && order.train.pointsInvested > 0) {
    const pointsInvested = Math.min(order.train.pointsInvested, remaining);
    if (pointsInvested > 0) {
      train = { unitType: order.train.unitType, pointsInvested };
      remaining -= pointsInvested;
    }
  }

  let marketExchange: PlayerOrder['marketExchange'];
  if (order.marketExchange && order.marketExchange.amount > 0 && remaining >= MARKET_EXCHANGE_POINT_COST) {
    marketExchange = order.marketExchange;
    remaining -= MARKET_EXCHANGE_POINT_COST;
  }

  return {
    investment: {
      agriculture,
      animalHusbandry,
      commerce: { tradingPost, taxOffice, market },
      industry: { armory, weaponsWorkshop, blacksmith, publicWorks },
    },
    marketExchange,
    recruit,
    train,
  };
}
