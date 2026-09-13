import type { MapEdge, MapNode, MapNodeId, Region, RegionId } from '../types/map.js';

// A fixed, hand-authored map covering all 13 Later Han provinces at
// commandery (군) granularity, per the 후한서 군국지 reference map. Room
// settings (mapSize) scale travel time via MAP_SIZE_TRAVEL_DAY_MULTIPLIER;
// they never add or remove nodes.
//
// x/y are a schematic layout for the client map view (roughly matching the
// reference map's relative north/south/east/west arrangement so edge
// lengths and province clusters look sensible) -- not a geographic
// projection or traced coastline.
//
// The 9 starting cities (isStartingCity: true) and 5 original battlefield
// junctions (hulaoGuan/guanzhong/wancheng/yangtzeCrossing/jianGe) keep their
// original nodeIds and several load-bearing edges unchanged (see
// map.test.ts / movement.test.ts / GameEngine.test.ts) -- everything else
// here is new.
export const REGIONS: Record<RegionId, Region> = {
  siLi: { regionId: 'siLi', name: '사례', horseProductionMultiplier: 1 },
  yuzhou: { regionId: 'yuzhou', name: '예주', horseProductionMultiplier: 1 },
  yanzhou: { regionId: 'yanzhou', name: '연주', horseProductionMultiplier: 1 },
  qingzhou: { regionId: 'qingzhou', name: '청주', horseProductionMultiplier: 1 },
  xuzhou: { regionId: 'xuzhou', name: '서주', horseProductionMultiplier: 1 },
  yangzhou: { regionId: 'yangzhou', name: '양주', horseProductionMultiplier: 0.8 },
  jingzhou: { regionId: 'jingzhou', name: '형주', horseProductionMultiplier: 1 },
  yizhou: { regionId: 'yizhou', name: '익주', horseProductionMultiplier: 1 },
  // 장안(경조윤)은 실제로는 사례 소속이지만, 서량 기병 특화라는 기존 흐름(마초·서량철기 등)을
  // 유지하기 위해 게임상 량주 소속으로 둔다 -- 역사적 정확성보다 기존 밸런스/플레이버 연속성을 우선.
  liangzhou: { regionId: 'liangzhou', name: '량주', horseProductionMultiplier: 1.5 },
  bingzhou: { regionId: 'bingzhou', name: '병주', horseProductionMultiplier: 1.5 },
  jizhou: { regionId: 'jizhou', name: '기주', horseProductionMultiplier: 1 },
  youzhou: { regionId: 'youzhou', name: '유주', horseProductionMultiplier: 1.1 },
  jiaozhou: { regionId: 'jiaozhou', name: '교주', horseProductionMultiplier: 0.8 },
};

