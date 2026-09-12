import { SERVER_URL } from './serverUrl';

export async function fetchSessionToken(persistentPlayerId: string, displayName: string): Promise<{ sessionToken: string; playerId: string }> {
  const res = await fetch(`${SERVER_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persistentPlayerId, displayName }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? '로그인에 실패했습니다');
  }

  return res.json();
}
