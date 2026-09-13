import type { EffectDefinition } from '../types/effects.js';

// Matches the spec's explicit disaster list (메뚜기/지진/가뭄/홍수) and its
// worked event example (실크로드 교역 -> 말 생산 증가). One primary domain per
// definition keeps the effect easy to read in the turn log; magnitudes are
// additive bonuses combined with any other active effect on the same domain
// (see computeEffectMultipliers), not standalone multipliers.
export const DISASTER_DEFINITIONS: readonly EffectDefinition[] = [
  {
    id: 'locusts',
    kind: 'disaster',
    name: '메뚜기 떼',
    description: '메뚜기 떼가 몰려와 농작물을 갉아먹었습니다. 농업 생산이 감소합니다.',
    domain: 'agriculture',
    magnitude: -0.5,
    durationTurns: 3,
  },
  {
    id: 'earthquake',
    kind: 'disaster',
    name: '지진',
    description: '지진으로 공방과 창고 시설이 파손되었습니다. 공업 생산이 감소합니다.',
    domain: 'industry',
    magnitude: -0.4,
    durationTurns: 3,
  },
  {
    id: 'drought',
    kind: 'disaster',
    name: '가뭄',
    description: '극심한 가뭄으로 목초지가 메말라 가축이 쇠약해졌습니다. 목축업 생산이 감소합니다.',
    domain: 'animalHusbandry',
    magnitude: -0.4,
    durationTurns: 3,
  },
  {
    id: 'flood',
    kind: 'disaster',
    name: '홍수',
    description: '홍수로 교역로와 시장이 침수되었습니다. 상업 생산이 감소합니다.',
    domain: 'commerce',
    magnitude: -0.4,
    durationTurns: 3,
  },
];

export const EVENT_DEFINITIONS: readonly EffectDefinition[] = [
  {
    id: 'silkRoadTrade',
    kind: 'event',
    name: '실크로드 교역',
    description: '실크로드 교역으로 적토마를 구입했습니다. 목축업 생산이 증가합니다.',
    domain: 'animalHusbandry',
    magnitude: 0.3,
    durationTurns: 3,
  },
  {
    id: 'goodHarvest',
    kind: 'event',
    name: '풍년',
    description: '때 이른 풍년이 찾아왔습니다. 농업 생산이 증가합니다.',
    domain: 'agriculture',
    magnitude: 0.3,
    durationTurns: 3,
  },
  {
    id: 'wanderingArtisans',
    kind: 'event',
    name: '유랑 장인',
    description: '유랑하던 장인들이 정착하여 기술을 전수했습니다. 공업 생산이 증가합니다.',
    domain: 'industry',
    magnitude: 0.3,
    durationTurns: 3,
  },
  {
    id: 'merchantCaravan',
    kind: 'event',
    name: '대상단 방문',
    description: '큰 상단이 방문하여 교역이 활발해졌습니다. 상업 생산이 증가합니다.',
    domain: 'commerce',
    magnitude: 0.3,
    durationTurns: 3,
  },
];
