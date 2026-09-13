export type GeneralRole = 'domestic' | 'combat';

// Effect types cover both domestic (facility output) and combat use cases.
// Specialized unit-type upgrades (long-spear/light-cavalry/heavy-cavalry per
// the spec) are a separate, deeper combat-mechanics change and stay
// deferred; this phase is scoped to the general/skill system itself.
export type SkillEffectType =
  | 'agricultureBoost'
  | 'husbandryBoost'
  | 'commerceBoost'
  | 'industryBoost'
  | 'cavalryMarchSpeedBoost'
  | 'combatPowerBoost'
  | 'moraleBoost';

export interface GeneralSkill {
  name: string; // e.g. "둔전제"
  effectType: SkillEffectType;
  magnitude: number; // e.g. 0.2 means +20%
  triggerChance: number; // 0..1, rolled once per turn this general is assigned
}

// A 5-stat block (0-100), the standard convention across Chinese-historical
// strategy games generally -- not any one game's proprietary numbers.
// Optional so hand-built General objects (tests, ad-hoc fixtures) don't need
// updating; every roster-sourced general always has one.
export interface GeneralStats {
  command: number; // 통솔
  force: number; // 무력
  intelligence: number; // 지력
  politics: number; // 정치
  charm: number; // 매력
}

export type GeneralAssignmentTarget =
  | { kind: 'facility'; facility: 'agriculture' | 'animalHusbandry' | 'commerce' | 'industry' }
  | { kind: 'army'; armyId: string }
  | { kind: 'garrison' };

export interface General {
  generalId: string; // unique per recruited instance
  rosterId: string; // stable id of the roster entry this was recruited from, e.g. "mao-jie" -- used to prevent recruiting the same historical figure twice
  name: string;
  role: GeneralRole;
  skill: GeneralSkill;
  stats?: GeneralStats;
  portraitSeed: string; // derives a deterministic placeholder avatar (color + initial) -- no real art pipeline yet
  assignment: GeneralAssignmentTarget | null;
}

export interface AssignGeneralOrder {
  generalId: string;
  target: GeneralAssignmentTarget;
}

export interface UnassignGeneralOrder {
  generalId: string;
}
