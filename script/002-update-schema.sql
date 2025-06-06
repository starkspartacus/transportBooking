-- Migration pour ajouter les nouveaux champs au schéma existant

-- Ajouter les nouveaux champs à la table Bus
ALTER TABLE "buses" 
ADD COLUMN IF NOT EXISTS "brand" TEXT,
ADD COLUMN IF NOT EXISTS "year" INTEGER,
ADD COLUMN IF NOT EXISTS "color" TEXT,
ADD COLUMN IF NOT EXISTS "fuelType" TEXT,
ADD COLUMN IF NOT EXISTS "insuranceExpiry" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "technicalControlExpiry" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "features" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Ajouter les nouveaux champs à la table Company
ALTER TABLE "companies"
ADD COLUMN IF NOT EXISTS "operatingCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "vehicleTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "primaryRoutes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "businessHours" JSONB,
ADD COLUMN IF NOT EXISTS "socialMedia" JSONB,
ADD COLUMN IF NOT EXISTS "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Ajouter les nouveaux champs à la table Route
ALTER TABLE "routes"
ADD COLUMN IF NOT EXISTS "intermediateStops" JSONB[] DEFAULT ARRAY[]::JSONB[],
ADD COLUMN IF NOT EXISTS "routeType" TEXT DEFAULT 'DOMESTIC',
ADD COLUMN IF NOT EXISTS "difficulty" TEXT DEFAULT 'EASY',
ADD COLUMN IF NOT EXISTS "scenicRating" INTEGER DEFAULT 3;

-- Ajouter les nouveaux champs à la table Trip
ALTER TABLE "trips"
ADD COLUMN IF NOT EXISTS "basePrice" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "currentPrice" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "boardingTime" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "arrivalDelay" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT,
ADD COLUMN IF NOT EXISTS "weatherConditions" TEXT,
ADD COLUMN IF NOT EXISTS "driverNotes" TEXT;

-- Mettre à jour les valeurs par défaut pour les champs existants
UPDATE "buses" SET 
  "brand" = 'Non spécifié' WHERE "brand" IS NULL,
  "year" = 2020 WHERE "year" IS NULL,
  "fuelType" = 'DIESEL' WHERE "fuelType" IS NULL,
  "insuranceExpiry" = NOW() + INTERVAL '1 year' WHERE "insuranceExpiry" IS NULL,
  "technicalControlExpiry" = NOW() + INTERVAL '1 year' WHERE "technicalControlExpiry" IS NULL;

UPDATE "trips" SET 
  "basePrice" = 10000 WHERE "basePrice" IS NULL,
  "currentPrice" = "basePrice" WHERE "currentPrice" IS NULL;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "idx_companies_operating_countries" ON "companies" USING GIN ("operatingCountries");
CREATE INDEX IF NOT EXISTS "idx_companies_services" ON "companies" USING GIN ("services");
CREATE INDEX IF NOT EXISTS "idx_buses_features" ON "buses" USING GIN ("features");
CREATE INDEX IF NOT EXISTS "idx_routes_type" ON "routes" ("routeType");
CREATE INDEX IF NOT EXISTS "idx_trips_base_price" ON "trips" ("basePrice");
CREATE INDEX IF NOT EXISTS "idx_trips_departure_time" ON "trips" ("departureTime");
