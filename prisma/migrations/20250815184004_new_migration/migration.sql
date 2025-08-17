/*
  Warnings:

  - A unique constraint covering the columns `[country,region]` on the table `Pricing` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CoursePricing" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Pricing" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "discount" DOUBLE PRECISION,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "originalPrice" DOUBLE PRECISION,
ADD COLUMN     "pricingTier" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "validTo" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PricingHistory" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "oldPrice" DOUBLE PRECISION NOT NULL,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "changeReason" TEXT,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricingHistory_country_changedAt_idx" ON "PricingHistory"("country", "changedAt");

-- CreateIndex
CREATE INDEX "PricingHistory_courseId_changedAt_idx" ON "PricingHistory"("courseId", "changedAt");

-- CreateIndex
CREATE INDEX "CoursePricing_courseId_isActive_idx" ON "CoursePricing"("courseId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Pricing_country_region_key" ON "Pricing"("country", "region");

-- AddForeignKey
ALTER TABLE "PricingHistory" ADD CONSTRAINT "PricingHistory_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
