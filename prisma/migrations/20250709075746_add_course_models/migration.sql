/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Material` table. All the data in the column will be lost.
  - Added the required column `instructorId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Material` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_courseId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "createdBy",
DROP COLUMN "image",
ADD COLUMN     "instructorId" TEXT NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "description",
DROP COLUMN "order",
DROP COLUMN "videoUrl",
ADD COLUMN     "content" TEXT;

-- AlterTable
ALTER TABLE "Material" DROP COLUMN "link",
DROP COLUMN "name",
DROP COLUMN "type",
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
