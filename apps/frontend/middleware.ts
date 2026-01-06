import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
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

  if (!token && url.pathname.startsWith('/recruiter')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
