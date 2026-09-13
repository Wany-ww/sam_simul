import { useEffect, useState } from 'react';
import type { Army, ArmyStance, GameCity, GameState, MapNodeId, PlayerOrder, ResourceType, RoomId, UnitType } from '@sam-simul/shared';
import {
  ARMY_STANCE_ORDER_POINT_COST,
  FORTIFY_ORDER_POINT_COST,
  MARCH_ORDER_POINT_COST,
  MARKET_EXCHANGE_POINT_COST,
  RECRUIT_POINT_COST_PER_UNIT,
  RESOURCE_LABEL,
  UNIT_TYPE_LABEL,
  getAdjacentNodeIds,
  getMapNode,
} from '@sam-simul/shared';
import { getSocket } from '../../net/socket';

const STANCE_LABEL: Record<ArmyStance, string> = { attack: '공격', defend: '방어' };

const UNIT_TYPES: UnitType[] = ['spearman', 'crossbowman', 'cavalry', 'engineer'];
const TRADEABLE_RESOURCES: ResourceType[] = ['rice', 'wheat', 'potato', 'cotton', 'hemp', 'cattle', 'horse', 'pig', 'leather'];

interface Draft {
  agriculture: number;
  animalHusbandry: number;
  tradingPost: number;
  taxOffice: number;
  market: number;
  armory: number;
  weaponsWorkshop: number;
  blacksmith: number;
  publicWorks: number;
  recruitUnitType: UnitType;
  recruitCount: number;
  trainUnitType: UnitType;
  trainPoints: number;
  marketFrom: ResourceType;
  marketAmount: number;
  marchUnitType: UnitType;
  marchCount: number;
  marchDestinationNodeId: MapNodeId | '';
  stanceArmyId: string;
  stance: ArmyStance | '';
  fortifyArmyId: string;
}

const EMPTY_DRAFT: Draft = {
  agriculture: 0,
  animalHusbandry: 0,
  tradingPost: 0,
  taxOffice: 0,
  market: 0,
  armory: 0,
  weaponsWorkshop: 0,
  blacksmith: 0,
  publicWorks: 0,
  recruitUnitType: 'spearman',
  recruitCount: 0,
  trainUnitType: 'spearman',
  trainPoints: 0,
  marketFrom: 'rice',
  marketAmount: 0,
  marchUnitType: 'spearman',
  marchCount: 0,
  marchDestinationNodeId: '',
  stanceArmyId: '',
  stance: '',
  fortifyArmyId: '',
};

function totalSpent(d: Draft): number {
  return (
    d.agriculture +
    d.animalHusbandry +
    d.tradingPost +
    d.taxOffice +
    d.market +
    d.armory +
    d.weaponsWorkshop +
    d.blacksmith +
    d.publicWorks +
    d.recruitCount * RECRUIT_POINT_COST_PER_UNIT +
    d.trainPoints +
    (d.marketAmount > 0 ? MARKET_EXCHANGE_POINT_COST : 0) +
    (d.marchCount > 0 && d.marchDestinationNodeId ? MARCH_ORDER_POINT_COST : 0) +
    (d.stanceArmyId && d.stance ? ARMY_STANCE_ORDER_POINT_COST : 0) +
    (d.fortifyArmyId ? FORTIFY_ORDER_POINT_COST : 0)
  );
}

function buildOrder(d: Draft): PlayerOrder {
  return {
    investment: {
      agriculture: d.agriculture,
      animalHusbandry: d.animalHusbandry,
      commerce: { tradingPost: d.tradingPost, taxOffice: d.taxOffice, market: d.market },
      industry: { armory: d.armory, weaponsWorkshop: d.weaponsWorkshop, blacksmith: d.blacksmith, publicWorks: d.publicWorks },
    },
    recruit: d.recruitCount > 0 ? { unitType: d.recruitUnitType, count: d.recruitCount } : undefined,
    train: d.trainPoints > 0 ? { unitType: d.trainUnitType, pointsInvested: d.trainPoints } : undefined,
    marketExchange: d.marketAmount > 0 ? { from: d.marketFrom, amount: d.marketAmount } : undefined,
    march: d.marchCount > 0 && d.marchDestinationNodeId ? { unitType: d.marchUnitType, count: d.marchCount, destinationNodeId: d.marchDestinationNodeId } : undefined,
    armyStance: d.stanceArmyId && d.stance ? { armyId: d.stanceArmyId, stance: d.stance } : undefined,
    fortify: d.fortifyArmyId ? { armyId: d.fortifyArmyId } : undefined,
  };
}

