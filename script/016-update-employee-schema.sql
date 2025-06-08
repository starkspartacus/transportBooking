-- Mise à jour du schéma pour les employés avec tous les champs nécessaires

-- Ajouter les colonnes manquantes à la table User si elles n'existent pas
DO $$ 
BEGIN
    -- Informations personnelles étendues
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'firstName') THEN
        ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastName') THEN
        ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'image') THEN
        ALTER TABLE "User" ADD COLUMN "image" TEXT;
    END IF;
    
    -- Contact d'urgence
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'emergencyContact') THEN
        ALTER TABLE "User" ADD COLUMN "emergencyContact" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'emergencyPhone') THEN
        ALTER TABLE "User" ADD COLUMN "emergencyPhone" TEXT;
    END IF;
    
    -- Informations professionnelles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'hireDate') THEN
        ALTER TABLE "User" ADD COLUMN "hireDate" TIMESTAMP(3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'salary') THEN
        ALTER TABLE "User" ADD COLUMN "salary" DOUBLE PRECISION;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'department') THEN
        ALTER TABLE "User" ADD COLUMN "department" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'position') THEN
        ALTER TABLE "User" ADD COLUMN "position" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'notes') THEN
        ALTER TABLE "User" ADD COLUMN "notes" TEXT;
    END IF;
    
    -- Statut utilisateur
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'status') THEN
        ALTER TABLE "User" ADD COLUMN "status" "UserStatus" DEFAULT 'ACTIVE';
    END IF;
END $$;

-- Ajouter le nouveau type d'activité pour l'ajout d'employé
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EMPLOYEE_ADDED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ActivityType')) THEN
        ALTER TYPE "ActivityType" ADD VALUE 'EMPLOYEE_ADDED';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- L'enum existe déjà, on continue
        NULL;
END $$;

-- Créer des index pour améliorer les performances
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_firstName_lastName_idx" ON "User" ("firstName", "lastName");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_department_idx" ON "User" ("department");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_hireDate_idx" ON "User" ("hireDate");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_status_role_idx" ON "User" ("status", "role");

-- Mettre à jour les employés existants pour avoir un firstName et lastName si ils n'en ont pas
UPDATE "User" 
SET 
    "firstName" = SPLIT_PART(name, ' ', 1),
    "lastName" = CASE 
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 
        THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
        ELSE ''
    END
WHERE 
    role IN ('GESTIONNAIRE', 'CAISSIER') 
    AND ("firstName" IS NULL OR "lastName" IS NULL)
    AND name IS NOT NULL;

-- Mettre à jour le statut par défaut pour les employés existants
UPDATE "User" 
SET "status" = 'ACTIVE'
WHERE role IN ('GESTIONNAIRE', 'CAISSIER') AND "status" IS NULL;

COMMIT;
