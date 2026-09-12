import { useEffect, useState } from 'react';
import type { RoomId, RoomSettings } from '@sam-simul/shared';
import { getSocket } from '../../net/socket';

const MAP_SIZE_LABEL: Record<RoomSettings['mapSize'], string> = { small: '소', medium: '중', large: '대' };
const TIER_LABEL: Record<string, string> = { none: '없음', low: '낮음', normal: '보통', high: '높음' };

export function RoomSettingsPanel({ roomId, settings, isHost }: { roomId: RoomId; settings: RoomSettings; isHost: boolean }) {
  const [draft, setDraft] = useState(settings);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  useEffect(() => {
    if (!dirty) setDraft(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  function save() {
    getSocket().emit('room:updateSettings', { roomId, settings: draft });
  }

  if (!isHost) {
    return (
      <div className="card">
        <h2>방 설정</h2>
        <SettingsReadout settings={settings} />
      </div>
    );
  }

  return (
    <div className="card">
      <h2>방 설정 (호스트)</h2>
      <div className="settings-grid">
        <label>
          턴 시간(초)
          <input
            type="number"
            min={30}
            max={900}
            value={draft.turnTimeLimitSeconds}
            onChange={(e) => setDraft({ ...draft, turnTimeLimitSeconds: Number(e.target.value) })}
          />
        </label>
        <label>
          최대 인원
          <input
            type="number"
            min={2}
            max={8}
            value={draft.maxPlayers}
            onChange={(e) => setDraft({ ...draft, maxPlayers: Number(e.target.value) })}
          />
        </label>
        <label>
          맵 크기
          <select value={draft.mapSize} onChange={(e) => setDraft({ ...draft, mapSize: e.target.value as RoomSettings['mapSize'] })}>
            <option value="small">소</option>
            <option value="medium">중</option>
            <option value="large">대</option>
          </select>
        </label>
        <label>
          재난 빈도
          <select
            value={draft.disasterFrequency}
            onChange={(e) => setDraft({ ...draft, disasterFrequency: e.target.value as RoomSettings['disasterFrequency'] })}
          >
            <option value="none">없음</option>
            <option value="low">낮음</option>
            <option value="normal">보통</option>
            <option value="high">높음</option>
          </select>
        </label>
        <label>
          장수 등장 확률
          <select
            value={draft.generalAppearanceProbability}
            onChange={(e) => setDraft({ ...draft, generalAppearanceProbability: e.target.value as RoomSettings['generalAppearanceProbability'] })}
          >
            <option value="low">낮음</option>
            <option value="normal">보통</option>
            <option value="high">높음</option>
          </select>
        </label>
        <label>
          이벤트 발생 확률
          <select
            value={draft.eventProbability}
            onChange={(e) => setDraft({ ...draft, eventProbability: e.target.value as RoomSettings['eventProbability'] })}
          >
            <option value="low">낮음</option>
            <option value="normal">보통</option>
            <option value="high">높음</option>
          </select>
        </label>
      </div>
      <button onClick={save} disabled={!dirty}>
        {dirty ? '설정 저장' : '저장됨'}
      </button>
    </div>
  );
}

function SettingsReadout({ settings }: { settings: RoomSettings }) {
  return (
    <ul className="settings-readout">
      <li>턴 시간: {settings.turnTimeLimitSeconds}초</li>
      <li>최대 인원: {settings.maxPlayers}명</li>
      <li>맵 크기: {MAP_SIZE_LABEL[settings.mapSize]}</li>
      <li>재난 빈도: {TIER_LABEL[settings.disasterFrequency]}</li>
      <li>장수 등장 확률: {TIER_LABEL[settings.generalAppearanceProbability]}</li>
      <li>이벤트 발생 확률: {TIER_LABEL[settings.eventProbability]}</li>
    </ul>
  );
}
