import type { Army, BattleLogEntry, BattleType, GameCity, MapNodeId, PlayerId, Rng, TroopStack, UnitType } from '@sam-simul/shared';
import { MAX_WALL_DURABILITY, getMapNode } from '@sam-simul/shared';
import type { CombatSide } from './combat.js';
import { resolveBattle, resolveSiege, totalTroopCount } from './combat.js';
import type { ArmyGeneralEffect } from './generals.js';

const NO_ARMY_EFFECT: ArmyGeneralEffect = { combatPowerMultiplier: 1, moraleBonus: 0, marchSpeedBoostFraction: 0 };
export interface GarrisonEffect {
  combatPowerMultiplier: number;
  moraleBonus: number;
}
const NO_GARRISON_EFFECT: GarrisonEffect = { combatPowerMultiplier: 1, moraleBonus: 0 };

export interface BattleNoteAccumulator {
  notes: string[];
  battles: BattleLogEntry[];
}

// Detects and resolves every contested node for this turn: a "battle" is
// re-derived fresh each turn from wherever opposing owners' stationary
// armies (and a city's own garrison) currently sit -- there is no separate
// persistent "Battle in progress" entity. An unresolved fight simply
// re-triggers next turn because both damaged sides are still there.
//
// Scope simplifications (documented rather than hidden):
// - Exactly two sides per node per turn. If three or more owners converge on
//   the same node, only the first pairing found fights this turn.
// - If an owner has multiple armies at the same contested node, their troops
//   are pooled for the fight and consolidated into a single army afterward
//   (stance/fortified are read from that owner's first army at the node).
// - A city's own owner reinforcing their own city with a second army does
//   not currently add that army's troops to the garrison's defense -- only
//   city.troops fights. Left for a later pass since splitting post-battle
//   survivors back between "native garrison" and "visiting army" adds real
//   complexity for a case that doesn't block anything else in this phase.
// - An unclaimed city node (possible when fewer players than starting
//   cities) has no GameCity entry, so contested armies there fight as a
//   field battle rather than one side "capturing" a neutral city.
export function resolveBattlesForTurn(
  cities: GameCity[],
  armies: Army[],
  maxDaysPerTurn: number,
  rng: Rng,
  armyEffects: Map<string, ArmyGeneralEffect> = new Map(),
  garrisonEffects: Map<PlayerId, GarrisonEffect> = new Map(),
): { cities: GameCity[]; armies: Army[]; notesByPlayer: Map<PlayerId, BattleNoteAccumulator> } {
  const notesByPlayer = new Map<PlayerId, BattleNoteAccumulator>();
  const accumulatorFor = (playerId: PlayerId): BattleNoteAccumulator => {
    let acc = notesByPlayer.get(playerId);
    if (!acc) {
      acc = { notes: [], battles: [] };
      notesByPlayer.set(playerId, acc);
    }
    return acc;
  };
  const note = (playerId: PlayerId, text: string) => accumulatorFor(playerId).notes.push(text);
  const logBattle = (playerId: PlayerId, entry: BattleLogEntry) => accumulatorFor(playerId).battles.push(entry);

  const nextCities = cities.map((c) => ({ ...c }));
  const nextArmies = armies.map((a) => ({ ...a }));
  const toRemove = new Set<number>();

  const armyIndexesByNode = new Map<MapNodeId, Map<PlayerId, number[]>>();
  nextArmies.forEach((army, index) => {
    if (army.destinationNodeId !== null || totalTroopCount(army.troops) <= 0) return;
    const byOwner = armyIndexesByNode.get(army.currentNodeId) ?? new Map<PlayerId, number[]>();
    byOwner.set(army.ownerId, [...(byOwner.get(army.ownerId) ?? []), index]);
    armyIndexesByNode.set(army.currentNodeId, byOwner);
  });

  const poolSide = (indexes: number[]): CombatSide => {
    const effectsForIndexes = indexes.map((i) => armyEffects.get(nextArmies[i].armyId) ?? NO_ARMY_EFFECT);
    return {
      troops: mergeStacks(indexes.map((i) => nextArmies[i].troops)),
      morale: average(indexes.map((i, n) => nextArmies[i].morale + effectsForIndexes[n].moraleBonus)),
      stance: nextArmies[indexes[0]].stance,
      fortified: indexes.some((i) => nextArmies[i].fortified),
      powerMultiplier: average(effectsForIndexes.map((e) => e.combatPowerMultiplier)),
    };
  };
  const consolidate = (indexes: number[], finalTroops: TroopStack[], finalMorale: number): void => {
    const [keepIndex, ...dropIndexes] = indexes;
    nextArmies[keepIndex] = { ...nextArmies[keepIndex], troops: finalTroops, morale: finalMorale };
    for (const i of dropIndexes) toRemove.add(i);
  };
  const eliminate = (indexes: number[]): void => {
    for (const i of indexes) toRemove.add(i);
  };

  for (const [nodeId, byOwner] of armyIndexesByNode) {
    const homeCity = nextCities.find((c) => c.nodeId === nodeId);
    const foreignOwners = [...byOwner.keys()].filter((o) => o !== homeCity?.ownerId);

    if (homeCity && foreignOwners.length > 0) {
      const attackerOwnerId = foreignOwners[0];
      const attackerIndexes = byOwner.get(attackerOwnerId)!;
      const garrisonEffect = garrisonEffects.get(homeCity.ownerId) ?? NO_GARRISON_EFFECT;
      resolveSiegeAtNode(homeCity, attackerOwnerId, attackerIndexes, nodeId, maxDaysPerTurn, rng, garrisonEffect, { poolSide, consolidate, eliminate, note, logBattle });
      continue;
    }

    const distinctOwners = [...byOwner.keys()];
    if (distinctOwners.length >= 2) {
      const [ownerA, ownerB] = distinctOwners;
      resolveFieldBattleAtNode(ownerA, byOwner.get(ownerA)!, ownerB, byOwner.get(ownerB)!, nodeId, maxDaysPerTurn, rng, { poolSide, consolidate, eliminate, note, logBattle });
    }
  }

  return { cities: nextCities, armies: nextArmies.filter((_, i) => !toRemove.has(i)), notesByPlayer };
}

