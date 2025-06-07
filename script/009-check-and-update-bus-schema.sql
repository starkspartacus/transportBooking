-- Script pour vérifier et mettre à jour le schéma Bus de manière sécurisée
-- Ce script vérifie d'abord si les colonnes existent avant de les ajouter

-- Fonction pour ajouter une colonne seulement si elle n'existe pas
DO $$
BEGIN
    -- Ajouter la colonne brand si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Bus' AND column_name = 'brand') THEN
        ALTER TABLE "Bus" ADD COLUMN "brand" TEXT;
        UPDATE "Bus" SET "brand" = 'Mercedes' WHERE "brand" IS NULL;
        ALTER TABLE "Bus" ALTER COLUMN "brand" SET NOT NULL;
    END IF;

    -- Ajouter la colonne color si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Bus' AND column_name = 'color') THEN
        ALTER TABLE "Bus" ADD COLUMN "color" TEXT;
        UPDATE "Bus" SET "color" = 'Blanc' WHERE "color" IS NULL;
        ALTER TABLE "Bus" ALTER COLUMN "color" SET NOT NULL;
    END IF;

    -- Ajouter la colonne fuelType si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Bus' AND column_name = 'fuelType') THEN
        ALTER TABLE "Bus" ADD COLUMN "fuelType" TEXT;
        UPDATE "Bus" SET "fuelType" = 'DIESEL' WHERE "fuelType" IS NULL;
        ALTER TABLE "Bus" ALTER COLUMN "fuelType" SET NOT NULL;
    END IF;

    -- Ajouter la colonne totalKm si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Bus' AND column_name = 'totalKm') THEN
        ALTER TABLE "Bus" ADD COLUMN "totalKm" INTEGER;
        UPDATE "Bus" SET "totalKm" = COALESCE("mileage", 0) WHERE "totalKm" IS NULL;
        ALTER TABLE "Bus" ALTER COLUMN "totalKm" SET NOT NULL;
        ALTER TABLE "Bus" ALTER COLUMN "totalKm" SET DEFAULT 0;
    END IF;

    -- Ajouter la colonne technicalInspectionExpiry si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Bus' AND column_name = 'technicalInspectionExpiry') THEN
        ALTER TABLE "Bus" ADD COLUMN "technicalInspectionExpiry" TIMESTAMP(3);
        UPDATE "Bus" SET "technicalInspectionExpiry" = "technicalControlExpiry" WHERE "technicalInspectionExpiry" IS NULL;
    END IF;

    -- Ajouter la colonne equipment si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Bus' AND column_name = 'equipment') THEN
        ALTER TABLE "Bus" ADD COLUMN "equipment" TEXT[];
        UPDATE "Bus" SET "equipment" = '{}' WHERE "equipment" IS NULL;
        ALTER TABLE "Bus" ALTER COLUMN "equipment" SET NOT NULL;
        ALTER TABLE "Bus" ALTER COLUMN "equipment" SET DEFAULT '{}';
    END IF;

END $$;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "Bus_brand_idx" ON "Bus"("brand");
CREATE INDEX IF NOT EXISTS "Bus_fuelType_idx" ON "Bus"("fuelType");
CREATE INDEX IF NOT EXISTS "Bus_technicalInspectionExpiry_idx" ON "Bus"("technicalInspectionExpiry");

-- Afficher la structure mise à jour
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'Bus' 
ORDER BY ordinal_position;

-- Compter les bus existants
SELECT COUNT(*) as total_buses FROM "Bus";
