-- Création des tables pour l'authentification des employés

-- Table pour les codes d'authentification des employés
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

-- Table pour l'historique des connexions des employés
CREATE TABLE IF NOT EXISTS "EmployeeLoginHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "codeUsed" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmployeeLoginHistory_pkey" PRIMARY KEY ("id")
);

-- Ajout des contraintes de clé étrangère
ALTER TABLE "EmployeeAuthCode" ADD CONSTRAINT "EmployeeAuthCode_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeAuthCode" ADD CONSTRAINT "EmployeeAuthCode_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeLoginHistory" ADD CONSTRAINT "EmployeeLoginHistory_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeLoginHistory" ADD CONSTRAINT "EmployeeLoginHistory_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ajout d'index pour améliorer les performances
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeAuthCode_code_key" ON "EmployeeAuthCode"("code");
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_userId_idx" ON "EmployeeAuthCode"("userId");
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_companyId_idx" ON "EmployeeAuthCode"("companyId");
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_isActive_idx" ON "EmployeeAuthCode"("isActive");
CREATE INDEX IF NOT EXISTS "EmployeeLoginHistory_userId_idx" ON "EmployeeLoginHistory"("userId");
CREATE INDEX IF NOT EXISTS "EmployeeLoginHistory_companyId_idx" ON "EmployeeLoginHistory"("companyId");
CREATE INDEX IF NOT EXISTS "EmployeeLoginHistory_loginAt_idx" ON "EmployeeLoginHistory"("loginAt");

-- Ajout des champs pour les employés dans la table User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hireDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "position" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "employeeCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "employeeCodeExpiresAt" TIMESTAMP(3);

-- Ajout des champs de configuration des codes dans la table Company
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "codePrefix" TEXT DEFAULT 'EMP';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "codeLength" INTEGER DEFAULT 6;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "codeValidityDays" INTEGER DEFAULT 30;

-- Afficher les tables créées
SELECT 'Tables créées avec succès!' as message;
