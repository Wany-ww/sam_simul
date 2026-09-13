import { describe, expect, it } from 'vitest';
import type { PlayerOrder } from '@sam-simul/shared';
import { clampOrderToBudget } from '../../../src/domain/game/orderBudget.js';

function order(overrides: Partial<PlayerOrder>): PlayerOrder {
  return {
    investment: { agriculture: 0, animalHusbandry: 0, commerce: {}, industry: {} },
    ...overrides,
  };
}

describe('clampOrderToBudget', () => {
  it('passes through an order that fits within budget unchanged', () => {
    const result = clampOrderToBudget(order({ investment: { agriculture: 3, animalHusbandry: 2, commerce: {}, industry: {} } }), 10);
    expect(result.investment.agriculture).toBe(3);
    expect(result.investment.animalHusbandry).toBe(2);
  });

  it('clamps total investment spend to the budget, processing fields in priority order', () => {
    const result = clampOrderToBudget(order({ investment: { agriculture: 8, animalHusbandry: 8, commerce: {}, industry: {} } }), 10);
    expect(result.investment.agriculture).toBe(8);
    expect(result.investment.animalHusbandry).toBe(2); // only 2 points left
  });

  it('drops recruit/train/market orders entirely once the budget is exhausted by investment', () => {
    const result = clampOrderToBudget(
      order({
        investment: { agriculture: 10, animalHusbandry: 0, commerce: {}, industry: {} },
        recruit: { unitType: 'spearman', count: 5 },
        train: { unitType: 'spearman', pointsInvested: 5 },
        marketExchange: { from: 'rice', amount: 10 },
      }),
      10,
    );
    expect(result.recruit).toBeUndefined();
    expect(result.train).toBeUndefined();
    expect(result.marketExchange).toBeUndefined();
  });

  it('clamps recruit count down to whatever the remaining budget can afford, at RECRUIT_UNITS_PER_POINT per point', () => {
    const result = clampOrderToBudget(
      order({ investment: { agriculture: 9, animalHusbandry: 0, commerce: {}, industry: {} }, recruit: { unitType: 'spearman', count: 100 } }),
      10,
    );
    // 1 point remains -> up to RECRUIT_UNITS_PER_POINT (5) troops afforded by budget.
    expect(result.recruit).toEqual({ unitType: 'spearman', count: 5 });
  });

  it('does not clamp a recruit request that already fits within one point\'s worth of troops', () => {
    const result = clampOrderToBudget(
      order({ investment: { agriculture: 7, animalHusbandry: 0, commerce: {}, industry: {} }, recruit: { unitType: 'spearman', count: 10 } }),
      10,
    );
    // 3 points remain -> up to 15 troops afforded; the requested 10 fits untouched.
    expect(result.recruit).toEqual({ unitType: 'spearman', count: 10 });
  });

  it('never produces a negative investment even if given one', () => {
    const result = clampOrderToBudget(order({ investment: { agriculture: -5, animalHusbandry: 0, commerce: {}, industry: {} } }), 10);
    expect(result.investment.agriculture).toBe(0);
  });
});
