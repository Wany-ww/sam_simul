import type { GameCity, GameState, PlayerId, PlayerOrder, ResourceType, TurnLogEntry, Warehouse } from '@sam-simul/shared';
import { RESOURCE_LABEL, UNIT_TYPE_LABEL, createSeededRng } from '@sam-simul/shared';
import { applyDecay, applyPopulationConsumption, applyProduction, calculateAgricultureOutput, calculateCommerceOutput, calculateHusbandryOutput, calculateIndustryOutput, populationProductionMultiplier } from './economy.js';
import { applyMarketExchange } from './market.js';
import { rollPopulationGrowth } from './population.js';
import { applyRecruitment, applyTraining } from './troops.js';
import { clampOrderToBudget } from './orderBudget.js';

export interface ResolveTurnResult {
  nextState: GameState;
  log: TurnLogEntry[];
}

const EMPTY_ORDER: PlayerOrder = {
  investment: { agriculture: 0, animalHusbandry: 0, commerce: {}, industry: {} },
};

function mergeWarehouses(...parts: Warehouse[]): Warehouse {
  const out: Warehouse = {};
  for (const part of parts) {
    for (const [resource, amount] of Object.entries(part) as [ResourceType, number][]) {
      if (!amount) continue;
      out[resource] = (out[resource] ?? 0) + amount;
    }
  }
  return out;
}

// Pure, deterministic turn resolution: same (state, orders, seed) always
// produces the same result. No Date.now()/Math.random() calls here -- that is
// what makes turns replayable and unit-testable without any network layer.
// Orchestrates the smaller pure helpers in economy/market/population/troops;
// this function's job is just sequencing them per city and building the log.
export function resolveTurn(state: GameState, orders: Map<PlayerId, PlayerOrder>, actionPointsPerTurn: number, rngSeed: string): ResolveTurnResult {
  const rng = createSeededRng(rngSeed);
  const log: TurnLogEntry[] = [];

  const nextCities: GameCity[] = state.cities.map((city) => {
    const rawOrder = orders.get(city.ownerId) ?? EMPTY_ORDER;
    const order = clampOrderToBudget(rawOrder, actionPointsPerTurn);
    const notes: string[] = [];

    const nextFacilities = {
      agriculture: city.facilities.agriculture + order.investment.agriculture,
      animalHusbandry: city.facilities.animalHusbandry + order.investment.animalHusbandry,
      commerce: {
        tradingPost: city.facilities.commerce.tradingPost + (order.investment.commerce.tradingPost ?? 0),
        taxOffice: city.facilities.commerce.taxOffice + (order.investment.commerce.taxOffice ?? 0),
        market: city.facilities.commerce.market + (order.investment.commerce.market ?? 0),
      },
      industry: {
        armory: city.facilities.industry.armory + (order.investment.industry.armory ?? 0),
        weaponsWorkshop: city.facilities.industry.weaponsWorkshop + (order.investment.industry.weaponsWorkshop ?? 0),
        blacksmith: city.facilities.industry.blacksmith + (order.investment.industry.blacksmith ?? 0),
        publicWorks: city.facilities.industry.publicWorks + (order.investment.industry.publicWorks ?? 0),
      },
    };

    const cityWithNewFacilities: GameCity = { ...city, facilities: nextFacilities };
    const populationMultiplier = populationProductionMultiplier(city.population);

    const produced = mergeWarehouses(
      calculateAgricultureOutput(cityWithNewFacilities, populationMultiplier),
      calculateHusbandryOutput(cityWithNewFacilities, populationMultiplier),
      calculateCommerceOutput(cityWithNewFacilities),
      calculateIndustryOutput(cityWithNewFacilities),
    );

    let warehouse = applyProduction(city.warehouse, produced);

    const { warehouse: warehouseAfterUpkeep, consumed: upkeepConsumed } = applyPopulationConsumption(warehouse, city.population);
    warehouse = warehouseAfterUpkeep;

    const consumedParts: Warehouse[] = [upkeepConsumed];

    let marketExchange: TurnLogEntry['marketExchange'];
    if (order.marketExchange) {
      const result = applyMarketExchange(warehouse, order.marketExchange, nextFacilities.commerce.market, nextFacilities.industry.publicWorks);
      warehouse = result.warehouse;
      if (result.amountIn > 0) {
        marketExchange = { from: order.marketExchange.from, amountIn: result.amountIn, amountOut: result.amountOut };
        consumedParts.push({ [order.marketExchange.from]: result.amountIn } as Warehouse);
        notes.push(`시장에서 ${RESOURCE_LABEL[order.marketExchange.from]} ${round(result.amountIn)}을(를) 팔아 금 ${round(result.amountOut)}을(를) 얻었습니다.`);
      }
    }

    let troops = city.troops;
    let recruited: TurnLogEntry['recruited'];
    if (order.recruit) {
      const result = applyRecruitment(troops, warehouse, city.population, order.recruit);
      troops = result.troops;
      warehouse = result.warehouse;
      if (result.count > 0) {
        recruited = { unitType: order.recruit.unitType, count: result.count };
        notes.push(`${UNIT_TYPE_LABEL[order.recruit.unitType]} ${result.count}명을 징집했습니다.`);
      }
    }

    let trained: TurnLogEntry['trained'];
    if (order.train) {
      const result = applyTraining(troops, order.train);
      troops = result.troops;
      if (result.levelsGained > 0) {
        trained = { unitType: order.train.unitType, levelsGained: round(result.levelsGained) };
        notes.push(`${UNIT_TYPE_LABEL[order.train.unitType]} 훈련도가 ${round(result.levelsGained)} 상승했습니다.`);
      }
    }

    warehouse = applyDecay(warehouse);

    const populationDelta = rollPopulationGrowth(rng, nextFacilities);
    if (populationDelta > 0) notes.push(`인구가 ${populationDelta}명 증가했습니다.`);

    log.push({
      turnNumber: state.turnNumber,
      cityId: city.cityId,
      playerId: city.ownerId,
      populationDelta,
      resourceProduced: roundWarehouse(produced),
      resourceConsumed: roundWarehouse(mergeWarehouses(...consumedParts)),
      marketExchange,
      recruited,
      trained,
      notes,
    });

    return {
      ...city,
      population: city.population + populationDelta,
      facilities: nextFacilities,
      warehouse: roundWarehouse(warehouse),
      troops,
    };
  });

  const nextState: GameState = {
    ...state,
    turnNumber: state.turnNumber + 1,
    cities: nextCities,
    submittedPlayerIds: [],
    lastTurnLog: log,
  };

  return { nextState, log };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundWarehouse(warehouse: Warehouse): Warehouse {
  const out: Warehouse = {};
  for (const [resource, amount] of Object.entries(warehouse) as [ResourceType, number][]) {
    out[resource] = round(amount);
  }
  return out;
}
