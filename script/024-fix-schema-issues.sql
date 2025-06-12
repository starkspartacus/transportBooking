-- Fix missing fields in tables

-- Add missing fields to Trip table
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "departureCity" TEXT;
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "arrivalCity" TEXT;

-- Add missing fields to Reservation table  
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "reservationCode" TEXT;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "countryCode" TEXT DEFAULT '+221';

-- Update existing trips to have departure and arrival cities from routes
UPDATE "Trip" 
SET "departureCity" = (
    SELECT "departureCity" FROM "Route" WHERE "Route"."id" = "Trip"."routeId"
),
"arrivalCity" = (
    SELECT "arrivalCity" FROM "Route" WHERE "Route"."id" = "Trip"."routeId"
)
WHERE "departureCity" IS NULL OR "arrivalCity" IS NULL;

-- Generate reservation codes for existing reservations
UPDATE "Reservation" 
SET "reservationCode" = 'RES-' || EXTRACT(EPOCH FROM "createdAt")::bigint || '-' || substr(md5(random()::text), 1, 8)
WHERE "reservationCode" IS NULL;

-- Make reservation code unique
CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_reservationCode_key" ON "Reservation"("reservationCode");

-- Update TripStatus enum if needed
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TripStatus') THEN
        CREATE TYPE "TripStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED', 'PENDING');
    END IF;
END $$;

-- Ensure all trips have a valid status
UPDATE "Trip" SET "status" = 'ACTIVE' WHERE "status" IS NULL;
