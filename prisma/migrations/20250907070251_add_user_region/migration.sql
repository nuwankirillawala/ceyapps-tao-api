-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_cartId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "CoursePricing" DROP CONSTRAINT "CoursePricing_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CoursePricing" DROP CONSTRAINT "CoursePricing_pricingId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_courseId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordReset" DROP CONSTRAINT "PasswordReset_userId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentUser" DROP CONSTRAINT "PaymentUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "PricingHistory" DROP CONSTRAINT "PricingHistory_courseId_fkey";

-- DropForeignKey
ALTER TABLE "SubscriptionPayment" DROP CONSTRAINT "SubscriptionPayment_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_userId_fkey";

-- DropForeignKey
ALTER TABLE "TrendingCourse" DROP CONSTRAINT "TrendingCourse_courseId_fkey";

-- DropForeignKey
ALTER TABLE "UserEnrollment" DROP CONSTRAINT "UserEnrollment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "UserEnrollment" DROP CONSTRAINT "UserEnrollment_orderId_fkey";

-- DropForeignKey
ALTER TABLE "UserEnrollment" DROP CONSTRAINT "UserEnrollment_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSubscription" DROP CONSTRAINT "UserSubscription_subscriptionPlanId_fkey";

-- DropForeignKey
ALTER TABLE "UserSubscription" DROP CONSTRAINT "UserSubscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "timezone" TEXT;
