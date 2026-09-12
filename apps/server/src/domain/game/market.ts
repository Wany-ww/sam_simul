import type { MarketExchangeOrder, Warehouse } from '@sam-simul/shared';
import { MARKET_BASE_EXCHANGE_RATE, MARKET_EXCHANGE_TARGET, MARKET_MAX_EXCHANGE_RATE, MARKET_RATE_IMPROVEMENT_PER_LEVEL, PUBLIC_WORKS_MARKET_RATE_BOOST_PER_LEVEL } from '@sam-simul/shared';

export interface MarketExchangeResult {
  warehouse: Warehouse;
  amountIn: number;
  amountOut: number;
}

/** Converts a surplus resource into gold; the exchange rate improves toward (but never reaches) 1:1 as Market and Public Works levels rise. */
export function applyMarketExchange(warehouse: Warehouse, order: MarketExchangeOrder, marketLevel: number, publicWorksLevel: number): MarketExchangeResult {
  const available = warehouse[order.from] ?? 0;
  const amountIn = Math.min(Math.max(order.amount, 0), available);

  if (amountIn <= 0 || order.from === MARKET_EXCHANGE_TARGET) {
    return { warehouse, amountIn: 0, amountOut: 0 };
  }

  const rate = Math.min(
    MARKET_MAX_EXCHANGE_RATE,
    MARKET_BASE_EXCHANGE_RATE + marketLevel * MARKET_RATE_IMPROVEMENT_PER_LEVEL + publicWorksLevel * PUBLIC_WORKS_MARKET_RATE_BOOST_PER_LEVEL,
  );
  const amountOut = amountIn * rate;

  const next: Warehouse = { ...warehouse };
  next[order.from] = available - amountIn;
  next[MARKET_EXCHANGE_TARGET] = (next[MARKET_EXCHANGE_TARGET] ?? 0) + amountOut;

  return { warehouse: next, amountIn, amountOut };
}
