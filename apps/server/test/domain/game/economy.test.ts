import { describe, expect, it } from 'vitest';
import type { GameCity } from '@sam-simul/shared';
import { WAREHOUSE_CAPACITY, WAREHOUSE_DECAY_RATE } from '@sam-simul/shared';
import { applyDecay, applyPopulationConsumption, applyProduction, calculateAgricultureOutput, calculateCommerceOutput, calculateHusbandryOutput, calculateIndustryOutput } from '../../../src/domain/game/economy.js';

function makeCity(overrides: Partial<GameCity> = {}): GameCity {
  return {
    cityId: 'c1',
    ownerId: 'p1',
    name: '도시',
    population: 100,
    facilities: {
      agriculture: 0,
      animalHusbandry: 0,
      commerce: { tradingPost: 0, taxOffice: 0, market: 0 },
      industry: { armory: 0, weaponsWorkshop: 0, blacksmith: 0, publicWorks: 0 },
    },
    warehouse: {},
    troops: [],
    ...overrides,
  };
}

describe('calculateAgricultureOutput', () => {
  it('splits grain and textile output evenly across their sub-types', () => {
    const city = makeCity({ facilities: { ...makeCity().facilities, agriculture: 10 } });
    const output = calculateAgricultureOutput(city, 1);

    expect(output.rice).toBeCloseTo(output.wheat!);
    expect(output.wheat).toBeCloseTo(output.potato!);
    expect(output.cotton).toBeCloseTo(output.hemp!);
  });

  it('increases with facility level and with the Blacksmith boost', () => {
    const base = calculateAgricultureOutput(makeCity(), 1).rice!;
    const cityWithLevel = makeCity({ facilities: { ...makeCity().facilities, agriculture: 10 } });
    const withLevel = calculateAgricultureOutput(cityWithLevel, 1).rice!;
    expect(withLevel).toBeGreaterThan(base);

    const cityWithBlacksmith = makeCity({
      facilities: { ...makeCity().facilities, agriculture: 10, industry: { armory: 0, weaponsWorkshop: 0, blacksmith: 5, publicWorks: 0 } },
    });
    const withBlacksmith = calculateAgricultureOutput(cityWithBlacksmith, 1).rice!;
    expect(withBlacksmith).toBeGreaterThan(withLevel);
  });
});

describe('calculateHusbandryOutput', () => {
  it('produces leather as a fraction of total meat output', () => {
    const city = makeCity({ facilities: { ...makeCity().facilities, animalHusbandry: 6 } });
    const output = calculateHusbandryOutput(city, 1);
    const meatTotal = output.cattle! + output.horse! + output.pig!;
    expect(output.leather).toBeCloseTo(meatTotal * 0.25, 5);
  });
});

describe('calculateCommerceOutput', () => {
  it('produces gold from both tax office and trading post, boosted by public works', () => {
    const withoutPublicWorks = calculateCommerceOutput(
      makeCity({ facilities: { ...makeCity().facilities, commerce: { tradingPost: 2, taxOffice: 5, market: 0 } } }),
    ).gold!;
    const withPublicWorks = calculateCommerceOutput(
      makeCity({
        facilities: { ...makeCity().facilities, commerce: { tradingPost: 2, taxOffice: 5, market: 0 }, industry: { armory: 0, weaponsWorkshop: 0, blacksmith: 0, publicWorks: 10 } },
      }),
    ).gold!;
    expect(withPublicWorks).toBeGreaterThan(withoutPublicWorks);
  });
});

describe('calculateIndustryOutput', () => {
  it('boosts only the weapons-workshop subset (spear/bow/shield/horseArmor), not armor/crossbow', () => {
    const withoutWorkshop = calculateIndustryOutput(makeCity({ facilities: { ...makeCity().facilities, industry: { armory: 5, weaponsWorkshop: 0, blacksmith: 0, publicWorks: 0 } } }));
    const withWorkshop = calculateIndustryOutput(makeCity({ facilities: { ...makeCity().facilities, industry: { armory: 5, weaponsWorkshop: 5, blacksmith: 0, publicWorks: 0 } } }));

    expect(withWorkshop.spear).toBeGreaterThan(withoutWorkshop.spear!);
    expect(withWorkshop.bow).toBeGreaterThan(withoutWorkshop.bow!);
    expect(withWorkshop.armor).toBeCloseTo(withoutWorkshop.armor!);
    expect(withWorkshop.crossbow).toBeCloseTo(withoutWorkshop.crossbow!);
  });
});

describe('applyProduction', () => {
  it('caps each resource at its warehouse capacity', () => {
    const result = applyProduction({ rice: WAREHOUSE_CAPACITY.rice - 5 }, { rice: 100 });
    expect(result.rice).toBe(WAREHOUSE_CAPACITY.rice);
  });
});

describe('applyPopulationConsumption', () => {
  it('draws grain proportionally across sub-types and never goes negative', () => {
    const { warehouse, consumed } = applyPopulationConsumption({ rice: 10, wheat: 0, potato: 0 }, 100_000);
    expect(warehouse.rice).toBe(0);
    expect(consumed.rice).toBe(10);
  });

  it('does not touch non-grain resources', () => {
    const { warehouse } = applyPopulationConsumption({ rice: 100, gold: 50 }, 10);
    expect(warehouse.gold).toBe(50);
  });
});

describe('applyDecay', () => {
  it('reduces perishable resources by the decay rate but leaves gold untouched', () => {
    const result = applyDecay({ rice: 100, gold: 100 });
    expect(result.rice).toBeCloseTo(100 * (1 - WAREHOUSE_DECAY_RATE));
    expect(result.gold).toBe(100);
  });
});
