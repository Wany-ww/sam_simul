import { randomUUID } from 'node:crypto';
import type { Army, GameCity, MarchOrder, TroopStack } from '@sam-simul/shared';
import { TURN_DURATION_DAYS, findEdge } from '@sam-simul/shared';

export interface CreateArmyResult {
  army: Army | null; // null if the order is invalid or the unit isn't available
  troops: TroopStack[]; // city troops after the marching soldiers are removed
}

// Phase 4 scope: an army can only be ordered to an already-adjacent node (one
// edge at a time) -- multi-hop pathfinding is left for a later pass since it
// isn't needed to prove out the map/movement architecture.
export function createArmyFromMarchOrder(city: GameCity, order: MarchOrder, mapSizeMultiplier: number): CreateArmyResult {
  if (order.count <= 0) return { army: null, troops: city.troops };

  const stack = city.troops.find((t) => t.unitType === order.unitType);
  if (!stack || stack.count <= 0) return { army: null, troops: city.troops };

  const edge = findEdge(city.nodeId, order.destinationNodeId);
  if (!edge) return { army: null, troops: city.troops };

  const count = Math.min(order.count, stack.count);
  const daysRemaining = Math.max(1, Math.round(edge.baseDistanceDays * mapSizeMultiplier));

  const nextTroops = city.troops.map((t) => (t.unitType === order.unitType ? { ...t, count: t.count - count } : t)).filter((t) => t.count > 0);

  const army: Army = {
    armyId: randomUUID(),
    ownerId: city.ownerId,
    originCityId: city.cityId,
    troops: [{ unitType: order.unitType, count, trainingLevel: stack.trainingLevel }],
    currentNodeId: city.nodeId,
    destinationNodeId: order.destinationNodeId,
    daysRemaining,
  };

  return { army, troops: nextTroops };
}

/** Advances a marching army by one turn's worth of days; arrival snaps currentNodeId to the destination. */
export function advanceArmy(army: Army): Army {
  if (army.destinationNodeId === null || army.daysRemaining <= 0) return army;

  const daysRemaining = army.daysRemaining - TURN_DURATION_DAYS;
  if (daysRemaining <= 0) {
    return { ...army, currentNodeId: army.destinationNodeId, destinationNodeId: null, daysRemaining: 0 };
  }
  return { ...army, daysRemaining };
}
