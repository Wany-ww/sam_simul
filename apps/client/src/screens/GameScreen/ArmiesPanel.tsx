import type { Army } from '@sam-simul/shared';
import { UNIT_TYPE_LABEL, getMapNode } from '@sam-simul/shared';

const STANCE_LABEL: Record<Army['stance'], string> = { attack: '공격', defend: '방어' };

export function ArmiesPanel({ armies }: { armies: Army[] }) {
  if (armies.length === 0) return null;

  return (
    <div className="card">
      <h2>부대</h2>
      <ul className="settings-readout">
        {armies.map((army) => {
          const currentName = getMapNode(army.currentNodeId)?.name ?? army.currentNodeId;
          const troopSummary = army.troops.map((t) => `${UNIT_TYPE_LABEL[t.unitType]} ${Math.round(t.count)}명`).join(', ');
          const status = army.destinationNodeId
            ? `${currentName}에서 ${getMapNode(army.destinationNodeId)?.name ?? army.destinationNodeId}(으)로 행군 중 (남은 일수: ${army.daysRemaining})`
            : `${currentName}에 주둔 중`;

          return (
            <li key={army.armyId}>
              {troopSummary} — {status}
              <br />
              <span className="muted">
                사기: {Math.round(army.morale)} · 태세: {STANCE_LABEL[army.stance]}
                {army.fortified ? ' · 요새 구축됨' : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
