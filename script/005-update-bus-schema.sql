-- Mise à jour du schéma Bus pour correspondre au modèle Prisma simplifié

-- Supprimer les colonnes qui n'existent pas dans le nouveau schéma
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "brand";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "color";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "fuelType";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "features";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "totalKm";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "amenities";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "driverAssigned";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "currentLocation";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "gpsEnabled";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "gpsDeviceId";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "fuelEfficiency";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "maintenanceHistory";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "accidentHistory";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "maintenanceCosts";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "fuelCosts";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "revenueGenerated";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "seatMap";
ALTER TABLE "Bus" DROP COLUMN IF EXISTS "hasAccessibility";

-- Modifier les colonnes existantes pour correspondre au schéma
ALTER TABLE "Bus" ALTER COLUMN "year" DROP NOT NULL;
ALTER TABLE "Bus" ALTER COLUMN "lastMaintenance" DROP NOT NULL;
ALTER TABLE "Bus" ALTER COLUMN "nextMaintenance" DROP NOT NULL;
ALTER TABLE "Bus" ALTER COLUMN "insuranceExpiry" DROP NOT NULL;
ALTER TABLE "Bus" ALTER COLUMN "technicalControlExpiry" DROP NOT NULL;

-- Ajouter la colonne mileage si elle n'existe pas
ALTER TABLE "Bus" ADD COLUMN IF NOT EXISTS "mileage" INTEGER DEFAULT 0;

-- Mettre à jour les valeurs par défaut
UPDATE "Bus" SET "mileage" = 0 WHERE "mileage" IS NULL;

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS "Bus_companyId_idx" ON "Bus"("companyId");
CREATE INDEX IF NOT EXISTS "Bus_status_idx" ON "Bus"("status");
CREATE INDEX IF NOT EXISTS "Bus_plateNumber_idx" ON "Bus"("plateNumber");

-- Nettoyer les données orphelines
DELETE FROM "Bus" WHERE "companyId" NOT IN (SELECT "id" FROM "Company");

COMMIT;
