// Étendre les types Prisma pour inclure les nouvelles valeurs d'enum
import type { Prisma } from "@prisma/client";

// Étendre ActivityType pour inclure les nouvelles valeurs
declare global {
  namespace PrismaJson {
    type ActivityTypeExtended =
      | Prisma.ActivityTypeCreateInput["type"]
      | "COMPANY_SWITCHED"
      | "EMPLOYEE_TRANSFERRED";
  }
}

// Cette déclaration permet d'utiliser les nouvelles valeurs avant la mise à jour du client Prisma
declare module "@prisma/client" {
  interface ActivityType {
    COMPANY_SWITCHED: "COMPANY_SWITCHED";
    EMPLOYEE_TRANSFERRED: "EMPLOYEE_TRANSFERRED";
  }
}
