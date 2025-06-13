-- AlterTable
ALTER TABLE "Trip" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "boardingStartTime" TIMESTAMP(3),
ADD COLUMN "boardingEndTime" TIMESTAMP(3);

-- AddIndex
CREATE INDEX "Trip_isArchived_idx" ON "Trip"("isArchived");

-- AlterEnum
-- Add new values to NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'TRIP_STATUS';

-- Add new values to ActivityType
ALTER TYPE "ActivityType" ADD VALUE 'TRIP_STATUS_UPDATE';
ALTER TYPE "ActivityType" ADD VALUE 'TRIP_ARCHIVED';
