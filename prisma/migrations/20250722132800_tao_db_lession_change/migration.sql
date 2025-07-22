-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "lessonId" TEXT;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
