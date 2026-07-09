import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ACCOUNT_TYPE_ENUMS } from '@rl/types';
import {
  isPrivateCandidateRoute,
  isPrivateRecruiterRoute,
} from './lib/functions';
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;

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

    return NextResponse.redirect(loginUrl);
  }

  if (!token && url.pathname.startsWith('/system-preparation')) {
    return NextResponse.redirect(new URL('/logout', request.url));
  }
  return NextResponse.next();
}