export const MAP_NODES: MapNode[] = [
  // -- 사례 (siLi) --
  { nodeId: 'luoyang', name: '낙양', type: 'city', region: 'siLi', isStartingCity: true, x: 420, y: 300 },
  { nodeId: 'hongnong', name: '홍농', type: 'battlefield', region: 'siLi', isStartingCity: false, x: 360, y: 280 },
  { nodeId: 'hedong', name: '하동', type: 'battlefield', region: 'siLi', isStartingCity: false, x: 400, y: 220 },
  { nodeId: 'henei', name: '하내', type: 'battlefield', region: 'siLi', isStartingCity: false, x: 460, y: 240 },
  { nodeId: 'zuopingyi', name: '좌풍익', type: 'battlefield', region: 'siLi', isStartingCity: false, x: 340, y: 320 },
  { nodeId: 'youfuling', name: '우부풍', type: 'battlefield', region: 'siLi', isStartingCity: false, x: 300, y: 300 },
  { nodeId: 'hulaoGuan', name: '호로관', type: 'battlefield', region: 'siLi', isStartingCity: false, x: 480, y: 280 },

  // -- 량주 (liangzhou) --
  { nodeId: 'changan', name: '장안', type: 'city', region: 'liangzhou', isStartingCity: true, x: 260, y: 270 },
  { nodeId: 'guanzhong', name: '관중', type: 'battlefield', region: 'liangzhou', isStartingCity: false, x: 330, y: 250 },
  { nodeId: 'juyanshuguo', name: '거연속국', type: 'battlefield', region: 'liangzhou', isStartingCity: false, x: 110, y: 60 },
  { nodeId: 'dunhuang', name: '돈황', type: 'battlefield', region: 'liangzhou', isStartingCity: false, x: 30, y: 150 },
  { nodeId: 'jiuquan', name: '주천', type: 'battlefield', region: 'liangzhou', isStartingCity: false, x: 100, y: 170 },
  { nodeId: 'zhangye', name: '장액', type: 'battlefield', region: 'liangzhou', isStartingCity: false, x: 160, y: 200 },
  { nodeId: 'wuwei', name: '무위', type: 'battlefield', region: 'liangzhou', isStartingCity: false, x: 100, y: 240 },
  { nodeId: 'jincheng', name: '금성', type: 'battlefield', region: 'liangzhou', isStartingCity: false, x: 50, y: 300 },
  { nodeId: 'longxi', name: '농서', type: 'battlefield', region: 'liangzhou', isStartingCity: false, x: 100, y: 340 },
  { nodeId: 'hanyang', name: '한양', type: 'battlefield', region: 'liangzhou', isStartingCity: false, x: 160, y: 360 },
  { nodeId: 'anding', name: '안정', type: 'battlefield', region: 'liangzhou', isStartingCity: false, x: 220, y: 300 },
  { nodeId: 'beidi', name: '북지', type: 'battlefield', region: 'liangzhou', isStartingCity: false, x: 190, y: 250 },

  // -- 병주 (bingzhou) --
  { nodeId: 'jinyang', name: '진양', type: 'city', region: 'bingzhou', isStartingCity: true, x: 520, y: 140 },
  { nodeId: 'shangdang', name: '상당', type: 'battlefield', region: 'bingzhou', isStartingCity: false, x: 580, y: 170 },
  { nodeId: 'xihe', name: '서하', type: 'battlefield', region: 'bingzhou', isStartingCity: false, x: 460, y: 140 },
  { nodeId: 'yanmen', name: '안문', type: 'battlefield', region: 'bingzhou', isStartingCity: false, x: 520, y: 60 },
  { nodeId: 'yunzhong', name: '운중', type: 'battlefield', region: 'bingzhou', isStartingCity: false, x: 480, y: 40 },
  { nodeId: 'dingxiang', name: '정양', type: 'battlefield', region: 'bingzhou', isStartingCity: false, x: 440, y: 60 },
  { nodeId: 'daijun', name: '대군', type: 'battlefield', region: 'bingzhou', isStartingCity: false, x: 580, y: 40 },
  { nodeId: 'shangjun', name: '상군', type: 'battlefield', region: 'bingzhou', isStartingCity: false, x: 420, y: 110 },
  { nodeId: 'wuyuan', name: '오원', type: 'battlefield', region: 'bingzhou', isStartingCity: false, x: 420, y: 20 },
  { nodeId: 'shuofang', name: '삭방', type: 'battlefield', region: 'bingzhou', isStartingCity: false, x: 360, y: 40 },

  // -- 기주 (jizhou) --
  { nodeId: 'ye', name: '업', type: 'city', region: 'jizhou', isStartingCity: true, x: 580, y: 190 },
  { nodeId: 'julu', name: '거록', type: 'battlefield', region: 'jizhou', isStartingCity: false, x: 640, y: 160 },
  { nodeId: 'changshan', name: '상산', type: 'battlefield', region: 'jizhou', isStartingCity: false, x: 520, y: 150 },
  { nodeId: 'zhongshan', name: '중산', type: 'battlefield', region: 'jizhou', isStartingCity: false, x: 520, y: 90 },
  { nodeId: 'anping', name: '안평', type: 'battlefield', region: 'jizhou', isStartingCity: false, x: 600, y: 100 },
  { nodeId: 'hejian', name: '하간', type: 'battlefield', region: 'jizhou', isStartingCity: false, x: 660, y: 90 },
  { nodeId: 'qinghe', name: '청하', type: 'battlefield', region: 'jizhou', isStartingCity: false, x: 640, y: 230 },
  { nodeId: 'zhaoguo', name: '조국', type: 'battlefield', region: 'jizhou', isStartingCity: false, x: 580, y: 130 },
  { nodeId: 'bohai', name: '발해', type: 'battlefield', region: 'jizhou', isStartingCity: false, x: 700, y: 130 },

  // -- 유주 (youzhou) --
  { nodeId: 'shanggu', name: '상곡', type: 'battlefield', region: 'youzhou', isStartingCity: false, x: 720, y: 90 },
  { nodeId: 'zhuo', name: '탁', type: 'battlefield', region: 'youzhou', isStartingCity: false, x: 740, y: 150 },
  { nodeId: 'guangyang', name: '광양', type: 'battlefield', region: 'youzhou', isStartingCity: false, x: 800, y: 120 },
  { nodeId: 'yuyang', name: '어양', type: 'battlefield', region: 'youzhou', isStartingCity: false, x: 820, y: 160 },
  { nodeId: 'youbeiping', name: '우북평', type: 'battlefield', region: 'youzhou', isStartingCity: false, x: 880, y: 150 },
  { nodeId: 'liaoxi', name: '요서', type: 'battlefield', region: 'youzhou', isStartingCity: false, x: 940, y: 130 },
  { nodeId: 'liaodong', name: '요동', type: 'battlefield', region: 'youzhou', isStartingCity: false, x: 1020, y: 110 },
  { nodeId: 'liaodongshuguo', name: '요동속국', type: 'battlefield', region: 'youzhou', isStartingCity: false, x: 1040, y: 70 },
  { nodeId: 'xuantu', name: '현도', type: 'battlefield', region: 'youzhou', isStartingCity: false, x: 1020, y: 50 },
  { nodeId: 'lelang', name: '낙랑', type: 'battlefield', region: 'youzhou', isStartingCity: false, x: 1080, y: 100 },

  // -- 연주 (yanzhou) --
  { nodeId: 'puyang', name: '견성', type: 'city', region: 'yanzhou', isStartingCity: true, x: 640, y: 290 },
  { nodeId: 'chenliu', name: '진류', type: 'battlefield', region: 'yanzhou', isStartingCity: false, x: 580, y: 310 },
  { nodeId: 'dongjun', name: '동군', type: 'battlefield', region: 'yanzhou', isStartingCity: false, x: 620, y: 250 },
  { nodeId: 'shanyang', name: '산양', type: 'battlefield', region: 'yanzhou', isStartingCity: false, x: 680, y: 310 },
  { nodeId: 'jiyin', name: '제음', type: 'battlefield', region: 'yanzhou', isStartingCity: false, x: 640, y: 350 },
  { nodeId: 'taishan', name: '태산', type: 'battlefield', region: 'yanzhou', isStartingCity: false, x: 720, y: 270 },
  { nodeId: 'dongping', name: '동평', type: 'battlefield', region: 'yanzhou', isStartingCity: false, x: 700, y: 230 },

  // -- 청주 (qingzhou) --
  { nodeId: 'jinan', name: '제남', type: 'battlefield', region: 'qingzhou', isStartingCity: false, x: 780, y: 230 },
  { nodeId: 'pingyuan', name: '평원', type: 'battlefield', region: 'qingzhou', isStartingCity: false, x: 760, y: 190 },
  { nodeId: 'leian', name: '낙안', type: 'battlefield', region: 'qingzhou', isStartingCity: false, x: 820, y: 200 },
  { nodeId: 'beihai', name: '북해', type: 'battlefield', region: 'qingzhou', isStartingCity: false, x: 860, y: 240 },
  { nodeId: 'donglai', name: '동래', type: 'battlefield', region: 'qingzhou', isStartingCity: false, x: 920, y: 230 },
  { nodeId: 'qiguo', name: '제국', type: 'battlefield', region: 'qingzhou', isStartingCity: false, x: 820, y: 270 },

  // -- 예주 (yuzhou) --
  { nodeId: 'runan', name: '여남', type: 'city', region: 'yuzhou', isStartingCity: true, x: 520, y: 430 },
  { nodeId: 'yingchuan', name: '영천', type: 'battlefield', region: 'yuzhou', isStartingCity: false, x: 560, y: 370 },
  { nodeId: 'liangguo', name: '양국', type: 'battlefield', region: 'yuzhou', isStartingCity: false, x: 600, y: 350 },
  { nodeId: 'peiguo', name: '패국', type: 'battlefield', region: 'yuzhou', isStartingCity: false, x: 620, y: 390 },
  { nodeId: 'chenguo', name: '진국', type: 'battlefield', region: 'yuzhou', isStartingCity: false, x: 600, y: 430 },
  { nodeId: 'luoguo', name: '노국', type: 'battlefield', region: 'yuzhou', isStartingCity: false, x: 640, y: 350 },
  { nodeId: 'wancheng', name: '완성', type: 'battlefield', region: 'yuzhou', isStartingCity: false, x: 460, y: 390 },

  // -- 서주 (xuzhou) --
  { nodeId: 'donghai2', name: '동해', type: 'battlefield', region: 'xuzhou', isStartingCity: false, x: 820, y: 370 },
  { nodeId: 'langya', name: '낭야', type: 'battlefield', region: 'xuzhou', isStartingCity: false, x: 860, y: 330 },
  { nodeId: 'pengcheng', name: '팽성', type: 'battlefield', region: 'xuzhou', isStartingCity: false, x: 800, y: 410 },
  { nodeId: 'guangling', name: '광릉', type: 'battlefield', region: 'xuzhou', isStartingCity: false, x: 880, y: 430 },
  { nodeId: 'xiapi', name: '하비', type: 'battlefield', region: 'xuzhou', isStartingCity: false, x: 840, y: 390 },

  // -- 형주 (jingzhou) --
  { nodeId: 'xiangyang', name: '양양', type: 'city', region: 'jingzhou', isStartingCity: true, x: 400, y: 510 },
  { nodeId: 'nanyang', name: '남양', type: 'battlefield', region: 'jingzhou', isStartingCity: false, x: 440, y: 450 },
  { nodeId: 'jiangxia', name: '강하', type: 'battlefield', region: 'jingzhou', isStartingCity: false, x: 500, y: 570 },
  { nodeId: 'wuling', name: '무릉', type: 'battlefield', region: 'jingzhou', isStartingCity: false, x: 320, y: 590 },
  { nodeId: 'changsha', name: '장사', type: 'battlefield', region: 'jingzhou', isStartingCity: false, x: 400, y: 630 },
  { nodeId: 'guiyang', name: '계양', type: 'battlefield', region: 'jingzhou', isStartingCity: false, x: 420, y: 690 },
  { nodeId: 'lingling', name: '영릉', type: 'battlefield', region: 'jingzhou', isStartingCity: false, x: 340, y: 670 },
  { nodeId: 'yangtzeCrossing', name: '장강도하', type: 'battlefield', region: 'jingzhou', isStartingCity: false, x: 500, y: 610 },

  // -- 양주 (yangzhou) --
  { nodeId: 'jianye', name: '건업', type: 'city', region: 'yangzhou', isStartingCity: true, x: 720, y: 570 },
  { nodeId: 'danyang', name: '단양', type: 'battlefield', region: 'yangzhou', isStartingCity: false, x: 680, y: 550 },
  { nodeId: 'jiujiang', name: '구강', type: 'battlefield', region: 'yangzhou', isStartingCity: false, x: 620, y: 510 },
  { nodeId: 'lujiang', name: '여강', type: 'battlefield', region: 'yangzhou', isStartingCity: false, x: 640, y: 550 },
  { nodeId: 'yuzhang', name: '예장', type: 'battlefield', region: 'yangzhou', isStartingCity: false, x: 640, y: 610 },
  { nodeId: 'kuaiji', name: '회계', type: 'battlefield', region: 'yangzhou', isStartingCity: false, x: 780, y: 610 },

  // -- 익주 (yizhou) --
  { nodeId: 'chengdu', name: '성도', type: 'city', region: 'yizhou', isStartingCity: true, x: 160, y: 550 },
  { nodeId: 'jianGe', name: '검각', type: 'battlefield', region: 'yizhou', isStartingCity: false, x: 200, y: 490 },
  { nodeId: 'hanzhong', name: '한중', type: 'battlefield', region: 'yizhou', isStartingCity: false, x: 260, y: 450 },
  { nodeId: 'guanghan', name: '광한', type: 'battlefield', region: 'yizhou', isStartingCity: false, x: 160, y: 590 },
  { nodeId: 'jianwei', name: '건위', type: 'battlefield', region: 'yizhou', isStartingCity: false, x: 140, y: 650 },
  { nodeId: 'bajun', name: '파군', type: 'battlefield', region: 'yizhou', isStartingCity: false, x: 220, y: 610 },
  { nodeId: 'zhangke', name: '장가', type: 'battlefield', region: 'yizhou', isStartingCity: false, x: 220, y: 710 },
  { nodeId: 'yuexi', name: '월수', type: 'battlefield', region: 'yizhou', isStartingCity: false, x: 120, y: 710 },
  { nodeId: 'yongchang', name: '영창', type: 'battlefield', region: 'yizhou', isStartingCity: false, x: 80, y: 770 },
  { nodeId: 'yizhoujun', name: '익주군', type: 'battlefield', region: 'yizhou', isStartingCity: false, x: 160, y: 790 },

  // -- 교주 (jiaozhou) --
  { nodeId: 'nanhai', name: '남해', type: 'battlefield', region: 'jiaozhou', isStartingCity: false, x: 520, y: 870 },
  { nodeId: 'cangwu', name: '창오', type: 'battlefield', region: 'jiaozhou', isStartingCity: false, x: 440, y: 860 },
  { nodeId: 'yulin', name: '울림', type: 'battlefield', region: 'jiaozhou', isStartingCity: false, x: 400, y: 830 },
  { nodeId: 'hepu', name: '합포', type: 'battlefield', region: 'jiaozhou', isStartingCity: false, x: 460, y: 910 },
  { nodeId: 'jiaozhi', name: '교지', type: 'battlefield', region: 'jiaozhou', isStartingCity: false, x: 370, y: 910 },
  { nodeId: 'jiuzhen', name: '구진', type: 'battlefield', region: 'jiaozhou', isStartingCity: false, x: 350, y: 960 },
  { nodeId: 'rinan', name: '일남', type: 'battlefield', region: 'jiaozhou', isStartingCity: false, x: 340, y: 990 },
];

