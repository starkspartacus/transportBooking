import { NextResponse, type NextRequest } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Clé secrète pour l'enregistrement admin (devrait être dans les variables d'environnement)
const ADMIN_SECRET_KEY =
  process.env.ADMIN_SECRET_KEY || "admin_secret_key_very_secure_and_complex";

// Schéma de validation pour l'enregistrement admin
const adminRegisterSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(10, "Le mot de passe doit contenir au moins 10 caractères"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  secretKey: z.string().min(1, "Clé secrète requise"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, secretKey } =
      adminRegisterSchema.parse(body);

    // Vérifier la clé secrète
    if (secretKey !== ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { message: "Clé secrète invalide" },
        { status: 403 }
      );
    }

    // Vérifier si un utilisateur avec cet email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await hash(password, 10);

    // Créer l'utilisateur admin
    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        type: "SYSTEM_UPDATE",
        description: `Nouvel administrateur créé: ${name} (${email})`,
        status: "SUCCESS",
        companyId: "system", // ID système pour les activités admin
      },
    });

    // Créer une alerte système
    await prisma.systemAlert.create({
      data: {
        type: "SYSTEM_UPDATE",
        title: "Nouvel administrateur",
        description: `Un nouvel administrateur a été créé: ${name} (${email})`,
        severity: "HIGH",
        resolved: false,
      },
    });

    // Exclure le mot de passe de la réponse
    const { password: _, ...adminWithoutPassword } = newAdmin;

    return NextResponse.json(
      {
        message: "Administrateur créé avec succès",
        user: adminWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Données invalides", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
