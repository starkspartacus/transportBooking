import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
        countryCode: { label: "Country Code", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const isEmail = credentials.identifier.includes("@");

        let user;
        if (isEmail) {
          user = await prisma.user.findUnique({
            where: { email: credentials.identifier },
          });
        } else {
          user = await prisma.user.findUnique({
            where: {
              phone_countryCode: {
                phone: credentials.identifier,
                countryCode: credentials.countryCode || "+1",
              },
            },
          });
        }

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Return a user object that matches the expected User type
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone || undefined, // Convert null to undefined
          countryCode: user.countryCode || undefined, // Convert null to undefined
          companyId: user.companyId || undefined, // Convert null to undefined
          image: user.image || undefined, // Add image property expected by NextAuth
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.countryCode = user.countryCode;
        token.companyId = user.companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string | undefined;
        session.user.countryCode = token.countryCode as string | undefined;
        session.user.companyId = token.companyId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    // signUp: "/auth/signup", // Removing this line as it's not supported in NextAuth's PagesOptions
  },
};
