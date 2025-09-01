-- DropIndex
DROP INDEX "CoursePricing_courseId_pricingId_key";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "thumbnail" TEXT;
