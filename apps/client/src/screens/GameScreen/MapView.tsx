import type { Army, GameCity, PlayerId, RoomPlayer } from '@sam-simul/shared';
import { MAP_EDGES, MAP_NODES, UNIT_TYPE_LABEL, getMapNode } from '@sam-simul/shared';

function ownerColor(ownerId: string): string {
  let hash = 0;
  for (let i = 0; i < ownerId.length; i++) hash = (hash * 31 + ownerId.charCodeAt(i)) >>> 0;
  return `hsl(${hash % 360}, 65%, 55%)`;
}

export function MapView({ cities, armies, players, myPlayerId }: { cities: GameCity[]; armies: Army[]; players: RoomPlayer[]; myPlayerId: PlayerId | null }) {
  const cityByNodeId = new Map(cities.map((c) => [c.nodeId, c]));
  const displayNameByPlayerId = new Map(players.map((p) => [p.playerId, p.displayName]));
  const owners = [...new Set(cities.map((c) => c.ownerId))];

  return (
    <div className="card">
      <h2>지도</h2>
      <svg viewBox="0 0 700 600" className="map-svg" role="img" aria-label="삼국지 지도">
        {MAP_EDGES.map((edge) => {
          const from = getMapNode(edge.from);
          const to = getMapNode(edge.to);
          if (!from || !to) return null;
          return <line key={`${edge.from}-${edge.to}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="map-edge" />;
        })}

        {armies.map((army) => {
          const from = getMapNode(army.currentNodeId);
          const to = army.destinationNodeId ? getMapNode(army.destinationNodeId) : null;
          if (!from) return null;
          const x = to ? (from.x + to.x) / 2 : from.x + 14;
          const y = to ? (from.y + to.y) / 2 : from.y - 14;
          const ownerName = displayNameByPlayerId.get(army.ownerId) ?? army.ownerId;
          const troopSummary = army.troops.map((t) => `${UNIT_TYPE_LABEL[t.unitType]} ${Math.round(t.count)}`).join(', ') || '병력 없음';
          const destinationName = to ? `${to.name}(으)로 행군 중` : `${from.name}에 주둔 중`;
          return (
            <circle key={army.armyId} cx={x} cy={y} r={5} fill={ownerColor(army.ownerId)} stroke="#000" strokeWidth={0.5} className="map-army-marker">
              <title>
                {ownerName}: {troopSummary} — {destinationName}
              </title>
            </circle>
          );
        })}

        {MAP_NODES.map((node) => {
          const city = cityByNodeId.get(node.nodeId);
          const isMine = city?.ownerId === myPlayerId;
          const radius = node.type === 'city' ? 14 : 8;
          const fill = city ? ownerColor(city.ownerId) : 'var(--map-neutral)';
          const ownerName = city ? (displayNameByPlayerId.get(city.ownerId) ?? city.ownerId) : undefined;
          const tooltip = city ? `${node.name} — ${ownerName}${isMine ? ' (나)' : ''}, 인구 ${Math.round(city.population)}` : node.name;

          return (
            <g key={node.nodeId}>
              {node.type === 'city' ? (
                <circle cx={node.x} cy={node.y} r={radius} fill={fill} stroke={isMine ? 'var(--map-my-city-ring)' : '#00000055'} strokeWidth={isMine ? 3 : 1}>
                  <title>{tooltip}</title>
                </circle>
              ) : (
                <rect x={node.x - radius} y={node.y - radius} width={radius * 2} height={radius * 2} fill={fill} transform={`rotate(45 ${node.x} ${node.y})`} stroke="#00000055">
                  <title>{tooltip}</title>
                </rect>
              )}
              <text x={node.x} y={node.y + radius + 14} textAnchor="middle" className="map-node-label">
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      {owners.length > 0 && (
        <ul className="map-legend">
          {owners.map((ownerId) => (
            <li key={ownerId}>
              <span className="map-legend-swatch" style={{ backgroundColor: ownerColor(ownerId) }} />
              {displayNameByPlayerId.get(ownerId) ?? ownerId}
              {ownerId === myPlayerId ? ' (나)' : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
