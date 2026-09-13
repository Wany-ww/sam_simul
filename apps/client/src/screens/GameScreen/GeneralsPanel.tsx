import type { General } from '@sam-simul/shared';

const ROLE_LABEL: Record<General['role'], string> = { domestic: '내정', combat: '전투' };

function assignmentLabel(general: General): string {
  if (!general.assignment) return '대기 중';
  if (general.assignment.kind === 'garrison') return '수비대 배정';
  if (general.assignment.kind === 'facility') {
    const facilityLabel: Record<string, string> = { agriculture: '농업', animalHusbandry: '목축업', commerce: '상업', industry: '공업' };
    return `${facilityLabel[general.assignment.facility]} 배정`;
  }
  return '부대 배정';
}

// Placeholder avatar derived deterministically from portraitSeed -- no real
// pixel-art pipeline exists yet (flagged as an open question in the
// roadmap); a colored initial badge is an honest stand-in until one does.
function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function GeneralAvatar({ general }: { general: General }) {
  return (
    <span
      className="general-avatar"
      style={{ backgroundColor: avatarColor(general.portraitSeed) }}
      title={general.name}
    >
      {general.name.charAt(0)}
    </span>
  );
}

export function GeneralsPanel({ generals }: { generals: General[] }) {
  if (generals.length === 0) return null;

  return (
    <div className="card">
      <h2>장수</h2>
      <ul className="settings-readout general-list">
        {generals.map((g) => (
          <li key={g.generalId}>
            <GeneralAvatar general={g} />
            <span>
              {g.name} ({ROLE_LABEL[g.role]}) — {g.skill.name} (발동 {Math.round(g.skill.triggerChance * 100)}%)
            </span>
            <span className="muted"> · {assignmentLabel(g)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
