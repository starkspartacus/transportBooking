import { type NextRequest, NextResponse } from "next/server";
import { EmployeeAuthService } from "@/lib/employee-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, countryCode, code } = body;

    // Validation des données
    if (!phone || !countryCode || !code) {
      return NextResponse.json(
        { error: "Téléphone, code pays et code d'authentification requis" },
        { status: 400 }
      );
    }

    // Vérifier le code et authentifier l'employé
    const result = await EmployeeAuthService.verifyEmployeeCode(
      phone,
      countryCode,
      code
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Créer la réponse avec le token
    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: "Connexion réussie",
    });

    // Définir le token dans un cookie httpOnly
    response.cookies.set("employee-auth-token", result.token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 heures
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erreur lors de la connexion employé:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
