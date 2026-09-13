import type { MapEdge, MapNode, MapNodeId, Region, RegionId } from '../types/map.js';

// A fixed, hand-authored map. Room settings (mapSize) scale travel time via
// MAP_SIZE_TRAVEL_DAY_MULTIPLIER; they never add or remove nodes.
export const REGIONS: Record<RegionId, Region> = {
  siLi: { regionId: 'siLi', name: '사례', horseProductionMultiplier: 1 },
  jizhou: { regionId: 'jizhou', name: '기주', horseProductionMultiplier: 1 },
  bingzhou: { regionId: 'bingzhou', name: '병주', horseProductionMultiplier: 1.5 },
  xiliang: { regionId: 'xiliang', name: '서량', horseProductionMultiplier: 1.5 },
  yanzhou: { regionId: 'yanzhou', name: '연주', horseProductionMultiplier: 1 },
  yuzhou: { regionId: 'yuzhou', name: '예주', horseProductionMultiplier: 1 },
  jingzhou: { regionId: 'jingzhou', name: '형주', horseProductionMultiplier: 1 },
  yizhou: { regionId: 'yizhou', name: '익주', horseProductionMultiplier: 1 },
  jiangdong: { regionId: 'jiangdong', name: '강동', horseProductionMultiplier: 0.8 },
};

export const MAP_NODES: MapNode[] = [
  { nodeId: 'luoyang', name: '낙양', type: 'city', region: 'siLi', isStartingCity: true },
  { nodeId: 'changan', name: '장안', type: 'city', region: 'xiliang', isStartingCity: true },
  { nodeId: 'ye', name: '업', type: 'city', region: 'jizhou', isStartingCity: true },
  { nodeId: 'jinyang', name: '진양', type: 'city', region: 'bingzhou', isStartingCity: true },
  { nodeId: 'puyang', name: '견성', type: 'city', region: 'yanzhou', isStartingCity: true },
  { nodeId: 'runan', name: '여남', type: 'city', region: 'yuzhou', isStartingCity: true },
  { nodeId: 'xiangyang', name: '양양', type: 'city', region: 'jingzhou', isStartingCity: true },
  { nodeId: 'chengdu', name: '성도', type: 'city', region: 'yizhou', isStartingCity: true },
  { nodeId: 'jianye', name: '건업', type: 'city', region: 'jiangdong', isStartingCity: true },

  { nodeId: 'hulaoGuan', name: '호로관', type: 'battlefield', region: 'siLi', isStartingCity: false },
  { nodeId: 'guanzhong', name: '관중', type: 'battlefield', region: 'xiliang', isStartingCity: false },
  { nodeId: 'wancheng', name: '완성', type: 'battlefield', region: 'yuzhou', isStartingCity: false },
  { nodeId: 'yangtzeCrossing', name: '장강도하', type: 'battlefield', region: 'jingzhou', isStartingCity: false },
  { nodeId: 'jianGe', name: '검각', type: 'battlefield', region: 'yizhou', isStartingCity: false },
];

export const MAP_EDGES: MapEdge[] = [
  { from: 'luoyang', to: 'hulaoGuan', baseDistanceDays: 2 },
  { from: 'hulaoGuan', to: 'ye', baseDistanceDays: 3 },
  { from: 'hulaoGuan', to: 'puyang', baseDistanceDays: 3 },
  { from: 'luoyang', to: 'guanzhong', baseDistanceDays: 3 },
  { from: 'guanzhong', to: 'changan', baseDistanceDays: 2 },
  { from: 'changan', to: 'jianGe', baseDistanceDays: 5 },
  { from: 'jianGe', to: 'chengdu', baseDistanceDays: 4 },
  { from: 'luoyang', to: 'wancheng', baseDistanceDays: 4 },
  { from: 'wancheng', to: 'runan', baseDistanceDays: 3 },
  { from: 'wancheng', to: 'xiangyang', baseDistanceDays: 3 },
  { from: 'xiangyang', to: 'yangtzeCrossing', baseDistanceDays: 3 },
  { from: 'yangtzeCrossing', to: 'jianye', baseDistanceDays: 3 },
  { from: 'ye', to: 'jinyang', baseDistanceDays: 4 },
  { from: 'puyang', to: 'runan', baseDistanceDays: 3 },
  { from: 'chengdu', to: 'xiangyang', baseDistanceDays: 6 },
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
