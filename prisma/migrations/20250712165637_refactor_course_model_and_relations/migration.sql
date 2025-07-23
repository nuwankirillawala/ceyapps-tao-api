/*
  Warnings:

  - Added the required column `courseDuration` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Level" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('BARTENDING', 'MIXOLOGY', 'COCKTAILS', 'WINE', 'BEER');

-- AlterTable
-- First add the columns as nullable
ALTER TABLE "Course" ADD COLUMN     "category" "Category" DEFAULT 'BARTENDING',
ADD COLUMN     "courseDuration" TEXT,
ADD COLUMN     "level" "Level" DEFAULT 'BEGINNER';

-- Update existing records to have default values
UPDATE "Course" SET "courseDuration" = 'Not specified' WHERE "courseDuration" IS NULL;
UPDATE "Course" SET "category" = 'BARTENDING' WHERE "category" IS NULL;
UPDATE "Course" SET "level" = 'BEGINNER' WHERE "level" IS NULL;

-- Now make the columns NOT NULL (except courseDuration which stays optional)
ALTER TABLE "Course" ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "level" SET NOT NULL;

-- Remove the defaults since they're now NOT NULL
ALTER TABLE "Course" ALTER COLUMN "category" DROP DEFAULT,
ALTER COLUMN "level" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Pricing" (
    "id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePricing" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "pricingId" TEXT NOT NULL,

    CONSTRAINT "CoursePricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoursePricing_courseId_pricingId_key" ON "CoursePricing"("courseId", "pricingId");

-- AddForeignKey
ALTER TABLE "CoursePricing" ADD CONSTRAINT "CoursePricing_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePricing" ADD CONSTRAINT "CoursePricing_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "Pricing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
