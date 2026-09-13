import { useEffect, useState } from 'react';
import type { BattleLogEntry } from '@sam-simul/shared';

const OUTCOME_LABEL: Record<BattleLogEntry['outcome'], string> = { ongoing: '계속 진행 중', won: '승리', lost: '패배' };
const BATTLE_TYPE_LABEL: Record<BattleLogEntry['battleType'], string> = { field: '회전', siege: '공성' };

// A log-based, client-side replay (per the roadmap's resolution of "client
// replay vs server streaming"): steps through the deterministic day-by-day
// snapshots the server already computed, rather than any sprite/motion
// animation -- there's no art pipeline to animate against yet.
export function BattleReplay({ entry }: { entry: BattleLogEntry }) {
  const [dayIndex, setDayIndex] = useState(entry.dayLog.length - 1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (dayIndex >= entry.dayLog.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setDayIndex((d) => d + 1), 600);
    return () => clearTimeout(timer);
  }, [playing, dayIndex, entry.dayLog.length]);

  if (entry.dayLog.length === 0) return null;

  const snapshot = entry.dayLog[dayIndex];
  const maxTroops = Math.max(entry.dayLog[0].attackerTroops, entry.dayLog[0].defenderTroops, 1);
  const myTroops = entry.role === 'attacker' ? snapshot.attackerTroops : snapshot.defenderTroops;
  const opponentTroops = entry.role === 'attacker' ? snapshot.defenderTroops : snapshot.attackerTroops;
  const myMorale = entry.role === 'attacker' ? snapshot.attackerMorale : snapshot.defenderMorale;
  const opponentMorale = entry.role === 'attacker' ? snapshot.defenderMorale : snapshot.attackerMorale;

  function replay() {
    setDayIndex(0);
    setPlaying(true);
  }

  return (
    <div className="battle-replay">
      <p className="muted">
        {BATTLE_TYPE_LABEL[entry.battleType]} — {OUTCOME_LABEL[entry.outcome]} (총 {entry.daysFought}일)
      </p>

      <div className="battle-bar-row">
        <span>아군 {Math.round(myTroops)}명 (사기 {Math.round(myMorale)})</span>
        <div className="battle-bar">
          <div className="battle-bar-fill battle-bar-mine" style={{ width: `${Math.min(100, (myTroops / maxTroops) * 100)}%` }} />
        </div>
      </div>
      <div className="battle-bar-row">
        <span>
          적군 {Math.round(opponentTroops)}명 (사기 {Math.round(opponentMorale)})
        </span>
        <div className="battle-bar">
          <div className="battle-bar-fill battle-bar-enemy" style={{ width: `${Math.min(100, (opponentTroops / maxTroops) * 100)}%` }} />
        </div>
      </div>
      {snapshot.wallDurability !== undefined && <p className="muted">성벽 내구도: {Math.round(snapshot.wallDurability)}</p>}

      <div className="battle-replay-controls">
        <input
          type="range"
          min={0}
          max={entry.dayLog.length - 1}
          value={dayIndex}
          onChange={(e) => {
            setPlaying(false);
            setDayIndex(Number(e.target.value));
          }}
        />
        <span className="muted">
          {dayIndex + 1}일차 / {entry.dayLog.length}일
        </span>
        <button onClick={replay} disabled={playing}>
          처음부터 재생
        </button>
      </div>
    </div>
  );
}
