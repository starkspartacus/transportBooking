-- Vérifier les valeurs actuelles de l'enum TripStatus
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'tripstatus' 
        AND 'ACTIVE' = ANY(enum_range(NULL::tripstatus)::text[])
    ) THEN
        -- Ajouter ACTIVE à l'enum TripStatus s'il n'existe pas
        ALTER TYPE "TripStatus" ADD VALUE 'ACTIVE' AFTER 'SCHEDULED';
    END IF;
END$$;

-- Vérifier si la colonne reservationCode existe dans la table Reservation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservation' 
        AND column_name = 'reservationcode'
    ) THEN
        -- Ajouter la colonne reservationCode
        ALTER TABLE "Reservation" ADD COLUMN "reservationCode" TEXT;
        
        -- Générer des codes pour les réservations existantes
        UPDATE "Reservation" 
        SET "reservationCode" = CONCAT('RES-', EXTRACT(EPOCH FROM "createdAt")::text, '-', SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8))
        WHERE "reservationCode" IS NULL;
        
        -- Rendre la colonne non nullable
        ALTER TABLE "Reservation" ALTER COLUMN "reservationCode" SET NOT NULL;
    END IF;
END$$;

-- Vérifier si la colonne countryCode existe dans la table Reservation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservation' 
        AND column_name = 'countrycode'
    ) THEN
        -- Ajouter la colonne countryCode
        ALTER TABLE "Reservation" ADD COLUMN "countryCode" TEXT DEFAULT '+221';
    END IF;
END$$;

-- Vérifier si les colonnes departureCity et arrivalCity existent dans la table Trip
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trip' 
        AND column_name = 'departurecity'
    ) THEN
        -- Ajouter la colonne departureCity
        ALTER TABLE "Trip" ADD COLUMN "departureCity" TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trip' 
        AND column_name = 'arrivalcity'
    ) THEN
        -- Ajouter la colonne arrivalCity
        ALTER TABLE "Trip" ADD COLUMN "arrivalCity" TEXT;
    END IF;
END$$;

-- Mettre à jour les colonnes departureCity et arrivalCity pour les voyages existants
UPDATE "Trip" t
SET 
    "departureCity" = r."departureLocation",
    "arrivalCity" = r."arrivalLocation"
FROM "Route" r
WHERE t."routeId" = r.id AND (t."departureCity" IS NULL OR t."arrivalCity" IS NULL);
