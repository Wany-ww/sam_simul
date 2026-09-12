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

  it('clamps recruit count down to whatever budget remains', () => {
    const result = clampOrderToBudget(
      order({ investment: { agriculture: 7, animalHusbandry: 0, commerce: {}, industry: {} }, recruit: { unitType: 'spearman', count: 10 } }),
      10,
    );
    expect(result.recruit).toEqual({ unitType: 'spearman', count: 3 });
  });

  it('never produces a negative investment even if given one', () => {
    const result = clampOrderToBudget(order({ investment: { agriculture: -5, animalHusbandry: 0, commerce: {}, industry: {} } }), 10);
    expect(result.investment.agriculture).toBe(0);
  });
});