interface Helpers {
  poolSide: (indexes: number[]) => CombatSide;
  consolidate: (indexes: number[], troops: TroopStack[], morale: number) => void;
  eliminate: (indexes: number[]) => void;
  note: (playerId: PlayerId, text: string) => void;
  logBattle: (playerId: PlayerId, entry: BattleLogEntry) => void;
}

function resolveSiegeAtNode(
  homeCity: GameCity,
  attackerOwnerId: PlayerId,
  attackerIndexes: number[],
  nodeId: MapNodeId,
  maxDays: number,
  rng: Rng,
  garrisonEffect: GarrisonEffect,
  h: Helpers,
): void {
  const defenderOwnerId = homeCity.ownerId;
  const attackerSide = h.poolSide(attackerIndexes);
  const cityName = homeCity.name;

  if (totalTroopCount(homeCity.troops) === 0) {
    homeCity.ownerId = attackerOwnerId;
    homeCity.troops = attackerSide.troops;
    homeCity.garrisonMorale = attackerSide.morale;
    homeCity.wallDurability = MAX_WALL_DURABILITY;
    h.eliminate(attackerIndexes);
    h.note(attackerOwnerId, `${cityName}을(를) 무혈 입성했습니다.`);
    h.note(defenderOwnerId, `${cityName}이(가) 무혈 함락되었습니다...`);
    return;
  }

  const defenderSide: CombatSide = {
    troops: [...homeCity.troops],
    morale: homeCity.garrisonMorale + garrisonEffect.moraleBonus,
    stance: 'defend',
    fortified: false,
    powerMultiplier: garrisonEffect.combatPowerMultiplier,
  };
  const result = resolveSiege(attackerSide, defenderSide, homeCity.wallDurability, maxDays, rng);

  const attackerOutcome = result.outcome === 'attackerVictory' ? 'won' : result.outcome === 'defenderVictory' ? 'lost' : 'ongoing';
  const defenderOutcome = result.outcome === 'defenderVictory' ? 'won' : result.outcome === 'attackerVictory' ? 'lost' : 'ongoing';
  h.logBattle(attackerOwnerId, battleEntry(nodeId, 'siege', defenderOwnerId, result.daysFought, result.totalAttackerCasualties, result.totalDefenderCasualties, attackerOutcome, result.wallDurability));
  h.logBattle(defenderOwnerId, battleEntry(nodeId, 'siege', attackerOwnerId, result.daysFought, result.totalDefenderCasualties, result.totalAttackerCasualties, defenderOutcome, result.wallDurability));

  if (result.outcome === 'attackerVictory') {
    homeCity.ownerId = attackerOwnerId;
    homeCity.troops = result.attacker.troops;
    homeCity.garrisonMorale = result.attacker.morale;
    homeCity.wallDurability = MAX_WALL_DURABILITY;
    h.eliminate(attackerIndexes);
    h.note(attackerOwnerId, `${cityName}을(를) 함락시켰습니다!`);
    h.note(defenderOwnerId, `${cityName}이(가) 함락되었습니다...`);
  } else if (result.outcome === 'defenderVictory') {
    homeCity.troops = result.defender.troops;
    homeCity.garrisonMorale = result.defender.morale;
    homeCity.wallDurability = result.wallDurability;
    h.eliminate(attackerIndexes);
    h.note(attackerOwnerId, `${cityName} 공성에 실패하여 부대가 전멸했습니다.`);
    h.note(defenderOwnerId, `${cityName}에서 적의 공성을 격퇴했습니다!`);
  } else {
    homeCity.troops = result.defender.troops;
    homeCity.garrisonMorale = result.defender.morale;
    homeCity.wallDurability = result.wallDurability;
    h.consolidate(attackerIndexes, result.attacker.troops, result.attacker.morale);
    h.note(attackerOwnerId, `${cityName}을(를) ${result.daysFought}일째 공성 중입니다. (성벽 내구도: ${Math.round(result.wallDurability)})`);
    h.note(defenderOwnerId, `${cityName}이(가) ${result.daysFought}일째 공성당하고 있습니다. (성벽 내구도: ${Math.round(result.wallDurability)})`);
  }
}

