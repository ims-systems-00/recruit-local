import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      fullName: string;
      email: string;
      emailVerificationStatus: boolean;
      type: string;
    } & DefaultSession['user'];

    accessToken: string;
    refreshToken: string;
  }

  interface User {
    _id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    emailVerificationStatus: boolean;
    type: string;
    accessToken: string;
    refreshToken: string;
  }
}
