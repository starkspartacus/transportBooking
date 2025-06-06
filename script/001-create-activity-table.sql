-- Create Activity table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Activity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INFO',
    "userId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Activity_companyId_idx" ON "Activity"("companyId");
CREATE INDEX IF NOT EXISTS "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX IF NOT EXISTS "Activity_createdAt_idx" ON "Activity"("createdAt");

-- Add foreign key constraints
ALTER TABLE "Activity" 
ADD CONSTRAINT "Activity_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Activity" 
ADD CONSTRAINT "Activity_companyId_fkey" 
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add User fields for password reset if they don't exist
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "resetToken" TEXT,
ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

-- Add totalSeats field to Trip if it doesn't exist
ALTER TABLE "Trip" 
ADD COLUMN IF NOT EXISTS "totalSeats" INTEGER DEFAULT 0;
