import "next-auth";
import type { DefaultSession } from "next-auth";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id */
      id: string;
      /** The user's role */
      role: string;
      /** The user's phone number */
      phone?: string;
      /** The user's country code */
      countryCode?: string;
      /** The user's company ID */
      companyId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole | string;
    phone?: string;
    countryCode?: string;
    companyId?: string;
  }
}

// Extend JWT type to include our custom properties
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    phone?: string;
    countryCode?: string;
    companyId?: string;
  }
}
