-- Créer la table Bus si elle n'existe pas
CREATE TABLE IF NOT EXISTS "Bus" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "capacity" INTEGER,
    "color" TEXT,
    "fuelType" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "totalKm" INTEGER DEFAULT 0,
    "insuranceExpiry" TIMESTAMP(3),
    "technicalInspectionExpiry" TIMESTAMP(3),
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
    "equipment" TEXT[],
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bus_pkey" PRIMARY KEY ("id")
);

-- Créer un index unique sur le numéro d'immatriculation
CREATE UNIQUE INDEX IF NOT EXISTS "Bus_plateNumber_key" ON "Bus"("plateNumber");

-- Créer un index sur companyId pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS "Bus_companyId_idx" ON "Bus"("companyId");

-- Ajouter la contrainte de clé étrangère si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Bus_companyId_fkey'
    ) THEN
        ALTER TABLE "Bus" ADD CONSTRAINT "Bus_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Insérer quelques données de test si la table est vide
INSERT INTO "Bus" (
    "id", 
    "plateNumber", 
    "brand", 
    "model", 
    "year", 
    "capacity", 
    "color", 
    "fuelType", 
    "status", 
    "totalKm", 
    "companyId",
    "createdAt",
    "updatedAt"
)
SELECT 
    'bus_' || generate_random_uuid()::text,
    'TEST-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
    CASE (ROW_NUMBER() OVER()) % 3
        WHEN 1 THEN 'Mercedes'
        WHEN 2 THEN 'Volvo'
        ELSE 'Scania'
    END,
    CASE (ROW_NUMBER() OVER()) % 3
        WHEN 1 THEN 'Sprinter'
        WHEN 2 THEN 'Tourismo'
        ELSE 'Irizar'
    END,
    2020 + (ROW_NUMBER() OVER()) % 4,
    40 + (ROW_NUMBER() OVER()) % 20,
    CASE (ROW_NUMBER() OVER()) % 4
        WHEN 1 THEN 'Blanc'
        WHEN 2 THEN 'Bleu'
        WHEN 3 THEN 'Rouge'
        ELSE 'Vert'
    END,
    'Diesel',
    'ACTIVE',
    50000 + (ROW_NUMBER() OVER()) * 10000,
    c.id,
    NOW(),
    NOW()
FROM generate_series(1, 3) AS s
CROSS JOIN (
    SELECT id FROM "Company" LIMIT 1
) AS c
WHERE NOT EXISTS (SELECT 1 FROM "Bus" LIMIT 1);
