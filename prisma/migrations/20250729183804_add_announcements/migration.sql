-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('ALL_USERS', 'COURSE_STUDENTS', 'INSTRUCTORS', 'SPECIFIC_ROLES', 'SPECIFIC_USERS');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('P1', 'P2', 'P3');

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL,
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'P3',
    "courseId" TEXT,
    "targetRoles" TEXT[],
    "targetUserIds" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
