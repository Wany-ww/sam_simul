import type { TurnLogEntry } from '@sam-simul/shared';
import { BattleReplay } from './BattleReplay';

export function TurnLogPanel({ entry }: { entry: TurnLogEntry | undefined }) {
  if (!entry) return null;

  return (
    <div className="card">
      <h2>지난 턴 결과</h2>
      {entry.notes.length === 0 ? (
        <p className="muted">특별한 변화가 없었습니다.</p>
      ) : (
        <ul className="settings-readout">
          {entry.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      )}

      {entry.battles.map((battle, i) => (
        <BattleReplay key={i} entry={battle} />
      ))}
    </div>
  );
}
