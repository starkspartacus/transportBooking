-- Update PaymentStatus enum
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'FAILED';

-- Update ActivityType enum
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'PAYMENT_INITIATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'PAYMENT_COMPLETED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'PAYMENT_FAILED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'TICKET_GENERATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'TICKET_VALIDATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'MOBILE_MONEY_PAYMENT';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CASH_PAYMENT';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CARD_PAYMENT';

-- Update ActivityStatus enum
ALTER TYPE "ActivityStatus" ADD VALUE IF NOT EXISTS 'FAILED';

-- Create TicketStatus enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "TicketStatus" AS ENUM ('VALID', 'USED', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create PaymentMethod enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS "tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "passengerName" TEXT NOT NULL,
    "passengerPhone" TEXT NOT NULL,
    "passengerEmail" TEXT,
    "seatNumber" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'VALID',
    "qrCode" TEXT,
    "qrHash" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "userId" TEXT,
    "tripId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reservationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "reservationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "tickets_ticketNumber_key" ON "tickets"("ticketNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_reference_key" ON "payments"("reference");

-- Add foreign key constraints
ALTER TABLE "tickets" ADD CONSTRAINT IF NOT EXISTS "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT IF NOT EXISTS "tickets_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT IF NOT EXISTS "tickets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT IF NOT EXISTS "tickets_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT IF NOT EXISTS "payments_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT IF NOT EXISTS "payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add paymentReference column to reservations if it doesn't exist
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "paymentReference" TEXT;

-- Create index for paymentReference
CREATE INDEX IF NOT EXISTS "reservations_paymentReference_idx" ON "reservations"("paymentReference");
