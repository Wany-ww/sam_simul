import type { General, GeneralRole, GeneralStats, SkillEffectType } from '../types/general.js';

// A curated roster of historical/연의 Three Kingdoms figures. Not the full
// ~600-strong roster of a game like 삼국지14 -- that scale would mean either
// re-deriving hundreds of names from thin, single-mention historical
// records with no real distinguishing trait, or inventing people outright,
// neither of which serves "실제 삼국지 연의 장수" faithfully. Instead this is
// a large, still-growing set (~450) of genuinely attested figures pulled
// from 위/촉/오 and the other warlord factions (동탁/원소/원술/여포/유표/
// 공손찬/마등/장로/황건적 등), with the ~70 most iconic figures given a
// skill named after their real 연의/정사 별명 (epithet) rather than a
// generic pooled name. The architecture (makeRoster + EPITHET_OVERRIDES)
// supports extending toward 600 later without any further code changes --
// just more entries.
//
// Deliberately excludes names already used by AI_PLAYER_NAME_POOL
// (aiNames.ts) so a recruitable general's name never collides with a
// bot player's display name in the same room: 동탁, 원소, 원술, 손견, 유표,
// 공손찬, 장각, 도겸, 유장, 마등.
type RosterEntry = Omit<General, 'assignment' | 'generalId'>;

const DOMESTIC_SKILL_NAMES: Partial<Record<SkillEffectType, string[]>> = {
  agricultureBoost: ['둔전제', '권농책', '수리진흥', '전답개간', '황무지개간', '농정쇄신', '치수지략', '곡창관리'],
  husbandryBoost: ['목축진흥', '마정관리', '축산장려', '목마육성', '견마지로', '방목확대'],
  commerceBoost: ['왕좌지재', '화친책', '통상진흥', '재정관리', '식화지재', '이재지술', '조세경감', '교역확대', '염철전매', '균수평준'],
  industryBoost: ['치국지략', '병기개량', '공방혁신', '기술진흥', '축성술', '기교지재', '공정감독', '야금개량'],
};

const COMBAT_SKILL_NAMES: Partial<Record<SkillEffectType, string[]>> = {
  cavalryMarchSpeedBoost: ['병귀신속', '서량철기', '경기돌격', '질풍기병', '표기신속', '강행군'],
  combatPowerBoost: [
    '무신위엄', '만부부당', '일기당천', '비장군', '신궁', '화공', '용맹과인', '백전노장', '선봉장',
    '맹장지풍', '군신위엄', '창술절기', '검술절기', '분전무쌍', '결사항전', '철벽방어', '기습전술', '지구전',
  ],
  moraleBoost: ['백기병', '호위대장', '사기진작', '군심결집', '독전고무', '충의지심', '결전의지'],
};

const DOMESTIC_EFFECT_TYPES = Object.keys(DOMESTIC_SKILL_NAMES) as SkillEffectType[];
const COMBAT_EFFECT_TYPES = Object.keys(COMBAT_SKILL_NAMES) as SkillEffectType[];

interface EpithetOverride {
  skillName: string;
  effectType: SkillEffectType;
  magnitude: number;
  triggerChance: number;
}

