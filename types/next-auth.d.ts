import "next-auth";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: UserRole;
      companyId?: string;
      ownedCompanies?: any[];
      employeeAt?: any;
      phone?: string | null;
      countryCode?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: UserRole;
    companyId?: string;
    ownedCompanies?: any[];
    employeeAt?: any;
    phone?: string | null;
    countryCode?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    picture?: string;
    role: UserRole;
    companyId?: string;
    ownedCompanies?: any[];
    employeeAt?: any;
    phone?: string | null;
    countryCode?: string | null;
  }
}
