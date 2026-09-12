import type { ResourceType, UnitType } from '../types/game.js';

// Flavor/display text kept separate from game logic (per the naming/flavor
// cross-cutting decision) so retheming doesn't require touching formulas.
export const RESOURCE_LABEL: Record<ResourceType, string> = {
  rice: '쌀',
  wheat: '밀',
  potato: '감자',
  cotton: '목화',
  hemp: '삼베',
  cattle: '소',
  horse: '말',
  pig: '돼지',
  leather: '가죽',
  spear: '창',
  bow: '활',
  crossbow: '노',
  shield: '방패',
  horseArmor: '마갑',
  armor: '갑옷',
  gold: '금',
};

export const UNIT_TYPE_LABEL: Record<UnitType, string> = {
  spearman: '창병',
  crossbowman: '노병',
  cavalry: '기병',
  engineer: '공병',
};
