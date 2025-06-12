-- Ajouter les types d'activité manquants
DO $$ 
BEGIN
    -- Vérifier si l'enum existe et ajouter les nouvelles valeurs
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'TICKET_SALE' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ActivityType')
    ) THEN
        ALTER TYPE "ActivityType" ADD VALUE 'TICKET_SALE';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'DIRECT_SALE' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ActivityType')
    ) THEN
        ALTER TYPE "ActivityType" ADD VALUE 'DIRECT_SALE';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'CASH_COLLECTION' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ActivityType')
    ) THEN
        ALTER TYPE "ActivityType" ADD VALUE 'CASH_COLLECTION';
    END IF;
    
    RAISE NOTICE 'Activity types added successfully';
END $$;
