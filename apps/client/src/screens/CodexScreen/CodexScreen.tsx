import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GENERAL_ROSTER } from '@sam-simul/shared';
import type { GeneralRole } from '@sam-simul/shared';
import { GeneralPortrait } from '../../components/GameIcons';

const ROLE_LABEL: Record<GeneralRole, string> = { domestic: '내정', combat: '전투' };
const ROLE_FILTERS: (GeneralRole | 'all')[] = ['all', 'domestic', 'combat'];
const ROLE_FILTER_LABEL: Record<GeneralRole | 'all', string> = { all: '전체', domestic: '내정', combat: '전투' };

// A browsable reference of every general that can appear in a game -- not
// gated by what any one room has recruited, since there's no per-account
// persistence to track "discovered" state against. Reachable from the
// lobby since it's a standalone reference, not tied to an active game.
export function CodexScreen() {
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState<GeneralRole | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return GENERAL_ROSTER.filter((g) => (roleFilter === 'all' || g.role === roleFilter) && g.name.includes(query.trim()));
  }, [roleFilter, query]);

  return (
    <div className="screen codex-screen">
      <header className="room-header">
        <h1>장수 도감 ({GENERAL_ROSTER.length}명)</h1>
        <button onClick={() => navigate('/lobby')}>로비로</button>
      </header>

      <div className="card codex-controls">
        <input placeholder="이름 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="codex-role-filters">
          {ROLE_FILTERS.map((r) => (
            <button key={r} className={roleFilter === r ? 'codex-filter-active' : undefined} onClick={() => setRoleFilter(r)}>
              {ROLE_FILTER_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="codex-grid">
        {filtered.map((g) => (
          <div key={g.rosterId} className="card codex-entry">
            <GeneralPortrait general={g} size={48} />
            <div>
              <div className="codex-entry-name">
                {g.name} <span className="muted">({ROLE_LABEL[g.role]})</span>
              </div>
              <div className="muted">
                {g.skill.name} · {g.skill.effectType.includes('Boost') ? `+${Math.round(g.skill.magnitude * 100)}%` : ''} (발동{' '}
                {Math.round(g.skill.triggerChance * 100)}%)
              </div>
              {g.stats && (
                <div className="general-stats muted">
                  통 {g.stats.command} 무 {g.stats.force} 지 {g.stats.intelligence} 정 {g.stats.politics} 매 {g.stats.charm}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="muted">검색 결과가 없습니다.</p>}
    </div>
  );
}
