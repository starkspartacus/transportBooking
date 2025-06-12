-- Create EmployeeAuthCode table
CREATE TABLE IF NOT EXISTS "EmployeeAuthCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeAuthCode_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_employeeId_idx" ON "EmployeeAuthCode"("employeeId");
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_code_idx" ON "EmployeeAuthCode"("code");
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_phone_countryCode_idx" ON "EmployeeAuthCode"("phone", "countryCode");
CREATE INDEX IF NOT EXISTS "EmployeeAuthCode_expiresAt_idx" ON "EmployeeAuthCode"("expiresAt");

-- Add foreign key constraint
ALTER TABLE "EmployeeAuthCode" ADD CONSTRAINT "EmployeeAuthCode_employeeId_fkey" 
FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Clean up expired codes (optional)
DELETE FROM "EmployeeAuthCode" WHERE "expiresAt" < NOW();

COMMIT;
