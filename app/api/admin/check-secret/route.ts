import { NextResponse, type NextRequest } from "next/server";

// Clé secrète pour l'enregistrement admin (devrait être dans les variables d'environnement)
const ADMIN_SECRET_KEY =
  process.env.ADMIN_SECRET_KEY || "admin_secret_key_very_secure_and_complex";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secretKey } = body;

    // Vérifier la clé secrète
    if (secretKey !== ADMIN_SECRET_KEY) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("Error checking secret key:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
