-- Mise à jour du schéma Bus pour ajouter les colonnes manquantes
-- Exécuter ce script pour mettre à jour la table Bus existante

-- Ajouter les nouvelles colonnes à la table Bus
ALTER TABLE "Bus" 
ADD COLUMN IF NOT EXISTS "brand" TEXT,
ADD COLUMN IF NOT EXISTS "color" TEXT,
ADD COLUMN IF NOT EXISTS "fuelType" TEXT,
ADD COLUMN IF NOT EXISTS "totalKm" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "technicalInspectionExpiry" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "equipment" TEXT[] DEFAULT '{}';

-- Mettre à jour les valeurs par défaut pour les enregistrements existants
UPDATE "Bus" 
SET 
  "brand" = 'Mercedes' WHERE "brand" IS NULL,
  "color" = 'Blanc' WHERE "color" IS NULL,
  "fuelType" = 'DIESEL' WHERE "fuelType" IS NULL,
  "totalKm" = 0 WHERE "totalKm" IS NULL,
  "equipment" = '{}' WHERE "equipment" IS NULL;

-- Ajouter des contraintes
ALTER TABLE "Bus" 
ALTER COLUMN "brand" SET NOT NULL,
ALTER COLUMN "color" SET NOT NULL,
ALTER COLUMN "fuelType" SET NOT NULL,
ALTER COLUMN "totalKm" SET NOT NULL,
ALTER COLUMN "equipment" SET NOT NULL;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "Bus_brand_idx" ON "Bus"("brand");
CREATE INDEX IF NOT EXISTS "Bus_fuelType_idx" ON "Bus"("fuelType");
CREATE INDEX IF NOT EXISTS "Bus_technicalInspectionExpiry_idx" ON "Bus"("technicalInspectionExpiry");

-- Vérifier la structure mise à jour
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Bus' 
ORDER BY ordinal_position;