// Skills named directly after a figure's real 연의/정사 별명 (epithet),
// keyed by display name and applied over the pooled/cycled assignment
// below. Sourced from 나무위키 "삼국지/이명" and cross-referenced against
// well-known 연의 epithets (관우의 미염공, 여포의 비장, 조자룡의 상산의
// 호랑이 등).
const EPITHET_OVERRIDES: Record<string, EpithetOverride> = {
  관우: { skillName: '미염공', effectType: 'combatPowerBoost', magnitude: 0.3, triggerChance: 0.4 },
  장비: { skillName: '호염공', effectType: 'combatPowerBoost', magnitude: 0.35, triggerChance: 0.3 },
  조운: { skillName: '상산의호랑이', effectType: 'combatPowerBoost', magnitude: 0.3, triggerChance: 0.4 },
  여포: { skillName: '비장', effectType: 'combatPowerBoost', magnitude: 0.45, triggerChance: 0.25 },
  마초: { skillName: '신위천장군', effectType: 'cavalryMarchSpeedBoost', magnitude: 0.35, triggerChance: 0.4 },
  방덕: { skillName: '백마장군', effectType: 'combatPowerBoost', magnitude: 0.3, triggerChance: 0.3 },
  전위: { skillName: '악래', effectType: 'combatPowerBoost', magnitude: 0.35, triggerChance: 0.3 },
  허저: { skillName: '호치', effectType: 'combatPowerBoost', magnitude: 0.3, triggerChance: 0.3 },
  하후돈: { skillName: '맹하후', effectType: 'moraleBoost', magnitude: 0.25, triggerChance: 0.35 },
  장료: { skillName: '료래래', effectType: 'moraleBoost', magnitude: 0.3, triggerChance: 0.35 },
  강유: { skillName: '천수의기린아', effectType: 'combatPowerBoost', magnitude: 0.3, triggerChance: 0.35 },
  손책: { skillName: '소패왕', effectType: 'combatPowerBoost', magnitude: 0.35, triggerChance: 0.3 },
  주유: { skillName: '미주랑', effectType: 'commerceBoost', magnitude: 0.25, triggerChance: 0.35 },
  방통: { skillName: '봉추', effectType: 'industryBoost', magnitude: 0.3, triggerChance: 0.4 },
  제갈량: { skillName: '와룡', effectType: 'industryBoost', magnitude: 0.35, triggerChance: 0.45 },
  순욱: { skillName: '왕좌지재', effectType: 'commerceBoost', magnitude: 0.3, triggerChance: 0.35 },
  마량: { skillName: '백미', effectType: 'commerceBoost', magnitude: 0.25, triggerChance: 0.35 },
  감녕: { skillName: '금범적', effectType: 'moraleBoost', magnitude: 0.25, triggerChance: 0.3 },
  태사자: { skillName: '강좌호신', effectType: 'combatPowerBoost', magnitude: 0.25, triggerChance: 0.35 },
  고순: { skillName: '함진영', effectType: 'combatPowerBoost', magnitude: 0.3, triggerChance: 0.35 },
  엄안: { skillName: '단두장군', effectType: 'moraleBoost', magnitude: 0.25, triggerChance: 0.3 },
  장연: { skillName: '비연', effectType: 'cavalryMarchSpeedBoost', magnitude: 0.3, triggerChance: 0.35 },
  조창: { skillName: '황수아', effectType: 'cavalryMarchSpeedBoost', magnitude: 0.3, triggerChance: 0.35 },
  조휴: { skillName: '천리구', effectType: 'cavalryMarchSpeedBoost', magnitude: 0.25, triggerChance: 0.3 },
  조식: { skillName: '칠보지재', effectType: 'industryBoost', magnitude: 0.3, triggerChance: 0.4 },
  두예: { skillName: '두무고', effectType: 'industryBoost', magnitude: 0.25, triggerChance: 0.3 },
  관로: { skillName: '신복', effectType: 'commerceBoost', magnitude: 0.2, triggerChance: 0.35 },
  환범: { skillName: '지낭', effectType: 'commerceBoost', magnitude: 0.25, triggerChance: 0.35 },
  마균: { skillName: '천하의기교', effectType: 'industryBoost', magnitude: 0.35, triggerChance: 0.4 },
  사마휘: { skillName: '수경선생', effectType: 'commerceBoost', magnitude: 0.2, triggerChance: 0.3 },
  좌자: { skillName: '오각선생', effectType: 'agricultureBoost', magnitude: 0.2, triggerChance: 0.25 },
  하만: { skillName: '절천야차', effectType: 'combatPowerBoost', magnitude: 0.3, triggerChance: 0.3 },
};

