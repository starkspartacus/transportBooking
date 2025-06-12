-- Add QR code fields to tickets table
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "qrCode" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "qrCodeData" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "usedAt" TIMESTAMP(3);
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "usedBy" TEXT;

-- Add payment reference to reservations for mobile money tracking
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "paymentReference" TEXT;

-- Create index for faster QR lookups
CREATE INDEX IF NOT EXISTS "Ticket_qrCode_idx" ON "Ticket"("qrCode");
CREATE INDEX IF NOT EXISTS "Reservation_paymentReference_idx" ON "Reservation"("paymentReference");

-- Add new activity types
UPDATE "Activity" SET "type" = 'PAYMENT_INITIATED' WHERE "type" = 'PAYMENT_INITIATED';
UPDATE "Activity" SET "type" = 'PAYMENT_COMPLETED' WHERE "type" = 'PAYMENT_COMPLETED';
UPDATE "Activity" SET "type" = 'PAYMENT_FAILED' WHERE "type" = 'PAYMENT_FAILED';
UPDATE "Activity" SET "type" = 'TICKET_VALIDATED' WHERE "type" = 'TICKET_VALIDATED';
UPDATE "Activity" SET "type" = 'TICKET_SALE' WHERE "type" = 'TICKET_SALE';
