-- CreateEnum
CREATE TYPE "AnnouncementCategory" AS ENUM ('GENERAL', 'PROMOTION', 'COURSE_UPDATE', 'SYSTEM_MAINTENANCE', 'NEW_FEATURE', 'INSTRUCTOR_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "AnnouncementDisplayType" AS ENUM ('BANNER', 'NOTIFICATION', 'SIDEBAR', 'EMAIL', 'IN_APP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnnouncementType" ADD VALUE 'PUBLIC_USERS';
ALTER TYPE "AnnouncementType" ADD VALUE 'REGISTERED_USERS';
ALTER TYPE "AnnouncementType" ADD VALUE 'PROMOTIONAL';
ALTER TYPE "AnnouncementType" ADD VALUE 'SYSTEM_UPDATE';

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "actionText" TEXT,
ADD COLUMN     "actionUrl" TEXT,
ADD COLUMN     "category" "AnnouncementCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "displayType" "AnnouncementDisplayType" NOT NULL DEFAULT 'IN_APP',
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "sendEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showAsBanner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startsAt" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[];
