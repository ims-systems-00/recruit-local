import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { loginUser, logoutUser } from '@/services/auth/auth.server';

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
            role: user.role,
            tenantId: user.tenantId,
            jobProfileId: user.jobProfileId,
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.user = {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          emailVerificationStatus: user.emailVerificationStatus,
          type: user.type,
          role: user.role,
          tenantId: user.tenantId,
          jobProfileId: user.jobProfileId,
        };
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }

      if (trigger === 'update' && session?.user) {
        token.user = {
          ...token.user,
          ...session.user,
        };
      }

      return token;
    },

    async session({ session, token }) {
      session.user = token.user;
      return session;
    },
  },

  events: {
    // end the backend session too, signOut alone only clears our cookie
    async signOut({ token }) {
      if (!token?.accessToken || !token?.refreshToken) return;

      const res = await logoutUser(token.accessToken, token.refreshToken);
      if (!res.success) console.error('Backend logout failed', res.message);
    },
  },

  pages: {
    signIn: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
