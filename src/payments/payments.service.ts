import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Temporary enums until Prisma client is regenerated
enum PaymentType {
  COURSE_PURCHASE = 'COURSE_PURCHASE',
  SUBSCRIPTION_PAYMENT = 'SUBSCRIPTION_PAYMENT',
  CART_CHECKOUT = 'CART_CHECKOUT'
}

enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new payment record
   */
  async createPayment(data: {
    userId: string;
    courseId?: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    paymentType: PaymentType;
    stripePaymentIntentId?: string;
    stripeSessionId?: string;
    stripeChargeId?: string;
    status?: PaymentStatus;
  }) {
    try {
      this.logger.log(`Creating payment for user ${data.userId}, amount: ${data.amount} ${data.currency}`);

      const payment = await this.prisma.payment.create({
        data: {
          userId: data.userId,
          courseId: data.courseId,
          subscriptionId: data.subscriptionId,
          amount: data.amount,
          currency: data.currency,
          paymentType: data.paymentType,
          stripePaymentIntentId: data.stripePaymentIntentId,
          stripeSessionId: data.stripeSessionId,
          stripeChargeId: data.stripeChargeId,
          status: data.status || PaymentStatus.PENDING,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          subscription: {
            select: {
              id: true,
              stripeSubscriptionId: true,
            },
          },
        },
      });

      this.logger.log(`Payment created successfully: ${payment.id}`);
      return payment;
    } catch (error) {
      this.logger.error(`Failed to create payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    additionalData?: {
      stripeChargeId?: string;
      stripePaymentIntentId?: string;
      paidAt?: Date;
    }
  ) {
    try {
      this.logger.log(`Updating payment ${paymentId} status to ${status}`);

      const updateData: any = { status };
      if (additionalData?.stripeChargeId) {
        updateData.stripeChargeId = additionalData.stripeChargeId;
      }
      if (additionalData?.stripePaymentIntentId) {
        updateData.stripePaymentIntentId = additionalData.stripePaymentIntentId;
      }
      if (additionalData?.paidAt) {
        updateData.paidAt = additionalData.paidAt;
      }

      const payment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          subscription: {
            select: {
              id: true,
              stripeSubscriptionId: true,
            },
          },
        },
      });

      this.logger.log(`Payment ${paymentId} status updated to ${status}`);
      return payment;
    } catch (error) {
      this.logger.error(`Failed to update payment status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find payment by Stripe payment intent ID
   */
  async findByStripePaymentIntentId(stripePaymentIntentId: string) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { stripePaymentIntentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          subscription: {
            select: {
              id: true,
              stripeSubscriptionId: true,
            },
          },
        },
      });

      return payment;
    } catch (error) {
      this.logger.error(`Failed to find payment by Stripe payment intent ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find payment by Stripe session ID
   */
  async findByStripeSessionId(stripeSessionId: string) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { stripeSessionId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          subscription: {
            select: {
              id: true,
              stripeSubscriptionId: true,
            },
          },
        },
      });

      return payment;
    } catch (error) {
      this.logger.error(`Failed to find payment by Stripe session ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payments by user ID
   */
  async getPaymentsByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: PaymentStatus;
    paymentType?: PaymentType;
  }) {
    try {
      const where: any = { userId };
      
      if (options?.status) {
        where.status = options.status;
      }
      
      if (options?.paymentType) {
        where.paymentType = options.paymentType;
      }

      const payments = await this.prisma.payment.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
          subscription: {
            select: {
              id: true,
              stripeSubscriptionId: true,
              subscriptionPlan: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      });

      return payments;
    } catch (error) {
      this.logger.error(`Failed to get payments by user ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(userId?: string) {
    try {
      const where = userId ? { userId } : {};

      const [
        totalPayments,
        successfulPayments,
        totalAmount,
        coursePayments,
        subscriptionPayments,
      ] = await Promise.all([
        this.prisma.payment.count({ where }),
        this.prisma.payment.count({ 
          where: { ...where, status: PaymentStatus.SUCCEEDED } 
        }),
        this.prisma.payment.aggregate({
          where: { ...where, status: PaymentStatus.SUCCEEDED },
          _sum: { amount: true },
        }),
        this.prisma.payment.count({ 
          where: { ...where, paymentType: PaymentType.COURSE_PURCHASE } 
        }),
        this.prisma.payment.count({ 
          where: { ...where, paymentType: PaymentType.SUBSCRIPTION_PAYMENT } 
        }),
      ]);

      return {
        totalPayments,
        successfulPayments,
        totalAmount: totalAmount._sum.amount || 0,
        coursePayments,
        subscriptionPayments,
        successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get payment statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle successful payment from Stripe webhook
   */
  async handleSuccessfulPayment(data: {
    stripePaymentIntentId?: string;
    stripeSessionId?: string;
    stripeChargeId?: string;
    amount?: number;
    currency?: string;
  }) {
    try {
      let payment = null;

      // Try to find payment by payment intent ID first
      if (data.stripePaymentIntentId) {
        payment = await this.findByStripePaymentIntentId(data.stripePaymentIntentId);
      }

      // If not found, try session ID
      if (!payment && data.stripeSessionId) {
        payment = await this.findByStripeSessionId(data.stripeSessionId);
      }

      if (!payment) {
        this.logger.warn(`Payment not found for Stripe data: ${JSON.stringify(data)}`);
        return null;
      }

      // Update payment status to succeeded
      const updatedPayment = await this.updatePaymentStatus(
        payment.id,
        PaymentStatus.SUCCEEDED,
        {
          stripeChargeId: data.stripeChargeId,
          paidAt: new Date(),
        }
      );

      this.logger.log(`Payment ${payment.id} marked as successful`);
      return updatedPayment;
    } catch (error) {
      this.logger.error(`Failed to handle successful payment: ${error.message}`);
      throw error;
    }
  }
}
