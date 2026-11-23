import { serverApiBaseURL } from '@/lib/http/server-api-base-url';

export type RefreshResult =
  | { accessToken: string; refreshToken: string }
  | 'rejected'
  | 'unavailable';

const REFRESH_BEFORE_SECONDS = 60;
const KEEP_RESULT_MS = 30_000;

const readExp = (jwt: string): number | null => {
  try {
    const payload = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
};

export const accessTokenExpiresSoon = (accessToken: string) => {
  const exp = readExp(accessToken);
  return exp === null || exp - Date.now() / 1000 < REFRESH_BEFORE_SECONDS;
};

const callRefresh = async (refreshToken: string): Promise<RefreshResult> => {
  try {
    const res = await fetch(`${serverApiBaseURL}/auth/refresh-access-token`, {
      headers: {
        Accept: 'application/json',
        'x-auth-refresh-token': refreshToken,
      },
      cache: 'no-store',
    });

    // 4xx means the refresh token is dead, but a rate limit is not a reason to sign out
    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      return 'rejected';
    }
    if (!res.ok) return 'unavailable';

    const session = (await res.json())?.session;
    if (!session?.accessToken || !session?.refreshToken) return 'unavailable';

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  } catch {
    return 'unavailable';
  }
};

// parallel requests with the same refresh token share one call, a second call would count as reuse
const recent = new Map<string, { result: Promise<RefreshResult>; at: number }>();

export const refreshTokens = (refreshToken: string): Promise<RefreshResult> => {
  const now = Date.now();
  for (const [key, entry] of recent) {
    if (now - entry.at > KEEP_RESULT_MS) recent.delete(key);
  }

  const hit = recent.get(refreshToken);
  if (hit) return hit.result;

  const result = callRefresh(refreshToken);
  recent.set(refreshToken, { result, at: now });
  result.then((r) => {
    if (r === 'unavailable') recent.delete(refreshToken);
  });

  return result;
};
