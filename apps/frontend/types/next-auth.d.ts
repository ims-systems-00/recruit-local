import { DefaultSession } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

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

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      fullName: string;
      email: string;
      emailVerificationStatus: boolean;
      type: string;
    };
    accessToken: string;
    refreshToken: string;
  }
}
