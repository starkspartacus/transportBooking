-- Ajouter les nouveaux champs pour les employés
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "firstName" TEXT,
ADD COLUMN IF NOT EXISTS "lastName" TEXT,
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "commune" TEXT,
ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "gender" TEXT,
ADD COLUMN IF NOT EXISTS "idNumber" TEXT,
ADD COLUMN IF NOT EXISTS "idType" TEXT,
ADD COLUMN IF NOT EXISTS "idExpiryDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyPhone" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyRelation" TEXT,
ADD COLUMN IF NOT EXISTS "employeeNotes" TEXT,
ADD COLUMN IF NOT EXISTS "education" TEXT,
ADD COLUMN IF NOT EXISTS "skills" TEXT[],
ADD COLUMN IF NOT EXISTS "languages" TEXT[],
ADD COLUMN IF NOT EXISTS "bankName" TEXT,
ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT,
ADD COLUMN IF NOT EXISTS "bankAccountName" TEXT,
ADD COLUMN IF NOT EXISTS "salary" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "hireDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "nationality" TEXT,
ADD COLUMN IF NOT EXISTS "department" TEXT,
ADD COLUMN IF NOT EXISTS "position" TEXT;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "User_firstName_idx" ON "User"("firstName");
CREATE INDEX IF NOT EXISTS "User_lastName_idx" ON "User"("lastName");
CREATE INDEX IF NOT EXISTS "User_department_idx" ON "User"("department");
CREATE INDEX IF NOT EXISTS "User_position_idx" ON "User"("position");
CREATE INDEX IF NOT EXISTS "User_nationality_idx" ON "User"("nationality");
CREATE INDEX IF NOT EXISTS "User_hireDate_idx" ON "User"("hireDate");
CREATE INDEX IF NOT EXISTS "User_idNumber_idx" ON "User"("idNumber");

-- Ajouter des contraintes pour les énumérations
ALTER TABLE "User" 
ADD CONSTRAINT "User_gender_check" CHECK ("gender" IN ('MALE', 'FEMALE', 'OTHER') OR "gender" IS NULL),
ADD CONSTRAINT "User_idType_check" CHECK ("idType" IN ('NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'OTHER') OR "idType" IS NULL);

-- Mettre à jour les utilisateurs existants pour séparer firstName et lastName
UPDATE "User" 
SET 
  "firstName" = SPLIT_PART("name", ' ', 1),
  "lastName" = CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY("name", ' '), 1) > 1 
    THEN SUBSTRING("name" FROM LENGTH(SPLIT_PART("name", ' ', 1)) + 2)
    ELSE NULL
  END
WHERE "firstName" IS NULL AND "name" IS NOT NULL;

-- Commentaires pour documenter les nouveaux champs
COMMENT ON COLUMN "User"."firstName" IS 'Prénom de l''employé';
COMMENT ON COLUMN "User"."lastName" IS 'Nom de famille de l''employé';
COMMENT ON COLUMN "User"."address" IS 'Adresse complète de l''employé';
COMMENT ON COLUMN "User"."city" IS 'Ville de résidence';
COMMENT ON COLUMN "User"."commune" IS 'Commune de résidence';
COMMENT ON COLUMN "User"."dateOfBirth" IS 'Date de naissance';
COMMENT ON COLUMN "User"."gender" IS 'Genre (MALE, FEMALE, OTHER)';
COMMENT ON COLUMN "User"."idNumber" IS 'Numéro de pièce d''identité';
COMMENT ON COLUMN "User"."idType" IS 'Type de pièce d''identité';
COMMENT ON COLUMN "User"."idExpiryDate" IS 'Date d''expiration de la pièce d''identité';
COMMENT ON COLUMN "User"."emergencyContact" IS 'Nom du contact d''urgence';
COMMENT ON COLUMN "User"."emergencyPhone" IS 'Téléphone du contact d''urgence';
COMMENT ON COLUMN "User"."emergencyRelation" IS 'Relation avec le contact d''urgence';
COMMENT ON COLUMN "User"."employeeNotes" IS 'Notes et commentaires sur l''employé';
COMMENT ON COLUMN "User"."education" IS 'Formation et diplômes';
COMMENT ON COLUMN "User"."skills" IS 'Compétences (tableau de chaînes)';
COMMENT ON COLUMN "User"."languages" IS 'Langues parlées (tableau de chaînes)';
COMMENT ON COLUMN "User"."bankName" IS 'Nom de la banque';
COMMENT ON COLUMN "User"."bankAccountNumber" IS 'Numéro de compte bancaire';
COMMENT ON COLUMN "User"."bankAccountName" IS 'Nom sur le compte bancaire';
COMMENT ON COLUMN "User"."salary" IS 'Salaire en FCFA';
COMMENT ON COLUMN "User"."hireDate" IS 'Date d''embauche';
COMMENT ON COLUMN "User"."nationality" IS 'Code de nationalité';
COMMENT ON COLUMN "User"."department" IS 'Département de travail';
COMMENT ON COLUMN "User"."position" IS 'Poste occupé';
