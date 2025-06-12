import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { UserRole } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        phone: { label: "Phone", type: "text" },
        countryCode: { label: "Country Code", type: "text" },
        code: { label: "Access Code", type: "text" },
        role: { label: "Role", type: "text" },
        country: { label: "Country", type: "text" },
        ipAddress: { label: "IP Address", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null

        try {
          // Connexion avec code d'accès (pour employés - pas de vérification pays)
          if (credentials.phone && credentials.code && credentials.role) {
            const employee = await prisma.user.findFirst({
              where: {
                phone: credentials.phone,
                countryCode: credentials.countryCode,
                role: credentials.role as UserRole,
                status: "ACTIVE",
              },
              include: {
                employeeAt: true,
              },
            })

            if (!employee || !employee.companyId) return null

            // Vérifier le code dans les activités
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            const codeActivity = await prisma.activity.findFirst({
              where: {
                description: { contains: credentials.code },
                companyId: employee.companyId,
                createdAt: { gte: thirtyDaysAgo },
                userId: employee.id,
              },
            })

            if (!codeActivity) return null

            // Enregistrer la connexion réussie
            try {
              await prisma.activity.create({
                data: {
                  type: "USER_LOGIN",
                  description: `Connexion réussie: ${employee.name || "Utilisateur"} (${employee.role})`,
                  status: "SUCCESS",
                  userId: employee.id,
                  companyId: employee.companyId,
                },
              })
            } catch (logError) {
              console.error("Failed to log successful login:", logError)
              // Continue même si le log échoue
            }

            return {
              id: employee.id,
              email: employee.email || "",
              name: employee.name || "Utilisateur",
              role: employee.role,
              companyId: employee.companyId || undefined,
              employeeAt: employee.employeeAt,
            }
          }

          // Connexion classique avec vérification du pays (sauf pour caissiers)
          if (credentials.password && credentials.country) {
            let user = null

            // Connexion par email
            if (credentials.email) {
              user = await prisma.user.findFirst({
                where: {
                  email: credentials.email,
                  country: credentials.country, // Vérification du pays
                  status: "ACTIVE",
                },
                include: {
                  ownedCompanies: true,
                  employeeAt: true,
                },
              })
            }
            // Connexion par téléphone
            else if (credentials.phone && credentials.countryCode) {
              user = await prisma.user.findFirst({
                where: {
                  phone: credentials.phone,
                  countryCode: credentials.countryCode,
                  country: credentials.country, // Vérification du pays
                  status: "ACTIVE",
                },
                include: {
                  ownedCompanies: true,
                  employeeAt: true,
                },
              })
            }

            if (!user) return null

            const isPasswordValid = await bcrypt.compare(credentials.password, user.password || "")

            if (!isPasswordValid) return null

            // Enregistrer la tentative de connexion réussie
            try {
              // Utiliser le companyId de l'utilisateur ou "system" si pas de companyId
              const logCompanyId = user.companyId || user.ownedCompanies?.[0]?.id || null

              if (logCompanyId) {
                await prisma.activity.create({
                  data: {
                    type: "USER_LOGIN",
                    description: `Connexion sécurisée réussie depuis ${
                      credentials.country
                    }: ${user.name || "Utilisateur"} (${user.role})`,
                    status: "SUCCESS",
                    userId: user.id,
                    companyId: logCompanyId,
                    metadata: {
                      loginMethod: credentials.email ? "email" : "phone",
                      country: credentials.country,
                      ipAddress: credentials.ipAddress || "unknown",
                    },
                  },
                })
              }
            } catch (logError) {
              console.error("Failed to log successful login:", logError)
              // Continue même si le log échoue
            }

            return {
              id: user.id,
              email: user.email || "",
              name: user.name || "Utilisateur",
              role: user.role,
              companyId: user.companyId || undefined,
              ownedCompanies: user.ownedCompanies,
              employeeAt: user.employeeAt,
            }
          }

          return null
        } catch (error) {
          console.error("Auth error:", error)

          // Enregistrer la tentative de connexion échouée (optionnel, sans bloquer)
          if (credentials.email || credentials.phone) {
            try {
              // Créer une activité système sans companyId obligatoire
              await prisma.activity.create({
                data: {
                  type: "USER_LOGIN",
                  description: `Tentative de connexion échouée depuis ${
                    credentials.country || "unknown"
                  }: ${credentials.email || credentials.phone}`,
                  status: "ERROR",
                  // Pas de companyId pour éviter l'erreur de contrainte
                  metadata: {
                    error: error instanceof Error ? error.message : "Unknown error",
                    country: credentials.country,
                    loginMethod: credentials.email ? "email" : "phone",
                  },
                },
              })
            } catch (logError) {
              console.error("Failed to log failed login attempt:", logError)
              // Ignorer l'erreur de log pour ne pas bloquer l'authentification
            }
          }

          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.companyId = user.companyId
        token.ownedCompanies = user.ownedCompanies
        token.employeeAt = user.employeeAt
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.companyId = token.companyId as string
        session.user.ownedCompanies = token.ownedCompanies as any[]
        session.user.employeeAt = token.employeeAt as any
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
}
