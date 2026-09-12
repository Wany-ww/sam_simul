import { describe, expect, it } from 'vitest';
import { applyMarketExchange } from '../../../src/domain/game/market.js';

describe('applyMarketExchange', () => {
  it('converts the offered resource into gold at the base rate when market/public-works are level 0', () => {
    const result = applyMarketExchange({ rice: 100 }, { from: 'rice', amount: 30 }, 0, 0);
    expect(result.amountIn).toBe(30);
    expect(result.amountOut).toBeCloseTo(30 * 0.33);
    expect(result.warehouse.rice).toBe(70);
    expect(result.warehouse.gold).toBeCloseTo(30 * 0.33);
  });

  it('clamps the offered amount to what is actually in stock', () => {
    const result = applyMarketExchange({ rice: 10 }, { from: 'rice', amount: 100 }, 0, 0);
    expect(result.amountIn).toBe(10);
    expect(result.warehouse.rice).toBe(0);
  });

  it('improves the exchange rate as market and public-works levels rise, but never reaches 1:1', () => {
    const low = applyMarketExchange({ rice: 100 }, { from: 'rice', amount: 100 }, 0, 0);
    const high = applyMarketExchange({ rice: 100 }, { from: 'rice', amount: 100 }, 10, 10);
    expect(high.amountOut).toBeGreaterThan(low.amountOut);
    expect(high.amountOut).toBeLessThan(100); // never a full 1:1
  });

  it('is a no-op when offering the target resource itself (gold) or a non-positive amount', () => {
    expect(applyMarketExchange({ gold: 50 }, { from: 'gold', amount: 10 }, 0, 0).amountIn).toBe(0);
    expect(applyMarketExchange({ rice: 50 }, { from: 'rice', amount: 0 }, 0, 0).amountIn).toBe(0);
  });
});
