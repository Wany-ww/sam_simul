import type { General, GeneralRole, SkillEffectType } from '../types/general.js';

// A curated roster of historical Three Kingdoms figures. Not exhaustive --
// the "real generals only vs. real+generated mix" roster-size question from
// the roadmap is resolved here in favor of a fixed curated set, matching the
// fixed-map precedent from Phase 4; a generated-generals pass can extend
// this list later without changing the appearance/assignment mechanics.
//
// Deliberately excludes names already used by AI_PLAYER_NAME_POOL
// (aiNames.ts) so a recruitable general's name never collides with a
// bot player's display name in the same room.
type RosterEntry = Omit<General, 'assignment' | 'generalId'>;

const DOMESTIC_SKILL_NAMES: Partial<Record<SkillEffectType, string[]>> = {
  agricultureBoost: ['둔전제', '권농책', '수리진흥', '전답개간'],
  husbandryBoost: ['목축진흥', '마정관리', '축산장려'],
  commerceBoost: ['왕좌지재', '화친책', '통상진흥', '재정관리', '식화지재'],
  industryBoost: ['치국지략', '병기개량', '공방혁신', '기술진흥'],
};

const COMBAT_SKILL_NAMES: Partial<Record<SkillEffectType, string[]>> = {
  cavalryMarchSpeedBoost: ['병귀신속', '서량철기', '경기돌격'],
  combatPowerBoost: ['무신위엄', '만부부당', '일기당천', '비장군', '신궁', '화공', '용맹과인', '백전노장', '선봉장'],
  moraleBoost: ['백기병', '호위대장', '사기진작', '군심결집'],
};

const DOMESTIC_EFFECT_TYPES = Object.keys(DOMESTIC_SKILL_NAMES) as SkillEffectType[];
const COMBAT_EFFECT_TYPES = Object.keys(COMBAT_SKILL_NAMES) as SkillEffectType[];

function makeRoster(role: GeneralRole, entries: [rosterId: string, name: string][]): RosterEntry[] {
  const effectTypes = role === 'domestic' ? DOMESTIC_EFFECT_TYPES : COMBAT_EFFECT_TYPES;
  const skillNames = role === 'domestic' ? DOMESTIC_SKILL_NAMES : COMBAT_SKILL_NAMES;

  return entries.map(([rosterId, name], index) => {
    const effectType = effectTypes[index % effectTypes.length];
    const namePool = skillNames[effectType]!;
    const skillName = namePool[index % namePool.length];
    const magnitude = Math.round((0.15 + (index % 4) * 0.05) * 100) / 100;
    const triggerChance = Math.round((0.25 + (index % 3) * 0.05) * 100) / 100;

    return {
      rosterId,
      name,
      role,
      skill: { name: skillName, effectType, magnitude, triggerChance },
      portraitSeed: rosterId,
    };
  });
}

// [rosterId, display name] -- rosterId stays a stable slug even if a
// historical figure's display name is later re-romanized or edited.
const DOMESTIC_ENTRIES: [string, string][] = [
  ['mao-jie', '모개'],
  ['xun-yu', '순욱'],
  ['zhuge-liang', '제갈량'],
  ['lu-su', '노숙'],
  ['dong-zhao', '동소'],
  ['liu-ye', '유엽'],
  ['jia-xu', '가후'],
  ['xun-you', '순유'],
  ['guo-jia', '곽가'],
  ['cheng-yu', '정욱'],
  ['man-chong', '만총'],
  ['sima-yi', '사마의'],
  ['wang-lang', '왕랑'],
  ['hua-xin', '화흠'],
  ['chen-qun', '진군'],
  ['zhong-yao', '종요'],
  ['pang-tong', '방통'],
  ['ma-liang', '마량'],
  ['yi-ji', '이적'],
  ['jian-yong', '간옹'],
  ['sun-qian', '손건'],
  ['mi-zhu', '미축'],
  ['zhang-zhao', '장소'],
  ['gu-yong', '고옹'],
  ['yu-fan', '우번'],
  ['lu-kai', '육개'],
  ['bu-zhi', '보즐'],
  ['zhuge-jin', '제갈근'],
  ['lu-fan', '여범'],
  ['kan-ze', '감택'],
  ['xue-zong', '설종'],
  ['tian-feng', '전풍'],
  ['ju-shou', '저수'],
  ['shen-pei', '심배'],
  ['feng-ji', '봉기'],
  ['guo-tu', '곽도'],
  ['lu-zhi', '노식'],
  ['cai-yong', '채옹'],
  ['yang-biao', '양표'],
  ['kong-rong', '공융'],
  ['chen-gong', '진궁'],
  ['xin-pi', '신비'],
  ['guan-ning', '관녕'],
  ['zhang-song', '장송'],
  ['fa-zheng', '법정'],
  ['huang-quan', '황권'],
  ['qiao-zhou', '초주'],
  ['dong-yun', '동윤'],
  ['jiang-wan', '장완'],
  ['fei-yi', '비의'],
];

const COMBAT_ENTRIES: [string, string][] = [
  ['xiahou-yuan', '하후연'],
  ['guan-yu', '관우'],
  ['zhang-fei', '장비'],
  ['zhao-yun', '조운'],
  ['lu-bu', '여포'],
  ['gan-ning', '감녕'],
  ['taishi-ci', '태사자'],
  ['lu-xun', '육손'],
  ['ma-chao', '마초'],
  ['dian-wei', '전위'],
  ['xiahou-dun', '하후돈'],
  ['cao-ren', '조인'],
  ['cao-hong', '조홍'],
  ['zhang-liao', '장료'],
  ['xu-huang', '서황'],
  ['yue-jin', '악진'],
  ['yu-jin', '우금'],
  ['wen-pin', '문빙'],
  ['pang-de', '방덕'],
  ['cao-zhang', '조창'],
  ['huang-zhong', '황충'],
  ['wei-yan', '위연'],
  ['ma-dai', '마대'],
  ['guan-ping', '관평'],
  ['guan-xing', '관흥'],
  ['zhang-bao', '장포'],
  ['wang-ping', '왕평'],
  ['jiang-wei', '강유'],
  ['sun-ce', '손책'],
  ['zhou-yu', '주유'],
  ['cheng-pu', '정보'],
  ['huang-gai', '황개'],
  ['han-dang', '한당'],
  ['zhou-tai', '주태'],
  ['xu-sheng', '서성'],
  ['ding-feng', '정봉'],
  ['ling-tong', '능통'],
  ['pan-zhang', '반장'],
  ['lu-meng', '여몽'],
  ['sun-quan', '손권'],
  ['yan-liang', '안량'],
  ['wen-chou', '문추'],
  ['gao-lan', '고람'],
  ['zhang-he', '장합'],
  ['lu-qian', '여건'],
  ['li-dian', '이전'],
  ['xu-chu', '허저'],
  ['hua-xiong', '화웅'],
  ['ji-ling', '기령'],
  ['lei-bo', '뇌박'],
  ['wang-zhong', '왕충'],
];

export const GENERAL_ROSTER: readonly RosterEntry[] = [...makeRoster('domestic', DOMESTIC_ENTRIES), ...makeRoster('combat', COMBAT_ENTRIES)];
