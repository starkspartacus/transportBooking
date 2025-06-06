import "next-auth";
import type { DefaultSession } from "next-auth";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      phone?: string;
      countryCode?: string;
      companyId?: string;
      activeCompanyId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    phone?: string;
    countryCode?: string;
    companyId?: string;
    activeCompanyId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    phone?: string;
    countryCode?: string;
    companyId?: string;
    activeCompanyId?: string;
  }
}
