import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";

// IMPORTANT: Use POSTGRES_URL_NON_POOLING (not the pgbouncer URL) for pg.Pool.
// The pgbouncer URL (POSTGRES_PRISMA_URL) runs in transaction mode and doesn't
// support persistent named prepared statements that pg.Pool requires.
// Using the pooling URL causes: ERROR: prepared statement "s1" already exists.
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    // Inject user.id into the session — not included by default in Auth.js v5
    async session({ session, user }) {
      if (session.user && user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});

// Extend the Session type so TypeScript knows about user.id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