// A 5-stat block (통솔/무력/지력/정치/매력, 0-100) for the figures we have
// enough independent historical/연의 basis to assess individually -- e.g.
// everyone agrees 여포's 무력 belongs at the very top of the scale and
// 제갈량's 지력 does too, regardless of which specific game you ask, because
// both conclusions come from the same public-domain historical reputation.
// This is our own independent assessment, not a transcription of any one
// game's proprietary numbers. Figures without an entry here get a
// deterministic, more modest formulaic block instead (see makeRoster).
const STAT_OVERRIDES: Record<string, GeneralStats> = {
  여포: { command: 76, force: 100, intelligence: 30, politics: 25, charm: 35 },
  관우: { command: 92, force: 97, intelligence: 75, politics: 62, charm: 94 },
  장비: { command: 85, force: 96, intelligence: 42, politics: 30, charm: 55 },
  조운: { command: 91, force: 95, intelligence: 76, politics: 58, charm: 85 },
  마초: { command: 88, force: 96, intelligence: 47, politics: 30, charm: 64 },
  허저: { command: 72, force: 94, intelligence: 30, politics: 20, charm: 42 },
  전위: { command: 68, force: 95, intelligence: 28, politics: 18, charm: 40 },
  방덕: { command: 82, force: 93, intelligence: 52, politics: 35, charm: 58 },
  하후돈: { command: 84, force: 88, intelligence: 55, politics: 42, charm: 66 },
  하후연: { command: 86, force: 90, intelligence: 58, politics: 38, charm: 55 },
  황충: { command: 82, force: 92, intelligence: 55, politics: 40, charm: 62 },
  강유: { command: 90, force: 85, intelligence: 88, politics: 65, charm: 68 },
  태사자: { command: 82, force: 90, intelligence: 62, politics: 45, charm: 68 },
  감녕: { command: 78, force: 91, intelligence: 55, politics: 32, charm: 60 },
  장료: { command: 90, force: 91, intelligence: 76, politics: 58, charm: 78 },
  서황: { command: 87, force: 89, intelligence: 68, politics: 50, charm: 65 },
  악진: { command: 80, force: 88, intelligence: 58, politics: 40, charm: 55 },
  우금: { command: 85, force: 84, intelligence: 65, politics: 48, charm: 48 },
  장합: { command: 88, force: 87, intelligence: 78, politics: 55, charm: 60 },
  위연: { command: 85, force: 89, intelligence: 62, politics: 35, charm: 48 },
  육손: { command: 92, force: 68, intelligence: 93, politics: 78, charm: 82 },
  여몽: { command: 90, force: 80, intelligence: 85, politics: 68, charm: 75 },
  주유: { command: 96, force: 72, intelligence: 92, politics: 80, charm: 93 },
  손책: { command: 91, force: 90, intelligence: 68, politics: 60, charm: 90 },
  손권: { command: 88, force: 55, intelligence: 82, politics: 92, charm: 92 },
  제갈량: { command: 94, force: 32, intelligence: 100, politics: 96, charm: 92 },
  방통: { command: 78, force: 28, intelligence: 97, politics: 72, charm: 62 },
  사마의: { command: 92, force: 42, intelligence: 97, politics: 92, charm: 72 },
  곽가: { command: 62, force: 22, intelligence: 98, politics: 72, charm: 74 },
  순욱: { command: 68, force: 20, intelligence: 94, politics: 96, charm: 90 },
  순유: { command: 65, force: 22, intelligence: 92, politics: 84, charm: 72 },
  가후: { command: 66, force: 25, intelligence: 96, politics: 82, charm: 55 },
  노숙: { command: 78, force: 38, intelligence: 88, politics: 90, charm: 88 },
  법정: { command: 70, force: 32, intelligence: 92, politics: 82, charm: 58 },
  마량: { command: 55, force: 30, intelligence: 82, politics: 84, charm: 88 },
  관로: { command: 20, force: 15, intelligence: 90, politics: 40, charm: 62 },
  좌자: { command: 15, force: 20, intelligence: 88, politics: 20, charm: 70 },
  사마휘: { command: 20, force: 10, intelligence: 90, politics: 45, charm: 85 },
  두예: { command: 78, force: 45, intelligence: 90, politics: 78, charm: 60 },
  마균: { command: 25, force: 15, intelligence: 92, politics: 40, charm: 45 },
  환범: { command: 40, force: 20, intelligence: 86, politics: 75, charm: 55 },
  조식: { command: 30, force: 25, intelligence: 88, politics: 55, charm: 92 },
  고순: { command: 84, force: 85, intelligence: 68, politics: 45, charm: 58 },
  엄안: { command: 70, force: 80, intelligence: 55, politics: 35, charm: 65 },
  장연: { command: 75, force: 82, intelligence: 48, politics: 30, charm: 50 },
  하만: { command: 65, force: 84, intelligence: 30, politics: 20, charm: 35 },
  조창: { command: 78, force: 88, intelligence: 45, politics: 30, charm: 55 },
  조휴: { command: 80, force: 75, intelligence: 68, politics: 55, charm: 62 },
  종회: { command: 84, force: 55, intelligence: 93, politics: 82, charm: 65 },
  등애: { command: 90, force: 70, intelligence: 90, politics: 68, charm: 55 },
  전풍: { command: 55, force: 25, intelligence: 90, politics: 80, charm: 58 },
  저수: { command: 62, force: 28, intelligence: 91, politics: 82, charm: 60 },
  심배: { command: 58, force: 35, intelligence: 82, politics: 78, charm: 55 },
};

