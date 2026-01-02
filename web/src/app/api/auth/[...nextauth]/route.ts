import NextAuth, { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persister l'ID Discord dans le token
      if (account && profile) {
        token.discordId = (profile as any).id;
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Ajouter l'ID Discord à la session
      if (session.user) {
        (session.user as any).discordId = token.discordId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
