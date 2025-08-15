/*
  Warnings:

  - You are about to drop the column `quantity` on the `CartItem` table. All the data in the column will be lost.
  - Added the required column `country` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "quantity";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "country" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "UserEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "orderId" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserEnrollment_userId_courseId_key" ON "UserEnrollment"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "UserEnrollment" ADD CONSTRAINT "UserEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEnrollment" ADD CONSTRAINT "UserEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEnrollment" ADD CONSTRAINT "UserEnrollment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
