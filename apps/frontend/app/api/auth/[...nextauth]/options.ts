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
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // ✅ Use your loginUser function instead of direct axios
          const data = await loginUser({
            email: credentials.email,
            password: credentials.password,
          });

          if (!data?.user?.accessToken) return null;

          return {
            id: data.user.id,
            _id: data.user.id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            fullName: data.user.fullName,
            email: data.user.email,
            emailVerificationStatus: data.user.emailVerificationStatus,
            type: data.user.type,
            accessToken: data.user?.accessToken,
            refreshToken: data.user?.refreshToken,
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
