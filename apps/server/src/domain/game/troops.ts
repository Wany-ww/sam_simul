import type { RecruitOrder, TrainOrder, TroopStack, Warehouse } from '@sam-simul/shared';
import { MAX_TRAINING_LEVEL, MAX_TROOPS_PER_POPULATION_RATIO, RECRUIT_EQUIPMENT_COST, RECRUIT_GOLD_COST_PER_UNIT, RECRUIT_MOUNT_COST_PER_CAVALRY, TRAIN_POINTS_PER_LEVEL } from '@sam-simul/shared';

export interface RecruitResult {
  troops: TroopStack[];
  warehouse: Warehouse;
  count: number; // actually recruited, after clamping to population/gold/equipment limits
}

/** Recruitment is clamped independently by population headroom, gold, required equipment, and (for cavalry) horses -- action-point cost is handled separately by orderBudget. */
export function applyRecruitment(troops: TroopStack[], warehouse: Warehouse, population: number, order: RecruitOrder): RecruitResult {
  if (order.count <= 0) return { troops, warehouse, count: 0 };

  const existingTotal = troops.reduce((sum, t) => sum + t.count, 0);
  const populationCap = Math.max(0, Math.floor(population * MAX_TROOPS_PER_POPULATION_RATIO) - existingTotal);

  const maxByGold = Math.floor((warehouse.gold ?? 0) / RECRUIT_GOLD_COST_PER_UNIT);

  const equipment = RECRUIT_EQUIPMENT_COST[order.unitType];
  const maxByEquipment = equipment ? Math.floor(warehouse[equipment] ?? 0) : Number.POSITIVE_INFINITY;

  const maxByMount = order.unitType === 'cavalry' ? Math.floor((warehouse.horse ?? 0) / RECRUIT_MOUNT_COST_PER_CAVALRY) : Number.POSITIVE_INFINITY;

  const count = Math.max(0, Math.min(order.count, populationCap, maxByGold, maxByEquipment, maxByMount));
  if (count === 0) return { troops, warehouse, count: 0 };

  const nextWarehouse: Warehouse = { ...warehouse };
  nextWarehouse.gold = (warehouse.gold ?? 0) - count * RECRUIT_GOLD_COST_PER_UNIT;
  if (equipment) nextWarehouse[equipment] = (warehouse[equipment] ?? 0) - count;
  if (order.unitType === 'cavalry') nextWarehouse.horse = (warehouse.horse ?? 0) - count * RECRUIT_MOUNT_COST_PER_CAVALRY;

  const nextTroops = [...troops];
  const idx = nextTroops.findIndex((t) => t.unitType === order.unitType);
  if (idx >= 0) {
    nextTroops[idx] = { ...nextTroops[idx], count: nextTroops[idx].count + count };
  } else {
    nextTroops.push({ unitType: order.unitType, count, trainingLevel: 0 });
  }

  return { troops: nextTroops, warehouse: nextWarehouse, count };
}

export interface TrainResult {
  troops: TroopStack[];
  levelsGained: number;
}

export function applyTraining(troops: TroopStack[], order: TrainOrder): TrainResult {
  const idx = troops.findIndex((t) => t.unitType === order.unitType && t.count > 0);
  if (idx === -1 || order.pointsInvested <= 0) return { troops, levelsGained: 0 };

  const stack = troops[idx];
  const levelsRequested = order.pointsInvested / TRAIN_POINTS_PER_LEVEL;
  const levelsGained = Math.min(levelsRequested, MAX_TRAINING_LEVEL - stack.trainingLevel);
  if (levelsGained <= 0) return { troops, levelsGained: 0 };

  const nextTroops = [...troops];
  nextTroops[idx] = { ...stack, trainingLevel: stack.trainingLevel + levelsGained };
  return { troops: nextTroops, levelsGained };
}
