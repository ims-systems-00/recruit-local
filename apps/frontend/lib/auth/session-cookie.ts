// next-auth defaults, options.ts does not override them
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
export const secureCookie =
  process.env.NEXTAUTH_URL?.startsWith('https://') ?? false;
export const SESSION_COOKIE = secureCookie
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token';

// large sessions get split into name.0, name.1, ...
export const isSessionCookie = (name: string) => name.startsWith(SESSION_COOKIE);
