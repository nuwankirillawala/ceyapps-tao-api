/*
  Warnings:

  - The `status` column on the `UserSubscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `status` on the `SubscriptionPayment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "SubscriptionPayment" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserSubscription" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- CreateTable
CREATE TABLE "PaymentUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentUser_email_key" ON "PaymentUser"("email");

-- CreateIndex
CREATE INDEX "PaymentUser_userId_idx" ON "PaymentUser"("userId");

-- AddForeignKey
ALTER TABLE "PaymentUser" ADD CONSTRAINT "PaymentUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
