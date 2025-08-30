/*
  Warnings:

  - You are about to drop the column `planId` on the `UserSubscription` table. All the data in the column will be lost.
  - The `status` column on the `UserSubscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `subscriptionPlanId` to the `UserSubscription` table without a default value. This is not possible if the table is not empty.
  - Made the column `stripeSubscriptionId` on table `UserSubscription` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'TRIALING', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'PAUSED');

-- DropForeignKey
ALTER TABLE "UserSubscription" DROP CONSTRAINT "UserSubscription_planId_fkey";

-- AlterTable
ALTER TABLE "UserSubscription" DROP COLUMN "planId",
ADD COLUMN     "subscriptionPlanId" TEXT NOT NULL,
ALTER COLUMN "stripeSubscriptionId" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "UserSubscription_userId_idx" ON "UserSubscription"("userId");

-- CreateIndex
CREATE INDEX "UserSubscription_subscriptionPlanId_idx" ON "UserSubscription"("subscriptionPlanId");

-- CreateIndex
CREATE INDEX "UserSubscription_status_idx" ON "UserSubscription"("status");

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
