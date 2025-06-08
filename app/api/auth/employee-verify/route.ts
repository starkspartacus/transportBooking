import { type NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token du header Authorization
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier le token
    const decoded = verify(
      token,
      process.env.NEXTAUTH_SECRET || "employee-auth-secret"
    ) as {
      id: string;
      email: string;
      name: string;
      role: string;
      companyId: string;
    };

    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        employeeAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: "Utilisateur non trouvé" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est toujours un employé actif
    if (
      !["GESTIONNAIRE", "CAISSIER"].includes(user.role) ||
      user.status !== "ACTIVE" ||
      !user.companyId
    ) {
      return NextResponse.json(
        { authenticated: false, error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        company: user.employeeAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, error: "Token invalide" },
      { status: 401 }
    );
  }
}
