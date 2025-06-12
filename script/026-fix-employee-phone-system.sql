-- Correction du système de téléphone des employés
-- Ajout des champs manquants et correction des contraintes

-- Ajouter les champs manquants dans la table User si ils n'existent pas
DO $$ 
BEGIN
    -- Vérifier et ajouter countryCode si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'countryCode') THEN
        ALTER TABLE "User" ADD COLUMN "countryCode" TEXT;
    END IF;
    
    -- Vérifier et ajouter phone si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'phone') THEN
        ALTER TABLE "User" ADD COLUMN "phone" TEXT;
    END IF;
END $$;

-- Mettre à jour la contrainte unique pour phone + countryCode
DROP INDEX IF EXISTS "User_phone_countryCode_key";
CREATE UNIQUE INDEX "User_phone_countryCode_key" ON "User"("phone", "countryCode") 
WHERE "phone" IS NOT NULL AND "countryCode" IS NOT NULL;

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone") WHERE "phone" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "User_countryCode_idx" ON "User"("countryCode") WHERE "countryCode" IS NOT NULL;

-- Ajouter la table de codes d'authentification employé si elle n'existe pas
CREATE TABLE IF NOT EXISTS "EmployeeAuthCode" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "code" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "EmployeeAuthCode_employeeId_fkey" 
        FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index pour la table EmployeeAuthCode
CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeAuthCode_code_key" ON "EmployeeAuthCode"("code");
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_phone_countryCode_idx" ON "EmployeeAuthCode"("phone", "countryCode");
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_employeeId_idx" ON "EmployeeAuthCode"("employeeId");
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_expiresAt_idx" ON "EmployeeAuthCode"("expiresAt");

-- Ajouter la table de fidélité client
CREATE TABLE IF NOT EXISTS "ClientLoyalty" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'BRONZE',
    "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ClientLoyalty_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index pour la table ClientLoyalty
CREATE UNIQUE INDEX IF NOT EXISTS "ClientLoyalty_userId_key" ON "ClientLoyalty"("userId");
CREATE INDEX IF NOT EXISTS "ClientLoyalty_level_idx" ON "ClientLoyalty"("level");
CREATE INDEX IF NOT EXISTS "ClientLoyalty_points_idx" ON "ClientLoyalty"("points");

-- Ajouter la table des récompenses de fidélité
CREATE TABLE IF NOT EXISTS "LoyaltyReward" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointsCost" INTEGER NOT NULL,
    "discountPercentage" DECIMAL(5,2),
    "discountAmount" DECIMAL(10,2),
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUsage" INTEGER,
    "currentUsage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour la table LoyaltyReward
CREATE INDEX IF NOT EXISTS "LoyaltyReward_pointsCost_idx" ON "LoyaltyReward"("pointsCost");
CREATE INDEX IF NOT EXISTS "LoyaltyReward_isActive_idx" ON "LoyaltyReward"("isActive");

-- Insérer des récompenses de fidélité par défaut
INSERT INTO "LoyaltyReward" ("name", "description", "pointsCost", "discountPercentage", "validityDays") 
VALUES 
    ('Réduction 5%', 'Réduction de 5% sur votre prochain voyage', 100, 5.00, 30),
    ('Réduction 10%', 'Réduction de 10% sur votre prochain voyage', 200, 10.00, 30),
    ('Réduction 15%', 'Réduction de 15% sur votre prochain voyage', 350, 15.00, 30),
    ('Voyage gratuit', 'Un voyage gratuit jusqu\'à 10,000 FCFA', 500, NULL, 60)
ON CONFLICT DO NOTHING;

-- Ajouter la table des récompenses utilisées
CREATE TABLE IF NOT EXISTS "UserLoyaltyReward" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "pointsUsed" INTEGER NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UserLoyaltyReward_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserLoyaltyReward_rewardId_fkey" 
        FOREIGN KEY ("rewardId") REFERENCES "LoyaltyReward"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index pour la table UserLoyaltyReward
CREATE INDEX IF NOT EXISTS "UserLoyaltyReward_userId_idx" ON "UserLoyaltyReward"("userId");
CREATE INDEX IF NOT EXISTS "UserLoyaltyReward_rewardId_idx" ON "UserLoyaltyReward"("rewardId");
CREATE INDEX IF NOT EXISTS "UserLoyaltyReward_isUsed_idx" ON "UserLoyaltyReward"("isUsed");
CREATE INDEX IF NOT EXISTS "UserLoyaltyReward_expiresAt_idx" ON "UserLoyaltyReward"("expiresAt");

COMMIT;