export function OrderForm({
  roomId,
  city,
  armies,
  actionPointsPerTurn,
  disabled,
  onSubmit,
}: {
  roomId: RoomId;
  city: GameCity;
  armies: Army[];
  actionPointsPerTurn: GameState['actionPointsPerTurn'];
  disabled: boolean;
  onSubmit: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const spent = totalSpent(draft);
  const overBudget = spent > actionPointsPerTurn;
  const adjacentNodeIds = getAdjacentNodeIds(city.nodeId);
  const availableUnitTypes = city.troops.filter((t) => t.count > 0).map((t) => t.unitType);

  // The march unit-type <select> only offers unit types the city actually
  // has. If the drafted value isn't one of them (e.g. still the initial
  // default), keep it in sync -- otherwise the select would visually show a
  // valid-looking option while silently submitting a stale, invalid one.
  useEffect(() => {
    if (availableUnitTypes.length > 0 && !availableUnitTypes.includes(draft.marchUnitType)) {
      setDraft((d) => ({ ...d, marchUnitType: availableUnitTypes[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableUnitTypes.join(',')]);

  function field<K extends keyof Draft>(key: K) {
    return {
      value: draft[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, [key]: Number(e.target.value) }),
    };
  }

  function submit() {
    getSocket().emit('game:submitOrder', { roomId, order: buildOrder(draft) });
    setDraft(EMPTY_DRAFT);
    onSubmit();
  }

  return (
    <div className="card">
      <h2>이번 턴 명령</h2>
      <p className={overBudget ? 'error-text' : 'muted'}>
        사용 포인트: {spent} / {actionPointsPerTurn}
      </p>

      <h3>농업 / 목축업</h3>
      <div className="settings-grid">
        <label>
          농업 투자
          <input type="number" min={0} disabled={disabled} {...field('agriculture')} />
        </label>
        <label>
          목축업 투자
          <input type="number" min={0} disabled={disabled} {...field('animalHusbandry')} />
        </label>
      </div>

      <h3>상업</h3>
      <div className="settings-grid">
        <label>
          교역소
          <input type="number" min={0} disabled={disabled} {...field('tradingPost')} />
        </label>
        <label>
          세무소
          <input type="number" min={0} disabled={disabled} {...field('taxOffice')} />
        </label>
        <label>
          시장
          <input type="number" min={0} disabled={disabled} {...field('market')} />
        </label>
      </div>

      <h3>공업</h3>
      <div className="settings-grid">
        <label>
          군기감
          <input type="number" min={0} disabled={disabled} {...field('armory')} />
        </label>
        <label>
          조병창
          <input type="number" min={0} disabled={disabled} {...field('weaponsWorkshop')} />
        </label>
        <label>
          대장간
          <input type="number" min={0} disabled={disabled} {...field('blacksmith')} />
        </label>
        <label>
          공부
          <input type="number" min={0} disabled={disabled} {...field('publicWorks')} />
        </label>
      </div>

      <h3>시장 거래</h3>
      <div className="settings-grid">
        <label>
          판매할 자원
          <select
            value={draft.marketFrom}
            disabled={disabled}
            onChange={(e) => setDraft({ ...draft, marketFrom: e.target.value as ResourceType })}
          >
            {TRADEABLE_RESOURCES.map((r) => (
              <option key={r} value={r}>
                {RESOURCE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <label>
          판매량 (금으로 교환)
          <input type="number" min={0} disabled={disabled} {...field('marketAmount')} />
        </label>
      </div>

      <h3>징병 / 훈련</h3>
      <div className="settings-grid">
        <label>
          징병 병종
          <select
            value={draft.recruitUnitType}
            disabled={disabled}
            onChange={(e) => setDraft({ ...draft, recruitUnitType: e.target.value as UnitType })}
          >
            {UNIT_TYPES.map((u) => (
              <option key={u} value={u}>
                {UNIT_TYPE_LABEL[u]}
              </option>
            ))}
          </select>
        </label>
        <label>
          징병 인원
          <input type="number" min={0} disabled={disabled} {...field('recruitCount')} />
        </label>
        <label>
          훈련 병종
          <select
            value={draft.trainUnitType}
            disabled={disabled}
            onChange={(e) => setDraft({ ...draft, trainUnitType: e.target.value as UnitType })}
          >
            {UNIT_TYPES.map((u) => (
              <option key={u} value={u}>
                {UNIT_TYPE_LABEL[u]}
              </option>
            ))}
          </select>
        </label>
        <label>
          훈련 포인트
          <input type="number" min={0} disabled={disabled} {...field('trainPoints')} />
        </label>
      </div>

      <h3>행군</h3>
      {availableUnitTypes.length === 0 ? (
        <p className="muted">행군을 보낼 병력이 없습니다.</p>
      ) : (
        <div className="settings-grid">
          <label>
            병종
            <select
              value={draft.marchUnitType}
              disabled={disabled}
              onChange={(e) => setDraft({ ...draft, marchUnitType: e.target.value as UnitType })}
            >
              {availableUnitTypes.map((u) => (
                <option key={u} value={u}>
                  {UNIT_TYPE_LABEL[u]}
                </option>
              ))}
            </select>
          </label>
          <label>
            인원
            <input type="number" min={0} disabled={disabled} {...field('marchCount')} />
          </label>
          <label>
            목적지
            <select
              value={draft.marchDestinationNodeId}
              disabled={disabled}
              onChange={(e) => setDraft({ ...draft, marchDestinationNodeId: e.target.value })}
            >
              <option value="">선택 안 함</option>
              {adjacentNodeIds.map((nodeId) => (
                <option key={nodeId} value={nodeId}>
                  {getMapNode(nodeId)?.name ?? nodeId}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <h3>진형 / 요새</h3>
      {armies.length === 0 ? (
        <p className="muted">보유한 부대가 없습니다.</p>
      ) : (
        <div className="settings-grid">
          <label>
            태세 변경 대상
            <select value={draft.stanceArmyId} disabled={disabled} onChange={(e) => setDraft({ ...draft, stanceArmyId: e.target.value })}>
              <option value="">선택 안 함</option>
              {armies.map((a) => (
                <option key={a.armyId} value={a.armyId}>
                  {armyLabel(a)}
                </option>
              ))}
            </select>
          </label>
          <label>
            태세
            <select value={draft.stance} disabled={disabled} onChange={(e) => setDraft({ ...draft, stance: e.target.value as ArmyStance })}>
              <option value="">선택 안 함</option>
              <option value="defend">{STANCE_LABEL.defend}</option>
              <option value="attack">{STANCE_LABEL.attack}</option>
            </select>
          </label>
          <label>
            요새 구축 대상
            <select value={draft.fortifyArmyId} disabled={disabled} onChange={(e) => setDraft({ ...draft, fortifyArmyId: e.target.value })}>
              <option value="">선택 안 함</option>
              {armies
                .filter((a) => !a.fortified)
                .map((a) => (
                  <option key={a.armyId} value={a.armyId}>
                    {armyLabel(a)}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}

      <button onClick={submit} disabled={disabled || overBudget}>
        {disabled ? '제출 완료' : '명령 제출'}
      </button>
    </div>
  );
}

function armyLabel(army: Army): string {
  const locationName = getMapNode(army.currentNodeId)?.name ?? army.currentNodeId;
  const summary = army.troops.map((t) => `${UNIT_TYPE_LABEL[t.unitType]} ${t.count}`).join(', ');
  return `${locationName}: ${summary}`;
}
