import type { ArmyStance, DaySnapshot, Rng, TroopStack } from '@sam-simul/shared';
import {
  DAILY_CASUALTY_COEFFICIENT,
  FORTIFICATION_DAMAGE_TAKEN_MULTIPLIER,
  MORALE_COMBAT_MULTIPLIER_MIN,
  MORALE_DAILY_DECAY,
  PANIC_LOSS_FRACTION_THRESHOLD,
  PANIC_MORALE_PENALTY,
  ROUT_TROOP_THRESHOLD,
  SIEGE_DEFENDER_MORALE_DAILY_PENALTY,
  STANCE_ATTACK_DAMAGE_MULTIPLIER,
  STANCE_ATTACK_MORALE_GAIN,
  STANCE_DEFEND_DAMAGE_TAKEN_MULTIPLIER,
  TRAINING_COMBAT_BONUS_PER_LEVEL,
  UNIT_COMBAT_VALUE,
  UNIT_SIEGE_VALUE,
  WALL_DAMAGE_COEFFICIENT,
} from '@sam-simul/shared';

// Combat is fought as daily sub-ticks (resolveBattle/resolveSiege loop up to
// TURN_DURATION_DAYS times per turn resolution) rather than one batch roll,
// so morale/panic/rout track a per-day cadence per the spec. Every function
// here is pure -- randomness comes only from the rng passed in, never
// Math.random(), so a battle is replayable from the same turn seed.

export interface CombatSide {
  troops: TroopStack[];
  morale: number;
  stance: ArmyStance;
  fortified: boolean;
  powerMultiplier?: number; // from an assigned general's combat skill, default 1
}

