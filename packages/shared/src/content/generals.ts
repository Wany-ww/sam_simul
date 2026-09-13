import type { General } from '../types/general.js';

// A curated roster of historical Three Kingdoms figures. Not exhaustive --
// the "real generals only vs. real+generated mix" roster-size question from
// the roadmap is resolved here in favor of a fixed curated set, matching the
// fixed-map precedent from Phase 4; a generated-generals pass can extend
// this list later without changing the appearance/assignment mechanics.
export const GENERAL_ROSTER: readonly Omit<General, 'assignment' | 'generalId'>[] = [
  // Domestic generals
  { rosterId: 'mao-jie', name: '모개', role: 'domestic', skill: { name: '둔전제', effectType: 'agricultureBoost', magnitude: 0.2, triggerChance: 0.35 }, portraitSeed: 'mao-jie' },
  { rosterId: 'xun-yu', name: '순욱', role: 'domestic', skill: { name: '왕좌지재', effectType: 'commerceBoost', magnitude: 0.2, triggerChance: 0.3 }, portraitSeed: 'xun-yu' },
  { rosterId: 'zhuge-liang', name: '제갈량', role: 'domestic', skill: { name: '치국지략', effectType: 'industryBoost', magnitude: 0.25, triggerChance: 0.4 }, portraitSeed: 'zhuge-liang' },
  { rosterId: 'lu-su', name: '노숙', role: 'domestic', skill: { name: '화친책', effectType: 'commerceBoost', magnitude: 0.15, triggerChance: 0.3 }, portraitSeed: 'lu-su' },
  { rosterId: 'dong-zhao', name: '동소', role: 'domestic', skill: { name: '목축진흥', effectType: 'husbandryBoost', magnitude: 0.2, triggerChance: 0.3 }, portraitSeed: 'dong-zhao' },
  { rosterId: 'liu-ye', name: '유엽', role: 'domestic', skill: { name: '병기개량', effectType: 'industryBoost', magnitude: 0.2, triggerChance: 0.3 }, portraitSeed: 'liu-ye' },

  // Combat generals
  { rosterId: 'xiahou-yuan', name: '하후연', role: 'combat', skill: { name: '병귀신속', effectType: 'cavalryMarchSpeedBoost', magnitude: 0.3, triggerChance: 0.4 }, portraitSeed: 'xiahou-yuan' },
  { rosterId: 'guan-yu', name: '관우', role: 'combat', skill: { name: '무신위엄', effectType: 'combatPowerBoost', magnitude: 0.25, triggerChance: 0.35 }, portraitSeed: 'guan-yu' },
  { rosterId: 'zhang-fei', name: '장비', role: 'combat', skill: { name: '만부부당', effectType: 'combatPowerBoost', magnitude: 0.3, triggerChance: 0.3 }, portraitSeed: 'zhang-fei' },
  { rosterId: 'zhao-yun', name: '조운', role: 'combat', skill: { name: '일기당천', effectType: 'combatPowerBoost', magnitude: 0.25, triggerChance: 0.35 }, portraitSeed: 'zhao-yun' },
  { rosterId: 'lu-bu', name: '여포', role: 'combat', skill: { name: '비장군', effectType: 'combatPowerBoost', magnitude: 0.4, triggerChance: 0.25 }, portraitSeed: 'lu-bu' },
  { rosterId: 'gan-ning', name: '감녕', role: 'combat', skill: { name: '백기병', effectType: 'moraleBoost', magnitude: 0.2, triggerChance: 0.3 }, portraitSeed: 'gan-ning' },
  { rosterId: 'taishi-ci', name: '태사자', role: 'combat', skill: { name: '신궁', effectType: 'combatPowerBoost', magnitude: 0.2, triggerChance: 0.35 }, portraitSeed: 'taishi-ci' },
  { rosterId: 'lu-xun', name: '육손', role: 'combat', skill: { name: '화공', effectType: 'combatPowerBoost', magnitude: 0.2, triggerChance: 0.3 }, portraitSeed: 'lu-xun' },
  { rosterId: 'ma-chao', name: '마초', role: 'combat', skill: { name: '서량철기', effectType: 'cavalryMarchSpeedBoost', magnitude: 0.25, triggerChance: 0.35 }, portraitSeed: 'ma-chao' },
  { rosterId: 'dian-wei', name: '전위', role: 'combat', skill: { name: '호위대장', effectType: 'moraleBoost', magnitude: 0.15, triggerChance: 0.3 }, portraitSeed: 'dian-wei' },
];
