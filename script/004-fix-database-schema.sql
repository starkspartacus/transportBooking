-- Corriger les problèmes de schéma de base de données

-- 1. Ajouter les champs manquants dans la table Bus si ils n'existent pas
DO $$ 
BEGIN
    -- Ajouter brand si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Bus' AND column_name = 'brand') THEN
        ALTER TABLE "Bus" ADD COLUMN "brand" TEXT NOT NULL DEFAULT 'Non spécifié';
    END IF;
    
    -- Ajouter mileage comme alias pour totalKm si nécessaire
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Bus' AND column_name = 'mileage') THEN
        -- Nous utiliserons totalKm comme mileage dans l'API
        NULL;
    END IF;
END $$;

-- 2. Vérifier et corriger les relations Payment
-- S'assurer que les paiements ont bien une relation avec company
DO $$
BEGIN
    -- Vérifier si la colonne companyId existe dans Payment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'companyId') THEN
        ALTER TABLE "Payment" ADD COLUMN "companyId" TEXT;
        
        -- Ajouter la contrainte de clé étrangère
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        
        -- Mettre à jour les paiements existants avec companyId basé sur la réservation
        UPDATE "Payment" 
        SET "companyId" = (
            SELECT r."companyId" 
            FROM "Reservation" r 
            WHERE r."id" = "Payment"."reservationId"
        )
        WHERE "reservationId" IS NOT NULL;
    END IF;
END $$;

-- 3. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "idx_payment_company_status" ON "Payment"("companyId", "status");
CREATE INDEX IF NOT EXISTS "idx_bus_company_status" ON "Bus"("companyId", "status");
CREATE INDEX IF NOT EXISTS "idx_route_company_status" ON "Route"("companyId", "status");
CREATE INDEX IF NOT EXISTS "idx_trip_company_departure" ON "Trip"("companyId", "departureTime");

-- 4. Nettoyer les données orphelines si nécessaire
-- Supprimer les paiements sans companyId (si ils existent)
DELETE FROM "Payment" WHERE "companyId" IS NULL;

-- 5. Ajouter des contraintes NOT NULL après nettoyage
DO $$
BEGIN
    -- Rendre companyId obligatoire dans Payment
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'companyId' AND is_nullable = 'YES') THEN
        ALTER TABLE "Payment" ALTER COLUMN "companyId" SET NOT NULL;
    END IF;
END $$;

-- 6. Mettre à jour les statistiques
ANALYZE "Payment";
ANALYZE "Bus";
ANALYZE "Route";
ANALYZE "Trip";
ANALYZE "Company";