export function totalTroopCount(troops: TroopStack[]): number {
  return troops.reduce((sum, t) => sum + t.count, 0);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function computeCombatPower(side: CombatSide, isSiegeAttacker: boolean): number {
  const valueTable = isSiegeAttacker ? UNIT_SIEGE_VALUE : UNIT_COMBAT_VALUE;
  let power = 0;
  for (const stack of side.troops) {
    const trainingMultiplier = 1 + stack.trainingLevel * TRAINING_COMBAT_BONUS_PER_LEVEL;
    power += stack.count * valueTable[stack.unitType] * trainingMultiplier;
  }

  const moraleMultiplier = MORALE_COMBAT_MULTIPLIER_MIN + (1 - MORALE_COMBAT_MULTIPLIER_MIN) * clamp01(side.morale / 100);
  power *= moraleMultiplier;

  if (side.stance === 'attack') power *= STANCE_ATTACK_DAMAGE_MULTIPLIER;
  power *= side.powerMultiplier ?? 1;

  return power;
}

/**
 * Removes `casualties` troops from a stack list, proportionally across stacks
 * by their current share of the total. Losses are kept fractional rather than
 * rounded per day: a weak unit's daily casualties are often well under 1, and
 * rounding that down to 0 every day meant such battles could never actually
 * grind a side down -- only morale hitting 0 ever ended them. Carrying the
 * fraction forward lets it accumulate into a real loss over several days.
 * Display layers are expected to round for presentation.
 */
export function applyCasualties(troops: TroopStack[], casualties: number): { troops: TroopStack[]; actualCasualties: number } {
  const total = totalTroopCount(troops);
  if (total <= 0 || casualties <= 0) return { troops, actualCasualties: 0 };

  const toRemove = Math.min(casualties, total);
  const nextTroops = troops
    .map((stack) => {
      const share = stack.count / total;
      const loss = toRemove * share;
      return { ...stack, count: Math.max(0, stack.count - loss) };
    })
    .filter((stack) => stack.count > 0.001);

  const actualCasualties = total - totalTroopCount(nextTroops);
  return { troops: nextTroops, actualCasualties };
}

export interface DayResult {
  attacker: CombatSide;
  defender: CombatSide;
  attackerCasualties: number;
  defenderCasualties: number;
  wallDamage: number; // 0 for field battles
}

/** Resolves exactly one day of combat between two sides. `isSiege` uses the attacker's siege combat values and adds the defender's per-day besieged morale penalty. */
export function resolveCombatDay(attacker: CombatSide, defender: CombatSide, isSiege: boolean, rng: Rng): DayResult {
  const attackerPower = computeCombatPower(attacker, isSiege);
  const defenderPower = computeCombatPower(defender, false);
  const variance = () => 0.8 + rng() * 0.4; // +/-20% daily variance

  let defenderCasualtiesRaw = attackerPower * DAILY_CASUALTY_COEFFICIENT * variance();
  let attackerCasualtiesRaw = defenderPower * DAILY_CASUALTY_COEFFICIENT * variance();

  if (defender.stance === 'defend') defenderCasualtiesRaw *= STANCE_DEFEND_DAMAGE_TAKEN_MULTIPLIER;
  if (attacker.stance === 'defend') attackerCasualtiesRaw *= STANCE_DEFEND_DAMAGE_TAKEN_MULTIPLIER;
  if (defender.fortified) defenderCasualtiesRaw *= FORTIFICATION_DAMAGE_TAKEN_MULTIPLIER;
  if (attacker.fortified) attackerCasualtiesRaw *= FORTIFICATION_DAMAGE_TAKEN_MULTIPLIER;

  const attackerTotalBefore = totalTroopCount(attacker.troops);
  const defenderTotalBefore = totalTroopCount(defender.troops);

  const { troops: defenderTroopsAfter, actualCasualties: defenderCasualties } = applyCasualties(defender.troops, defenderCasualtiesRaw);
  const { troops: attackerTroopsAfter, actualCasualties: attackerCasualties } = applyCasualties(attacker.troops, attackerCasualtiesRaw);

  const attackerPanicked = attackerTotalBefore > 0 && attackerCasualties / attackerTotalBefore > PANIC_LOSS_FRACTION_THRESHOLD;
  const defenderPanicked = defenderTotalBefore > 0 && defenderCasualties / defenderTotalBefore > PANIC_LOSS_FRACTION_THRESHOLD;

  let attackerMorale = attacker.morale - MORALE_DAILY_DECAY;
  let defenderMorale = defender.morale - MORALE_DAILY_DECAY;
  if (attacker.stance === 'attack') attackerMorale += STANCE_ATTACK_MORALE_GAIN;
  if (defender.stance === 'attack') defenderMorale += STANCE_ATTACK_MORALE_GAIN;
  if (attackerPanicked) attackerMorale -= PANIC_MORALE_PENALTY;
  if (defenderPanicked) defenderMorale -= PANIC_MORALE_PENALTY;
  if (isSiege) defenderMorale -= SIEGE_DEFENDER_MORALE_DAILY_PENALTY;

  return {
    attacker: { ...attacker, troops: attackerTroopsAfter, morale: Math.max(0, attackerMorale) },
    defender: { ...defender, troops: defenderTroopsAfter, morale: Math.max(0, defenderMorale) },
    attackerCasualties,
    defenderCasualties,
    wallDamage: isSiege ? attackerPower * WALL_DAMAGE_COEFFICIENT : 0,
  };
}

export type BattleOutcome = 'ongoing' | 'attackerVictory' | 'defenderVictory';

export interface BattleResult {
  attacker: CombatSide;
  defender: CombatSide;
  daysFought: number;
  totalAttackerCasualties: number;
  totalDefenderCasualties: number;
  outcome: BattleOutcome;
  dayLog: DaySnapshot[];
}

function isRouted(side: CombatSide): boolean {
  return totalTroopCount(side.troops) <= ROUT_TROOP_THRESHOLD || side.morale <= 0;
}

/** Runs up to `maxDays` daily sub-ticks of a field battle, stopping early once either side routs. */
export function resolveBattle(attacker: CombatSide, defender: CombatSide, maxDays: number, rng: Rng): BattleResult {
  return runDays(attacker, defender, false, maxDays, rng).result;
}

export interface SiegeResult extends BattleResult {
  wallDurability: number;
}

/** Runs up to `maxDays` daily sub-ticks of a siege; the city also falls if wallDurability reaches 0, independent of the garrison's troop count. */
export function resolveSiege(attacker: CombatSide, defender: CombatSide, wallDurability: number, maxDays: number, rng: Rng): SiegeResult {
  const { result, wallDurability: finalWall } = runDays(attacker, defender, true, maxDays, rng, wallDurability);
  let outcome = result.outcome;
  if (outcome === 'ongoing' && finalWall <= 0) outcome = 'attackerVictory';
  return { ...result, outcome, wallDurability: Math.max(0, finalWall) };
}

function runDays(
  attacker: CombatSide,
  defender: CombatSide,
  isSiege: boolean,
  maxDays: number,
  rng: Rng,
  startingWallDurability = Number.POSITIVE_INFINITY,
): { result: BattleResult; wallDurability: number } {
  let currentAttacker = attacker;
  let currentDefender = defender;
  let wallDurability = startingWallDurability;
  let totalAttackerCasualties = 0;
  let totalDefenderCasualties = 0;
  let daysFought = 0;
  let outcome: BattleOutcome = 'ongoing';
  const dayLog: DaySnapshot[] = [];

  for (let day = 0; day < maxDays; day++) {
    const dayResult = resolveCombatDay(currentAttacker, currentDefender, isSiege, rng);
    currentAttacker = dayResult.attacker;
    currentDefender = dayResult.defender;
    totalAttackerCasualties += dayResult.attackerCasualties;
    totalDefenderCasualties += dayResult.defenderCasualties;
    wallDurability -= dayResult.wallDamage;
    daysFought++;

    dayLog.push({
      day: daysFought,
      attackerTroops: totalTroopCount(currentAttacker.troops),
      defenderTroops: totalTroopCount(currentDefender.troops),
      attackerMorale: currentAttacker.morale,
      defenderMorale: currentDefender.morale,
      ...(isSiege ? { wallDurability: Math.max(0, wallDurability) } : {}),
    });

    const attackerRouted = isRouted(currentAttacker);
    const defenderRouted = isRouted(currentDefender) || (isSiege && wallDurability <= 0);

    if (attackerRouted && defenderRouted) {
      outcome = 'defenderVictory'; // mutual destruction defaults to defender advantage
      break;
    }
    if (attackerRouted) {
      outcome = 'defenderVictory';
      break;
    }
    if (defenderRouted) {
      outcome = 'attackerVictory';
      break;
    }
  }

  return {
    result: { attacker: currentAttacker, defender: currentDefender, daysFought, totalAttackerCasualties, totalDefenderCasualties, outcome, dayLog },
    wallDurability,
  };
}