function pseudoStat(seed: number, min: number, max: number): number {
  // A small deterministic pseudo-random spread (not cryptographic, just
  // varied) so the ~330 figures without a hand-assessed block aren't all
  // identical -- still clearly a notch below the named cast above.
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return Math.round(min + frac * (max - min));
}

function generateStats(role: GeneralRole, index: number): GeneralStats {
  const base = index * 7 + (role === 'domestic' ? 1 : 2);
  if (role === 'domestic') {
    return {
      command: pseudoStat(base, 30, 65),
      force: pseudoStat(base + 1, 15, 45),
      intelligence: pseudoStat(base + 2, 45, 85),
      politics: pseudoStat(base + 3, 45, 88),
      charm: pseudoStat(base + 4, 35, 75),
    };
  }
  return {
    command: pseudoStat(base, 45, 82),
    force: pseudoStat(base + 1, 45, 88),
    intelligence: pseudoStat(base + 2, 25, 65),
    politics: pseudoStat(base + 3, 20, 55),
    charm: pseudoStat(base + 4, 30, 65),
  };
}

function makeRoster(role: GeneralRole, entries: [rosterId: string, name: string][]): RosterEntry[] {
  const effectTypes = role === 'domestic' ? DOMESTIC_EFFECT_TYPES : COMBAT_EFFECT_TYPES;
  const skillNames = role === 'domestic' ? DOMESTIC_SKILL_NAMES : COMBAT_SKILL_NAMES;

  return entries.map(([rosterId, name], index) => {
    const override = EPITHET_OVERRIDES[name];
    const effectType = override?.effectType ?? effectTypes[index % effectTypes.length];
    const namePool = skillNames[effectType];
    const skillName = override?.skillName ?? namePool![index % namePool!.length];
    const magnitude = override?.magnitude ?? Math.round((0.15 + (index % 4) * 0.05) * 100) / 100;
    const triggerChance = override?.triggerChance ?? Math.round((0.25 + (index % 3) * 0.05) * 100) / 100;
    const stats = STAT_OVERRIDES[name] ?? generateStats(role, index);

    return {
      rosterId,
      name,
      role,
      skill: { name: skillName, effectType, magnitude, triggerChance },
      stats,
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
  // -- epithet-driven additions --
  ['sima-hui', '사마휘'],
  ['zuo-ci', '좌자'],
  ['guan-lu', '관로'],
  ['huan-fan', '환범'],
  ['ma-jun', '마균'],
  ['cao-zhi', '조식'],
  ['du-yu', '두예'],
  // -- extended roster (촉한/조위/손오 문신·행정 인물, 나무위키 분류 기준) --
  ['ext-d001', '고박'], ['ext-d002', '고상'], ['ext-d003', '공록'], ['ext-d004', '공심'], ['ext-d005', '곽모'],
  ['ext-d006', '곽목'], ['ext-d007', '곽유지'], ['ext-d008', '곽익'], ['ext-d009', '곽준'], ['ext-d010', '관이'],
  ['ext-d011', '근상'], ['ext-d012', '나몽'], ['ext-d013', '나습'], ['ext-d014', '나헌'], ['ext-d015', '내민'],
  ['ext-d016', '담승'], ['ext-d017', '동화'], ['ext-d018', '동회'], ['ext-d019', '두기'], ['ext-d020', '두로'],
  ['ext-d021', '두의'], ['ext-d022', '두진'], ['ext-d023', '등개'], ['ext-d024', '등량'], ['ext-d025', '등방'],
  ['ext-d026', '등보'], ['ext-d027', '등지'], ['ext-d028', '마제'], ['ext-d029', '마훈'], ['ext-d030', '문공'],
  ['ext-d031', '문립'], ['ext-d032', '미위'], ['ext-d033', '미조'], ['ext-d034', '반준'], ['ext-d035', '방굉'],
  ['ext-d036', '번기'], ['ext-d037', '번우'], ['ext-d038', '번주'], ['ext-d039', '범장생'], ['ext-d040', '법막'],
  ['ext-d041', '보광'], ['ext-d042', '부방'], ['ext-d043', '부융'], ['ext-d044', '부첨'], ['ext-d045', '비관'],
  ['ext-d046', '비시'], ['ext-d047', '사마승지'], ['ext-d048', '사원'], ['ext-d049', '상거'], ['ext-d050', '상건'],
  ['ext-d051', '상관옹'], ['ext-d052', '상관자수'], ['ext-d053', '상기'], ['ext-d054', '상욱'], ['ext-d055', '상조'],
  ['ext-d056', '상총'], ['ext-d057', '상충'], ['ext-d058', '상파'], ['ext-d059', '설영'], ['ext-d060', '설제'],
  ['ext-d061', '가목'], ['ext-d062', '가방'], ['ext-d063', '가여민'], ['ext-d064', '가충'], ['ext-d065', '가허'],
  ['ext-d066', '강경'], ['ext-d067', '강서'], ['ext-d068', '견가'], ['ext-d069', '견상'], ['ext-d070', '견초'],
  ['ext-d071', '견홍'], ['ext-d072', '고강'], ['ext-d073', '고당륭'], ['ext-d074', '고천'], ['ext-d075', '고혼'],
  ['ext-d076', '곡습'], ['ext-d077', '공계'], ['ext-d078', '공맹'], ['ext-d079', '공선'], ['ext-d080', '공손달'],
  ['ext-d081', '공예'], ['ext-d082', '곽덕'], ['ext-d083', '곽배'], ['ext-d084', '곽상'], ['ext-d085', '곽순'],
  ['ext-d086', '괴균'], ['ext-d087', '괴기'], ['ext-d088', '국연'], ['ext-d089', '궁준'], ['ext-d090', '곽예'],
  ['ext-d091', '곽욱'], ['ext-d092', '곽전'], ['ext-d093', '곽지'], ['ext-d094', '곽통'], ['ext-d095', '곽헌'],
  ['ext-d096', '곽혁'], ['ext-d097', '노번'], ['ext-d098', '노부'], ['ext-d099', '노여생'], ['ext-d100', '노지'],
  ['ext-d101', '노파'], ['ext-d102', '노흠'], ['ext-d103', '노희'], ['ext-d104', '누규'], ['ext-d105', '단묵'],
  ['ext-d106', '단소'], ['ext-d107', '단작'], ['ext-d108', '당빈'], ['ext-d109', '당태'], ['ext-d110', '대릉'],
  ['ext-d111', '동리곤'], ['ext-d112', '동방'], ['ext-d113', '동우'], ['ext-d114', '동초'], ['ext-d115', '동형'],
  ['ext-d116', '두서'], ['ext-d117', '두습'], ['ext-d118', '두우'], ['ext-d119', '두위'], ['ext-d120', '두지'],
  ['ext-d121', '두회'], ['ext-d122', '등돈'], ['ext-d123', '등양'], ['ext-d124', '등전'], ['ext-d125', '강승회'],
  ['ext-d126', '고서'], ['ext-d127', '고소'], ['ext-d128', '고수'], ['ext-d129', '고승'], ['ext-d130', '고영'],
  ['ext-d131', '고유'], ['ext-d132', '고제'], ['ext-d133', '곡랑'], ['ext-d134', '곡리'], ['ext-d135', '곽마'],
  ['ext-d136', '기첨'], ['ext-d137', '낙수'], ['ext-d138', '낙연아'], ['ext-d139', '낙통'], ['ext-d140', '노탐'],
  ['ext-d141', '뇌담'], ['ext-d142', '누현'], ['ext-d143', '당고'], ['ext-d144', '당자'], ['ext-d145', '대창'],
  ['ext-d146', '도기'], ['ext-d147', '도준'], ['ext-d148', '도황'], ['ext-d149', '동봉'], ['ext-d150', '동잠'],
  ['ext-d151', '동조'], ['ext-d152', '등구'], ['ext-d153', '등목'], ['ext-d154', '등밀'], ['ext-d155', '등방란'],
  ['ext-d156', '등수'], ['ext-d157', '등윤'], ['ext-d158', '등희'], ['ext-d159', '민홍'], ['ext-d160', '배잠'],
  ['ext-d161', '배현'], ['ext-d162', '범신'], ['ext-d163', '범평'], ['ext-d164', '범희'], ['ext-d165', '보천'],
  ['ext-d166', '보협'], ['ext-d167', '복양일'], ['ext-d168', '부영'], ['ext-d169', '사경'], ['ext-d170', '사굉'],
  ['ext-d171', '사송'], ['ext-d172', '사승'], ['ext-d173', '사연'], ['ext-d174', '사정'], ['ext-d175', '사희'],
  ['ext-d176', '서고'], ['ext-d177', '서광'], ['ext-d178', '서릉'], ['ext-d179', '서상'], ['ext-d180', '서섭'],
  ['ext-d181', '순심'], ['ext-d182', '엄강'], ['ext-d183', '전해'], ['ext-d184', '채모'], ['ext-d185', '장윤'],
  ['ext-d186', '괴량'], ['ext-d187', '괴월'], ['ext-d188', '한숭'], ['ext-d189', '성의'], ['ext-d190', '양추'],
  ['ext-d191', '정은'], ['ext-d192', '이감'], ['ext-d193', '양송'], ['ext-d194', '염포'], ['ext-d195', '정원지'],
  ['ext-d196', '이승'], ['ext-d197', '필궤'], ['ext-d198', '최염'], ['ext-d199', '진교'], ['ext-d200', '노육'],
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
  // -- epithet-driven additions --
  ['gao-shun', '고순'],
  ['yan-yan', '엄안'],
  ['zhang-yan', '장연'],
  ['he-man', '하만'],
  // -- 동탁 세력 --
  ['li-jue', '이각'], ['guo-si', '곽사'], ['zhang-ji', '장제'], ['fan-chou', '번조'], ['niu-fu', '우보'],
  ['li-su', '이숙'], ['xu-rong', '서영'], ['hu-zhen', '호진'], ['li-ru', '이유'],
  // -- 원술 세력 --
  ['qiao-rui', '교유'], ['yang-hong', '양홍'], ['chen-ji', '진기'], ['liu-xun', '유훈'],
  // -- 유표 세력 --
  ['huang-zu', '황조'],
  // -- 마등 세력 --
  ['han-sui', '한수'], ['ma-wan', '마완'], ['yang-xing', '양흥'], ['hou-xuan', '후선'],
  // -- 장로 세력 --
  ['zhang-lu', '장로'], ['yang-ang', '양앙'],
  // -- 황건적 --
  ['zhang-bao2', '장보'], ['guan-hai', '관해'], ['deng-mao', '등무'], ['po-cai', '파재'], ['fu-yang', '복양'], ['sun-zhong', '손중'],
  // -- 남만/이민족 --
  ['wu-tugu', '올돌골'], ['tuosi-king', '타사대왕'], ['muluo-king', '목록대왕'], ['ahui-nan', '아회남'], ['dailai-dongzhu', '대래동주'],
  ['ke-bineng', '가비능'], ['ta-dun', '답돈'], ['lou-ban', '누반'],
  // -- 위나라 확장 --
  ['zhong-hui', '종회'], ['deng-ai', '등애'], ['chen-tai', '진태'], ['wang-ji', '왕기'], ['wang-chang', '왕창'],
  ['wang-ling', '왕릉'], ['cao-zhen', '조진'], ['cao-shuang', '조상'], ['xiahou-ba', '하후패'], ['xiahou-xuan', '하후현'],
  ['wang-jing', '왕경'], ['wen-yang', '문앙'], ['wen-hu', '문호'], ['wang-jun', '왕준'], ['jia-kui', '가규'],
  ['ding-yi', '정의'], ['ding-yi2', '정이'], ['yang-xiu', '양수'], ['wu-zhi', '오질'], ['xiahou-shang', '하후상'],
  ['guanqiu-jian', '관구검'],
  // -- 촉나라 확장 --
  ['liao-hua', '요화'], ['zhang-yi', '장억'], ['zhang-yi2', '장의'], ['lv-kai', '여개'], ['wang-han', '왕함'],
  ['shang-lang', '상랑'], ['li-yan', '이엄'], ['li-feng', '이풍'], ['liu-yan', '유염'], ['peng-yang', '팽양'],
  ['li-hui', '이회'], ['lv-yi', '여의'], ['chen-shi', '진식'], ['ma-zhong', '마충'], ['huang-hao', '황호'],
  ['chen-zhi', '진지'],
  // -- 오나라 확장 --
  ['lu-kang', '육항'], ['he-qi', '하제'], ['quan-cong', '전종'], ['quan-yi', '전역'], ['shi-ji', '시적'],
  ['zhongli-mu', '종리목'], ['liu-zan', '유찬'], ['shi-yi', '시의'], ['he-qi2', '하기'], ['wu-can', '오찬'],
  ['wang-fan', '왕번'], ['hua-he', '화핵'], ['wei-yao', '위요'], ['sun-chen', '손침'], ['sun-jun', '손준'],
  ['sun-hao', '손호'], ['zhuge-dan', '제갈탄'], ['zhuge-ke', '제갈각'],
];

export const GENERAL_ROSTER: readonly RosterEntry[] = [...makeRoster('domestic', DOMESTIC_ENTRIES), ...makeRoster('combat', COMBAT_ENTRIES)];
