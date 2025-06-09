-- Ajouter des index pour améliorer les performances des requêtes de sécurité

-- Index pour les recherches par pays et email
CREATE INDEX IF NOT EXISTS idx_users_country_email ON "User" (country, email) WHERE status = 'ACTIVE';

-- Index pour les recherches par pays et téléphone
CREATE INDEX IF NOT EXISTS idx_users_country_phone ON "User" (country, phone, "countryCode") WHERE status = 'ACTIVE';

-- Index pour les activités de connexion
CREATE INDEX IF NOT EXISTS idx_activities_login_type ON "Activity" (type, "createdAt") WHERE type = 'USER_LOGIN';

-- Index pour les tentatives de connexion par IP
CREATE INDEX IF NOT EXISTS idx_activities_ip_address ON "Activity" ("ipAddress", "createdAt") WHERE "ipAddress" IS NOT NULL;

-- Index pour les métadonnées des activités
CREATE INDEX IF NOT EXISTS idx_activities_metadata ON "Activity" USING gin (metadata) WHERE metadata IS NOT NULL;

-- Ajouter une contrainte pour s'assurer que le pays est toujours défini pour les utilisateurs actifs
ALTER TABLE "User" ADD CONSTRAINT check_active_user_has_country 
CHECK (status != 'ACTIVE' OR country IS NOT NULL);

-- Ajouter une table pour les tentatives de connexion suspectes
CREATE TABLE IF NOT EXISTS "SuspiciousLogin" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "ipAddress" TEXT NOT NULL,
  "userAgent" TEXT,
  "attemptedEmail" TEXT,
  "attemptedPhone" TEXT,
  country TEXT,
  reason TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "blockedUntil" TIMESTAMP
);

-- Index pour les connexions suspectes
CREATE INDEX IF NOT EXISTS idx_suspicious_login_ip ON "SuspiciousLogin" ("ipAddress", "createdAt");
CREATE INDEX IF NOT EXISTS idx_suspicious_login_blocked ON "SuspiciousLogin" ("blockedUntil") WHERE "blockedUntil" IS NOT NULL;
