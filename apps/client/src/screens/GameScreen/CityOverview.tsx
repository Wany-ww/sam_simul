import type { EffectDomain, GameCity, ResourceType } from '@sam-simul/shared';
import { RESOURCE_LABEL, REGIONS, UNIT_TYPE_LABEL, getMapNode } from '@sam-simul/shared';

const DOMAIN_LABEL: Record<EffectDomain, string> = { agriculture: '농업', animalHusbandry: '목축업', commerce: '상업', industry: '공업' };

export function CityOverview({ city }: { city: GameCity }) {
  const stockedResources = (Object.entries(city.warehouse) as [ResourceType, number][]).filter(([, amount]) => amount > 0.01);
  const node = getMapNode(city.nodeId);
  const region = node ? REGIONS[node.region] : undefined;

  return (
    <div className="card">
      <h2>{city.name}</h2>
      <ul className="settings-readout">
        <li>
          위치: {node?.name ?? city.nodeId} ({region?.name ?? '?'})
        </li>
        <li>인구: {Math.round(city.population)}</li>
        <li>
          수비대 사기: {round(city.garrisonMorale)} · 성벽 내구도: {round(city.wallDurability)}
        </li>
        <li>농업 수준: {round(city.facilities.agriculture)}</li>
        <li>목축업 수준: {round(city.facilities.animalHusbandry)}</li>
        <li>
          상업: 교역소 {round(city.facilities.commerce.tradingPost)} · 세무소 {round(city.facilities.commerce.taxOffice)} · 시장 {round(city.facilities.commerce.market)}
        </li>
        <li>
          공업: 군기감 {round(city.facilities.industry.armory)} · 조병창 {round(city.facilities.industry.weaponsWorkshop)} · 대장간{' '}
          {round(city.facilities.industry.blacksmith)} · 공부 {round(city.facilities.industry.publicWorks)}
        </li>
      </ul>

      <h3>창고</h3>
      {stockedResources.length === 0 ? (
        <p className="muted">보유한 자원이 없습니다.</p>
      ) : (
        <ul className="settings-readout warehouse-list">
          {stockedResources.map(([resource, amount]) => (
            <li key={resource}>
              {RESOURCE_LABEL[resource]}: {round(amount)}
            </li>
          ))}
        </ul>
      )}

      {city.activeEffects.length > 0 && (
        <>
          <h3>진행 중인 효과</h3>
          <ul className="settings-readout">
            {city.activeEffects.map((e) => (
              <li key={e.id} className={e.kind === 'disaster' ? 'error-text' : undefined}>
                {e.name} ({DOMAIN_LABEL[e.domain]} {e.magnitude > 0 ? '+' : ''}
                {Math.round(e.magnitude * 100)}%) — 남은 턴: {e.turnsRemaining}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>병력</h3>
      {city.troops.length === 0 ? (
        <p className="muted">보유한 병력이 없습니다.</p>
      ) : (
        <ul className="settings-readout">
          {city.troops.map((t) => (
            <li key={t.unitType}>
              {UNIT_TYPE_LABEL[t.unitType]}: {t.count}명 (훈련도 {round(t.trainingLevel)})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