export const MAP_EDGES: MapEdge[] = [
  // -- 사례 (siLi) internal --
  { from: 'luoyang', to: 'hongnong', baseDistanceDays: 1 },
  { from: 'luoyang', to: 'hedong', baseDistanceDays: 1 },
  { from: 'luoyang', to: 'henei', baseDistanceDays: 1, kind: 'river' }, // 황하 도하
  { from: 'luoyang', to: 'zuopingyi', baseDistanceDays: 1 },
  { from: 'zuopingyi', to: 'youfuling', baseDistanceDays: 1 },
  { from: 'luoyang', to: 'hulaoGuan', baseDistanceDays: 2 },

  // -- 량주 (liangzhou) internal + link to siLi --
  { from: 'luoyang', to: 'guanzhong', baseDistanceDays: 3 },
  { from: 'guanzhong', to: 'changan', baseDistanceDays: 2 },
  { from: 'changan', to: 'beidi', baseDistanceDays: 1 },
  { from: 'beidi', to: 'anding', baseDistanceDays: 1 },
  { from: 'changan', to: 'anding', baseDistanceDays: 2 },
  { from: 'anding', to: 'longxi', baseDistanceDays: 2 },
  { from: 'longxi', to: 'jincheng', baseDistanceDays: 1 },
  { from: 'jincheng', to: 'wuwei', baseDistanceDays: 1 },
  { from: 'wuwei', to: 'zhangye', baseDistanceDays: 1 },
  { from: 'zhangye', to: 'jiuquan', baseDistanceDays: 1 },
  { from: 'jiuquan', to: 'dunhuang', baseDistanceDays: 1 },
  { from: 'dunhuang', to: 'juyanshuguo', baseDistanceDays: 2 },
  { from: 'longxi', to: 'hanyang', baseDistanceDays: 1 },
  { from: 'changan', to: 'jianGe', baseDistanceDays: 5 },

  // -- 병주 (bingzhou) internal + link to jizhou --
  { from: 'ye', to: 'jinyang', baseDistanceDays: 4 },
  { from: 'jinyang', to: 'shangdang', baseDistanceDays: 1 },
  { from: 'jinyang', to: 'xihe', baseDistanceDays: 1 },
  { from: 'jinyang', to: 'yanmen', baseDistanceDays: 1 },
  { from: 'yanmen', to: 'yunzhong', baseDistanceDays: 1 },
  { from: 'yunzhong', to: 'dingxiang', baseDistanceDays: 1 },
  { from: 'dingxiang', to: 'shangjun', baseDistanceDays: 1 },
  { from: 'yanmen', to: 'daijun', baseDistanceDays: 1 },
  { from: 'shangjun', to: 'wuyuan', baseDistanceDays: 1 },
  { from: 'wuyuan', to: 'shuofang', baseDistanceDays: 1 },

  // -- 기주 (jizhou) internal + link to yanzhou/youzhou --
  { from: 'ye', to: 'julu', baseDistanceDays: 1 },
  { from: 'ye', to: 'changshan', baseDistanceDays: 1 },
  { from: 'ye', to: 'zhaoguo', baseDistanceDays: 1 },
  { from: 'changshan', to: 'zhongshan', baseDistanceDays: 1 },
  { from: 'zhaoguo', to: 'anping', baseDistanceDays: 1 },
  { from: 'anping', to: 'hejian', baseDistanceDays: 1 },
  { from: 'julu', to: 'qinghe', baseDistanceDays: 1 },
  { from: 'zhaoguo', to: 'bohai', baseDistanceDays: 1 },
  { from: 'dongjun', to: 'ye', baseDistanceDays: 2 },
  { from: 'hejian', to: 'zhuo', baseDistanceDays: 2 },

  // -- 유주 (youzhou) internal --
  { from: 'shanggu', to: 'zhuo', baseDistanceDays: 1 },
  { from: 'zhuo', to: 'guangyang', baseDistanceDays: 1 },
  { from: 'guangyang', to: 'yuyang', baseDistanceDays: 1 },
  { from: 'yuyang', to: 'youbeiping', baseDistanceDays: 1 },
  { from: 'youbeiping', to: 'liaoxi', baseDistanceDays: 1 },
  { from: 'liaoxi', to: 'liaodong', baseDistanceDays: 2 },
  { from: 'liaodong', to: 'liaodongshuguo', baseDistanceDays: 1 },
  { from: 'liaodong', to: 'xuantu', baseDistanceDays: 1 },
  { from: 'liaodong', to: 'lelang', baseDistanceDays: 2 },
  { from: 'shangjun', to: 'shanggu', baseDistanceDays: 2 },

  // -- 연주 (yanzhou) internal + link to siLi/jizhou/qingzhou --
  { from: 'hulaoGuan', to: 'puyang', baseDistanceDays: 3 },
  { from: 'puyang', to: 'chenliu', baseDistanceDays: 1 },
  { from: 'puyang', to: 'dongjun', baseDistanceDays: 1 },
  { from: 'puyang', to: 'shanyang', baseDistanceDays: 1 },
  { from: 'puyang', to: 'jiyin', baseDistanceDays: 1 },
  { from: 'shanyang', to: 'taishan', baseDistanceDays: 1 },
  { from: 'taishan', to: 'dongping', baseDistanceDays: 1 },
  { from: 'dongping', to: 'jinan', baseDistanceDays: 1 },

  // -- 청주 (qingzhou) internal --
  { from: 'jinan', to: 'pingyuan', baseDistanceDays: 1 },
  { from: 'jinan', to: 'leian', baseDistanceDays: 1 },
  { from: 'leian', to: 'beihai', baseDistanceDays: 1 },
  { from: 'beihai', to: 'donglai', baseDistanceDays: 1 },
  { from: 'jinan', to: 'qiguo', baseDistanceDays: 1 },

  // -- 예주 (yuzhou) internal + link to siLi/yanzhou/jingzhou --
  { from: 'luoyang', to: 'wancheng', baseDistanceDays: 4 },
  { from: 'puyang', to: 'runan', baseDistanceDays: 3 },
  { from: 'runan', to: 'yingchuan', baseDistanceDays: 1 },
  { from: 'runan', to: 'chenguo', baseDistanceDays: 1 },
  { from: 'yingchuan', to: 'liangguo', baseDistanceDays: 1 },
  { from: 'liangguo', to: 'peiguo', baseDistanceDays: 1 },
  { from: 'liangguo', to: 'luoguo', baseDistanceDays: 1 },
  { from: 'runan', to: 'wancheng', baseDistanceDays: 1 },

  // -- 서주 (xuzhou) internal + link to yanzhou/qingzhou/yuzhou --
  { from: 'donghai2', to: 'langya', baseDistanceDays: 1 },
  { from: 'donghai2', to: 'xiapi', baseDistanceDays: 1 },
  { from: 'xiapi', to: 'pengcheng', baseDistanceDays: 1 },
  { from: 'xiapi', to: 'guangling', baseDistanceDays: 1 },
  { from: 'taishan', to: 'langya', baseDistanceDays: 2 },
  { from: 'qiguo', to: 'donghai2', baseDistanceDays: 2 },
  { from: 'chenguo', to: 'pengcheng', baseDistanceDays: 2 },

  // -- 형주 (jingzhou) internal + link to yuzhou/yizhou --
  { from: 'wancheng', to: 'xiangyang', baseDistanceDays: 3 },
  { from: 'chengdu', to: 'xiangyang', baseDistanceDays: 6 },
  { from: 'xiangyang', to: 'nanyang', baseDistanceDays: 1 },
  { from: 'nanyang', to: 'runan', baseDistanceDays: 2 },
  { from: 'xiangyang', to: 'jiangxia', baseDistanceDays: 2 },
  { from: 'xiangyang', to: 'wuling', baseDistanceDays: 2 },
  { from: 'wuling', to: 'changsha', baseDistanceDays: 1 },
  { from: 'changsha', to: 'guiyang', baseDistanceDays: 1 },
  { from: 'changsha', to: 'lingling', baseDistanceDays: 1 },
  { from: 'jiangxia', to: 'yangtzeCrossing', baseDistanceDays: 1 },

  // -- 양주 (yangzhou) internal + link to jingzhou/xuzhou --
  { from: 'yangtzeCrossing', to: 'jianye', baseDistanceDays: 3, kind: 'river' }, // 장강 도하
  { from: 'jianye', to: 'danyang', baseDistanceDays: 1 },
  { from: 'danyang', to: 'jiujiang', baseDistanceDays: 1 },
  { from: 'danyang', to: 'lujiang', baseDistanceDays: 1 },
  { from: 'jianye', to: 'yuzhang', baseDistanceDays: 2 },
  { from: 'jianye', to: 'kuaiji', baseDistanceDays: 1 },
  { from: 'guangling', to: 'jianye', baseDistanceDays: 2, kind: 'river' }, // 장강 도하
  { from: 'jiangxia', to: 'jiujiang', baseDistanceDays: 2, kind: 'river' }, // 장강 도하

  // -- 익주 (yizhou) internal --
  { from: 'chengdu', to: 'jianGe', baseDistanceDays: 4 },
  { from: 'jianGe', to: 'hanzhong', baseDistanceDays: 1 },
  { from: 'chengdu', to: 'guanghan', baseDistanceDays: 1 },
  { from: 'guanghan', to: 'hanzhong', baseDistanceDays: 2 },
  { from: 'chengdu', to: 'jianwei', baseDistanceDays: 1 },
  { from: 'jianwei', to: 'bajun', baseDistanceDays: 1 },
  { from: 'bajun', to: 'zhangke', baseDistanceDays: 1 },
  { from: 'zhangke', to: 'yuexi', baseDistanceDays: 1 },
  { from: 'yuexi', to: 'yongchang', baseDistanceDays: 2 },
  { from: 'zhangke', to: 'yizhoujun', baseDistanceDays: 1 },

  // -- 교주 (jiaozhou) internal + link to yizhou/jingzhou --
  { from: 'yizhoujun', to: 'yulin', baseDistanceDays: 2 },
  { from: 'guiyang', to: 'nanhai', baseDistanceDays: 2 },
  { from: 'lingling', to: 'yulin', baseDistanceDays: 2 },
  { from: 'yulin', to: 'cangwu', baseDistanceDays: 1 },
  { from: 'cangwu', to: 'nanhai', baseDistanceDays: 1 },
  { from: 'cangwu', to: 'hepu', baseDistanceDays: 1 },
  { from: 'hepu', to: 'jiaozhi', baseDistanceDays: 1 },
  { from: 'jiaozhi', to: 'jiuzhen', baseDistanceDays: 2 },
  { from: 'jiuzhen', to: 'rinan', baseDistanceDays: 2 },
];

export const STARTING_CITY_NODE_IDS: MapNodeId[] = MAP_NODES.filter((n) => n.isStartingCity).map((n) => n.nodeId);

export function getMapNode(nodeId: MapNodeId): MapNode | undefined {
  return MAP_NODES.find((n) => n.nodeId === nodeId);
}

export function getAdjacentNodeIds(nodeId: MapNodeId): MapNodeId[] {
  const result: MapNodeId[] = [];
  for (const edge of MAP_EDGES) {
    if (edge.from === nodeId) result.push(edge.to);
    else if (edge.to === nodeId) result.push(edge.from);
  }
  return result;
}

export function findEdge(fromNodeId: MapNodeId, toNodeId: MapNodeId): MapEdge | undefined {
  return MAP_EDGES.find((e) => (e.from === fromNodeId && e.to === toNodeId) || (e.from === toNodeId && e.to === fromNodeId));
}
