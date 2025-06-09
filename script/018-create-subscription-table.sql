-- Create subscription table
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'BASIC',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "paymentMethod" TEXT,
    "paymentDate" TIMESTAMP(3),
    "paymentReference" TEXT,
    "transactionId" TEXT,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Subscription_companyId_idx" ON "Subscription"("companyId");
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_transactionId_idx" ON "Subscription"("transactionId");

-- Add unique constraint on transactionId
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_transactionId_key" ON "Subscription"("transactionId");

-- Add foreign key constraints
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add subscription fields to Company table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Company' AND column_name = 'subscriptionStatus') THEN
        ALTER TABLE "Company" ADD COLUMN "subscriptionStatus" TEXT DEFAULT 'PENDING';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Company' AND column_name = 'subscriptionExpiryDate') THEN
        ALTER TABLE "Company" ADD COLUMN "subscriptionExpiryDate" TIMESTAMP(3);
    END IF;
END $$;

-- Update existing companies to have BASIC subscription by default
UPDATE "Company" 
SET "subscriptionTier" = 'BASIC', "subscriptionStatus" = 'ACTIVE'
WHERE "subscriptionTier" IS NULL OR "subscriptionStatus" IS NULL;
