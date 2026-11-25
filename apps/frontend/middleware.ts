import { NextRequest, NextResponse } from 'next/server';
import { encode, getToken, JWT } from 'next-auth/jwt';
import { ACCOUNT_TYPE_ENUMS } from '@rl/types';
import {
  isPrivateCandidateRoute,
  isPrivateRecruiterRoute,
} from './lib/functions';
import {
  accessTokenExpiresSoon,
  refreshTokens,
} from './lib/auth/refresh-session';
import {
  isSessionCookie,
  secureCookie,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from './lib/auth/session-cookie';
export { default } from 'next-auth/middleware';

export const config = {
  // session endpoint included so it never writes back a stale token
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.png$).*)',
    '/api/auth/session',
  ],
};

const sessionCookieNames = (request: NextRequest) =>
  request.cookies
    .getAll()
    .map(({ name }) => name)
    .filter(isSessionCookie);

export async function middleware(request: NextRequest) {
  let token = await getToken({
    req: request,
    cookieName: SESSION_COOKIE,
    secureCookie,
  });
  let refreshedCookie: string | null = null;
  let sessionExpired = false;

  if (
    token?.accessToken &&
    token.refreshToken &&
    accessTokenExpiresSoon(token.accessToken)
  ) {
    const result = await refreshTokens(token.refreshToken, request.headers);

    if (result === 'rejected') {
      sessionExpired = true;
      token = null;
    } else if (result !== 'unavailable') {
      token = { ...token, ...result };
      refreshedCookie = await encode({
        token,
        secret: process.env.NEXTAUTH_SECRET!,
        maxAge: SESSION_MAX_AGE,
      });
    }
  }

  // forward the change so pages and actions in this request see it too
  const staleNames = sessionCookieNames(request);
  if (refreshedCookie || sessionExpired) {
    staleNames.forEach((name) => request.cookies.delete(name));
  }
  if (refreshedCookie) request.cookies.set(SESSION_COOKIE, refreshedCookie);

  const response = route(request, token, sessionExpired);

  if (refreshedCookie || sessionExpired) {
    staleNames
      .filter((name) => name !== SESSION_COOKIE)
      .forEach((name) => response.cookies.delete(name));
  }
  if (refreshedCookie) {
    response.cookies.set(SESSION_COOKIE, refreshedCookie, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: secureCookie,
      maxAge: SESSION_MAX_AGE,
    });
  } else if (sessionExpired) {
    response.cookies.delete(SESSION_COOKIE);
  }

  return response;
}

function route(
  request: NextRequest,
  token: JWT | null,
  sessionExpired: boolean,
) {
  const url = request.nextUrl;

  // a server action can't follow a redirect, let it fail and the client handles it
  if (sessionExpired && request.headers.has('next-action')) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  // Redirect to dashboard if the user is already authenticated
  // and trying to access sign-in, sign-up, or home page
  if (
    token &&
    (url.pathname.startsWith('/login') || url.pathname.startsWith('/sign-up'))
  ) {
    return NextResponse.redirect(new URL('/system-preparation', request.url));
  }

  // if (
  //   !token &&
  //   (url.pathname.startsWith('/recruiter') ||
  //     url.pathname.startsWith('/candidate'))
  // ) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  if (
    token &&
    !token.user?.tenantId &&
    !token.user?.jobProfileId &&
    (isPrivateRecruiterRoute(url.pathname) ||
      isPrivateCandidateRoute(url.pathname))
  ) {
    if (token?.user?.type === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
      return NextResponse.redirect(
        new URL('/recruiter/onboarding/create-organization', request.url),
      );
    }

    if (token?.user?.type === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
      return NextResponse.redirect(
        new URL('/candidate/onboarding/personalisation', request.url),
      );
    }
  }

  if (
    !token &&
    (url.pathname.startsWith('/recruiter') ||
      url.pathname.startsWith('/candidate'))
  ) {
    const loginUrl = new URL('/login', request.url);

    const redirectPath = url.pathname + url.search;

    loginUrl.searchParams.set('redirect', redirectPath);
    if (sessionExpired) loginUrl.searchParams.set('expired', '1');

    return NextResponse.redirect(loginUrl);
  }

  if (!token && url.pathname.startsWith('/system-preparation')) {
    return NextResponse.redirect(new URL('/logout', request.url));
  }
  return NextResponse.next({ request: { headers: request.headers } });
}
