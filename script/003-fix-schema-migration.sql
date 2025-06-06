-- Script pour corriger les problèmes de migration

-- 1. Créer une nouvelle table pour TripStatusUpdate avec le nouvel enum
CREATE TABLE IF NOT EXISTS "TripStatusUpdate_new" (
  "id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "TripStatusUpdate_new_pkey" PRIMARY KEY ("id")
);

-- 2. Copier les données de l'ancienne table vers la nouvelle
INSERT INTO "TripStatusUpdate_new" ("id", "status", "createdAt")
SELECT "id", 
  CASE 
    WHEN "status" = 'IN_TRANSIT' THEN 'DEPARTED'
    ELSE "status"::TEXT 
  END,
  "createdAt"
FROM "TripStatusUpdate";

-- 3. Supprimer l'ancienne table
DROP TABLE IF EXISTS "TripStatusUpdate" CASCADE;

-- 4. Renommer la nouvelle table
ALTER TABLE "TripStatusUpdate_new" RENAME TO "TripStatusUpdate";

-- 5. Mettre à jour les contraintes et index si nécessaire
CREATE INDEX IF NOT EXISTS "TripStatusUpdate_status_idx" ON "TripStatusUpdate"("status");
CREATE INDEX IF NOT EXISTS "TripStatusUpdate_createdAt_idx" ON "TripStatusUpdate"("createdAt");
