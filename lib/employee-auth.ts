import { prisma } from "@/lib/prisma";
import { sign } from "jsonwebtoken";

export class EmployeeAuthService {
  // Générer un code d'authentification unique
  static async generateEmployeeCode(
    employeeId: string,
    companyId: string
  ): Promise<string> {
    // Générer un code de 6 caractères alphanumériques (sans caractères ambigus)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "EMP";

    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Vérifier l'unicité du code en cherchant dans la description
    const existingCode = await prisma.activity.findFirst({
      where: {
        description: {
          contains: code,
        },
        companyId: companyId,
      },
    });

    // Si le code existe déjà, en générer un nouveau
    if (existingCode) {
      return this.generateEmployeeCode(employeeId, companyId);
    }

    return code;
  }

  // Vérifier un code d'authentification
  static async verifyEmployeeCode(
    phone: string,
    countryCode: string,
    code: string
  ) {
    try {
      // Chercher l'employé par téléphone
      const employee = await prisma.user.findFirst({
        where: {
          phone: phone,
          countryCode: countryCode,
          role: { in: ["GESTIONNAIRE", "CAISSIER"] },
          status: "ACTIVE",
        },
        include: {
          employeeAt: true,
        },
      });

      if (!employee || !employee.companyId) {
        return { success: false, error: "Employé non trouvé ou inactif" };
      }

      // Chercher le code dans les activités récentes (derniers 30 jours)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const codeActivity = await prisma.activity.findFirst({
        where: {
          description: {
            contains: code,
          },
          companyId: employee.companyId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
          userId: employee.id, // Chercher par userId au lieu de metadata
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!codeActivity) {
        return { success: false, error: "Code invalide ou expiré" };
      }

      // Vérifier que l'activité contient bien le code de l'employé
      if (!codeActivity.description.includes(employee.id)) {
        return { success: false, error: "Code non valide pour cet employé" };
      }

      // Générer un token JWT pour la session
      const token = sign(
        {
          id: employee.id,
          email: employee.email,
          name: employee.name,
          role: employee.role,
          companyId: employee.companyId,
        },
        process.env.NEXTAUTH_SECRET || "employee-auth-secret",
        { expiresIn: "8h" }
      );

      // Enregistrer la connexion
      await prisma.activity.create({
        data: {
          type: "COMPANY_UPDATED", // Utiliser un type existant
          description: `Connexion employé: ${employee.name} (${employee.phone}) avec code ${code}`,
          status: "SUCCESS",
          userId: employee.id,
          companyId: employee.companyId,
        },
      });

      return {
        success: true,
        token,
        user: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          companyId: employee.companyId,
          company: employee.employeeAt,
        },
      };
    } catch (error) {
      console.error("Erreur lors de la vérification du code:", error);
      return { success: false, error: "Erreur interne du serveur" };
    }
  }
}