function resolveFieldBattleAtNode(
  ownerA: PlayerId,
  aIndexes: number[],
  ownerB: PlayerId,
  bIndexes: number[],
  nodeId: MapNodeId,
  maxDays: number,
  rng: Rng,
  h: Helpers,
): void {
  const sideA = h.poolSide(aIndexes);
  const sideB = h.poolSide(bIndexes);
  const result = resolveBattle(sideA, sideB, maxDays, rng);
  const nodeName = getMapNode(nodeId)?.name ?? nodeId;

  const aOutcome = result.outcome === 'attackerVictory' ? 'won' : result.outcome === 'defenderVictory' ? 'lost' : 'ongoing';
  const bOutcome = result.outcome === 'defenderVictory' ? 'won' : result.outcome === 'attackerVictory' ? 'lost' : 'ongoing';
  h.logBattle(ownerA, battleEntry(nodeId, 'field', ownerB, result.daysFought, result.totalAttackerCasualties, result.totalDefenderCasualties, aOutcome));
  h.logBattle(ownerB, battleEntry(nodeId, 'field', ownerA, result.daysFought, result.totalDefenderCasualties, result.totalAttackerCasualties, bOutcome));

  if (result.outcome === 'attackerVictory') {
    h.consolidate(aIndexes, result.attacker.troops, result.attacker.morale);
    h.eliminate(bIndexes);
    h.note(ownerA, `${nodeName} 전투에서 승리했습니다!`);
    h.note(ownerB, `${nodeName} 전투에서 패배하여 부대가 전멸했습니다...`);
  } else if (result.outcome === 'defenderVictory') {
    h.consolidate(bIndexes, result.defender.troops, result.defender.morale);
    h.eliminate(aIndexes);
    h.note(ownerB, `${nodeName} 전투에서 승리했습니다!`);
    h.note(ownerA, `${nodeName} 전투에서 패배하여 부대가 전멸했습니다...`);
  } else {
    h.consolidate(aIndexes, result.attacker.troops, result.attacker.morale);
    h.consolidate(bIndexes, result.defender.troops, result.defender.morale);
    h.note(ownerA, `${nodeName}에서 ${result.daysFought}일째 교전 중입니다.`);
    h.note(ownerB, `${nodeName}에서 ${result.daysFought}일째 교전 중입니다.`);
  }
}

function mergeStacks(stackLists: TroopStack[][]): TroopStack[] {
  const totals = new Map<UnitType, { count: number; trainingWeighted: number }>();
  for (const stacks of stackLists) {
    for (const stack of stacks) {
      const entry = totals.get(stack.unitType) ?? { count: 0, trainingWeighted: 0 };
      entry.count += stack.count;
      entry.trainingWeighted += stack.count * stack.trainingLevel;
      totals.set(stack.unitType, entry);
    }
  }
  return [...totals.entries()].map(([unitType, { count, trainingWeighted }]) => ({
    unitType,
    count,
    trainingLevel: count > 0 ? trainingWeighted / count : 0,
  }));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function battleEntry(
  nodeId: MapNodeId,
  battleType: BattleType,
  opponentPlayerId: PlayerId,
  daysFought: number,
  ownCasualties: number,
  opponentCasualties: number,
  outcome: 'ongoing' | 'won' | 'lost',
  wallDurabilityRemaining?: number,
): BattleLogEntry {
  return { nodeId, battleType, opponentPlayerId, daysFought, ownCasualties, opponentCasualties, outcome, wallDurabilityRemaining };
}
