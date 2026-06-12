import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Dev credentials provider — allows instant login without Google OAuth
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = credentials.email as string;
        const password = credentials.password as string;

        // Find user in database
        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          throw new Error("UserNotFound");
        }

        // If the user registered via Google OAuth and has no password
        if (!user.password) {
          throw new Error("OAuthAccount");
        }

        // Verify the password hash
        const { verifyPassword } = await import("./hash");
        const isValid = verifyPassword(password, user.password);
        if (!isValid) {
          throw new Error("InvalidPassword");
        }

        return user;
      },
    }),
    // Google OAuth — ready when credentials are configured
    ...(process.env.AUTH_GOOGLE_ID
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
