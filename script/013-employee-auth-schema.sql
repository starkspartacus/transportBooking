-- Ajouter les nouveaux champs à la table User pour les employés
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hireDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "position" TEXT;

-- Ajouter les paramètres de code d'authentification à la table Company
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "codePrefix" TEXT DEFAULT 'EMP';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "codeLength" INTEGER DEFAULT 6;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "codeValidityDays" INTEGER DEFAULT 30;

-- Créer la table pour les codes d'authentification des employés
CREATE TABLE IF NOT EXISTS "EmployeeAuthCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeAuthCode_pkey" PRIMARY KEY ("id")
);

-- Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_userId_idx" ON "EmployeeAuthCode"("userId");
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_companyId_idx" ON "EmployeeAuthCode"("companyId");
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_code_idx" ON "EmployeeAuthCode"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeAuthCode_code_key" ON "EmployeeAuthCode"("code");

-- Ajouter les contraintes de clé étrangère
ALTER TABLE "EmployeeAuthCode" ADD CONSTRAINT "EmployeeAuthCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeAuthCode" ADD CONSTRAINT "EmployeeAuthCode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Créer la table pour l'historique des connexions employés
CREATE TABLE IF NOT EXISTS "EmployeeLoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "codeUsed" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EmployeeLoginHistory_pkey" PRIMARY KEY ("id")
);

-- Index pour l'historique des connexions
CREATE INDEX IF NOT EXISTS "EmployeeLoginHistory_userId_idx" ON "EmployeeLoginHistory"("userId");
CREATE INDEX IF NOT EXISTS "EmployeeLoginHistory_companyId_idx" ON "EmployeeLoginHistory"("companyId");
CREATE INDEX IF NOT EXISTS "EmployeeLoginHistory_loginAt_idx" ON "EmployeeLoginHistory"("loginAt");

-- Ajouter les contraintes de clé étrangère pour l'historique
ALTER TABLE "EmployeeLoginHistory" ADD CONSTRAINT "EmployeeLoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeLoginHistory" ADD CONSTRAINT "EmployeeLoginHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Afficher les tables créées
SELECT 'Tables créées avec succès:' as message;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('EmployeeAuthCode', 'EmployeeLoginHistory');
