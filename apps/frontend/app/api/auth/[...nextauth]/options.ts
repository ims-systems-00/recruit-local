import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { loginUser } from '@/services/auth/auth.server';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('INVALID_INPUT');
        }

        try {
          const response = await loginUser({
            email: credentials.email,
            password: credentials.password,
          });

          if (!response.success) {
            throw new Error('INVALID_CREDENTIALS');
          }

          const user = response?.data?.user;

          if (!user?.accessToken) return null;

          return {
            id: user.id,
            _id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            emailVerificationStatus: user.emailVerificationStatus,
            type: user.type,
            accessToken: user?.accessToken,
            refreshToken: user?.refreshToken,
          };
        } catch (err) {
          console.error('Login failed', err);
          return null;
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          emailVerificationStatus: user.emailVerificationStatus,
          type: user.type,
        };
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = token.user as any;
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
