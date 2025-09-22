import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeCheckoutService {
  private readonly logger = new Logger(StripeCheckoutService.name);
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  /**
   * Create a Stripe checkout session for subscription
   */
  async createCheckoutSession(data: {
    planId: string;
    planName: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }) {
    try {
      this.logger.log(`Creating checkout session for plan: ${data.planName}`);

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: data.priceId,
            quantity: 1,
          },
        ],
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          planId: data.planId,
          planName: data.planName,
          customerEmail: data.customerEmail,
          ...data.metadata,
        },
        subscription_data: {
          metadata: {
            planId: data.planId,
            planName: data.planName,
            customerEmail: data.customerEmail,
          },
        },
      };

      // Add customer email if provided
      if (data.customerEmail) {
        sessionParams.customer_email = data.customerEmail;
      }

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      this.logger.log(`Checkout session created: ${session.id}`);
      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  /**
   * Create a Stripe checkout session for one-time payment
   */
  async createOneTimeCheckoutSession(data: {
    planId: string;
    planName: string;
    amount: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }) {
    try {
      this.logger.log(`Creating one-time checkout session for plan: ${data.planName}`);

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: data.currency.toLowerCase(),
              product_data: {
                name: data.planName,
              },
              unit_amount: Math.round(data.amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        allow_promotion_codes: true, // Allow users to enter promotion codes
        billing_address_collection: 'required', // Collect billing address
        customer_email: data.customerEmail, // Pre-fill customer email
        metadata: {
          planId: data.planId,
          planName: data.planName,
          customerEmail: data.customerEmail,
          ...data.metadata,
        },
      };

      // Remove the conditional check since customerEmail is now always provided
      // if (data.customerEmail) {
      //   sessionParams.customer_email = data.customerEmail;
      // }

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      this.logger.log(`One-time checkout session created: ${session.id}`);
      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Failed to create one-time checkout session: ${error.message}`);
      throw new Error(`Failed to create one-time checkout session: ${error.message}`);
    }
  }

  /**
   * Create a Stripe checkout session for individual course payment
   */
  async createCourseCheckoutSession(data: {
    courseId: string;
    courseName: string;
    coursePrice: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }) {
    try {
      this.logger.log(`Creating course checkout session for: ${data.courseName}`);

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: data.currency.toLowerCase(),
              product_data: {
                name: data.courseName,
                description: `Course: ${data.courseName}`,
              },
              unit_amount: Math.round(data.coursePrice * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        allow_promotion_codes: true, // Allow users to enter promotion codes
        billing_address_collection: 'required', // Collect billing address
        customer_email: data.customerEmail, // Pre-fill customer email
        metadata: {
          courseId: data.courseId,
          courseName: data.courseName,
          customerEmail: data.customerEmail,
          paymentType: 'course_payment',
          ...data.metadata,
        },
      };

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      this.logger.log(`Course checkout session created: ${session.id}`);
      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Failed to create course checkout session: ${error.message}`);
      throw new Error(`Failed to create course checkout session: ${error.message}`);
    }
  }

  /**
   * Create a Stripe checkout session for cart checkout
   */
  async createCartCheckoutSession(data: {
    courseIds: string[];
    courseNames: string[];
    coursePrices: number[];
    currency: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }) {
    try {
      this.logger.log(`Creating cart checkout session for ${data.courseIds.length} courses`);

      // Create line items for each course
      const lineItems = data.courseIds.map((courseId, index) => ({
        price_data: {
          currency: data.currency.toLowerCase(),
          product_data: {
            name: data.courseNames[index],
            description: `Course: ${data.courseNames[index]}`,
          },
          unit_amount: Math.round(data.coursePrices[index] * 100), // Convert to cents
        },
        quantity: 1,
      }));

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        allow_promotion_codes: true, // Allow users to enter promotion codes
        billing_address_collection: 'required', // Collect billing address
        customer_email: data.customerEmail, // Pre-fill customer email
        metadata: {
          courseIds: data.courseIds.join(','),
          courseNames: data.courseNames.join(','),
          customerEmail: data.customerEmail,
          paymentType: 'cart_payment',
          ...data.metadata,
        },
      };

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      this.logger.log(`Cart checkout session created: ${session.id}`);
      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Failed to create cart checkout session: ${error.message}`);
      throw new Error(`Failed to create cart checkout session: ${error.message}`);
    }
  }

  /**
   * Retrieve a checkout session
   */
  async getCheckoutSession(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      this.logger.error(`Failed to retrieve checkout session: ${error.message}`);
      throw new Error(`Failed to retrieve checkout session: ${error.message}`);
    }
  }

  /**
   * Expire a checkout session
   */
  async expireCheckoutSession(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.expire(sessionId);
      this.logger.log(`Checkout session expired: ${sessionId}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to expire checkout session: ${error.message}`);
      throw new Error(`Failed to expire checkout session: ${error.message}`);
    }
  }
}
