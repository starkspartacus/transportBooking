import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
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
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const isEmail = credentials.identifier.includes("@");

        try {
          let user;
          if (isEmail) {
            user = await prisma.user.findUnique({
              where: { email: credentials.identifier },
            });
          } else {
            user = await prisma.user.findFirst({
              where: {
                phone: credentials.identifier,
                countryCode: credentials.countryCode || "+1",
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

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone || undefined,
            countryCode: user.countryCode || undefined,
            companyId: user.companyId || undefined,
            activeCompanyId: user.activeCompanyId || undefined,
            image: user.image || undefined,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone || undefined;
        token.countryCode = user.countryCode || undefined;
        token.companyId = user.companyId || undefined;
        token.activeCompanyId = user.activeCompanyId || undefined;
      }

      // Handle Google OAuth
      if (account?.provider === "google" && user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.phone = dbUser.phone || undefined;
            token.countryCode = dbUser.countryCode || undefined;
            token.companyId = dbUser.companyId || undefined;
            token.activeCompanyId = dbUser.activeCompanyId || undefined;
          }
        } catch (error) {
          console.error("Error fetching user from database:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.phone = token.phone;
        session.user.countryCode = token.countryCode;
        session.user.companyId = token.companyId;
        session.user.activeCompanyId = token.activeCompanyId;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Handle Google OAuth sign-in
      if (account?.provider === "google" && user?.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // Create new user for Google OAuth
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || "",
                image: user.image,
                role: "CLIENT", // Default role for new Google users
              },
            });
          }
          return true;
        } catch (error) {
          console.error("Error handling Google sign-in:", error);
          return false;
        }
      }

      return true;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
      try {
        await prisma.activity.create({
          data: {
            type: "USER_LOGIN",
            description: `User ${user.email} logged in`,
            status: "SUCCESS",
            userId: user.id,
            companyId: "system",
          },
        });
      } catch (error) {
        console.error("Error creating activity log:", error);
      }
    },
  },
};
