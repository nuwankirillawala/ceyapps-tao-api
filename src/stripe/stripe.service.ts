import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface CloudflareVideoUploadResponse {
  uid: string;
  preview: string;
  thumbnail: string;
  duration: number;
  status: {
    state: string;
    errorReasonCode: string;
    errorReasonMessage: string;
  };
}

export interface CloudflareStreamResponse {
  uid: string;
  preview: string;
  thumbnail: string;
  duration: number;
  status: {
    state: string;
  };
}

export interface CloudflareImageUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploaded: string;
  metadata?: any;
}

export interface CloudflareFileUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploaded: string;
  metadata?: any;
}

export interface CoursePricing {
  id: string;
  title: string;
  price: number;
  currency: string;
}

export interface CheckoutSessionData {
  courseIds: string[];
  userId: string;
  successUrl: string;
  cancelUrl: string;
  courses: CoursePricing[];
}

export interface PaymentIntentData {
  courseIds: string[];
  userId: string;
  paymentMethodId: string;
  courses: CoursePricing[];
}

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-07-30.basil',
    });
  }

  /**
   * Validate courses and get pricing information
   */
  async validateCoursesAndGetPricing(courseIds: string[]): Promise<CoursePricing[]> {
    // This would typically query your database for course pricing
    // For now, returning mock data - replace with actual database queries
    const courses: CoursePricing[] = courseIds.map((courseId, index) => ({
      id: courseId,
      title: `Course ${index + 1}`,
      price: 99.99, // Replace with actual course pricing
      currency: 'USD'
    }));

    return courses;
  }

  /**
   * Create a Stripe Checkout Session (recommended by Stripe)
   */
  async createCheckoutSession(data: CheckoutSessionData): Promise<Stripe.Checkout.Session> {
    try {
      const { courseIds, userId, successUrl, cancelUrl, courses } = data;
      
      // Calculate total amount
      const totalAmount = courses.reduce((sum, course) => sum + course.price, 0);
      
      // Create line items for each course
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = courses.map(course => ({
        price_data: {
          currency: course.currency.toLowerCase(),
          product_data: {
            name: course.title,
            description: `Enrollment in ${course.title}`,
          },
          unit_amount: Math.round(course.price * 100), // Convert to cents
        },
        quantity: 1,
      }));

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          courseIds: courseIds.join(','),
          totalAmount: totalAmount.toString(),
        },
        customer_email: userId, // You might want to get actual user email
      });

      this.logger.log(`Checkout session created: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error(`Error creating checkout session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create payment intent for courses with payment method
   */
  async createPaymentIntentForCourses(data: PaymentIntentData): Promise<Stripe.PaymentIntent> {
    try {
      const { courseIds, userId, paymentMethodId, courses } = data;
      
      // Calculate total amount
      const totalAmount = courses.reduce((sum, course) => sum + course.price, 0);
      
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true, // Confirm immediately
        metadata: {
          userId,
          courseIds: courseIds.join(','),
          totalAmount: totalAmount.toString(),
        },
        return_url: 'https://yourdomain.com/payment/success', // Replace with your success URL
      });

      this.logger.log(`Payment intent created for courses: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error creating payment intent for courses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Construct webhook event from raw body and signature
   */
  async constructWebhookEvent(
    payload: Buffer | string,
    signature: string,
    secret: string
  ): Promise<Stripe.Event> {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling webhook event: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle successful checkout session completion
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const { userId, courseIds } = session.metadata;
      
      if (!userId || !courseIds) {
        throw new Error('Missing metadata in checkout session');
      }

      // Process enrollment
      await this.processCourseEnrollment(userId, courseIds.split(','), session.id);
      
      this.logger.log(`Checkout session completed and enrollment processed: ${session.id}`);
    } catch (error) {
      this.logger.error(`Error handling checkout session completion: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const { userId, courseIds } = paymentIntent.metadata;
      
      if (!userId || !courseIds) {
        throw new Error('Missing metadata in payment intent');
      }

      // Process enrollment
      await this.processCourseEnrollment(userId, courseIds.split(','), paymentIntent.id);
      
      this.logger.log(`Payment intent succeeded and enrollment processed: ${paymentIntent.id}`);
    } catch (error) {
      this.logger.error(`Error handling payment intent success: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      this.logger.log(`Payment intent failed: ${paymentIntent.id}`);
      // You might want to send notification to user or update order status
    } catch (error) {
      this.logger.error(`Error handling payment intent failure: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process course enrollment after successful payment
   */
  private async processCourseEnrollment(userId: string, courseIds: string[], paymentIntentId: string): Promise<void> {
    try {
      // This would integrate with your existing enrollment logic
      // For now, just logging - replace with actual enrollment processing
      this.logger.log(`Processing enrollment for user ${userId} in courses: ${courseIds.join(', ')}`);
      
      // TODO: Integrate with your enrollment service
      // await this.enrollmentService.enrollUserInCourses(userId, courseIds, paymentIntentId);
      
    } catch (error) {
      this.logger.error(`Error processing course enrollment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a payment intent for course enrollment
   */
  async createPaymentIntent(amount: number, currency: string, metadata: any): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error creating payment intent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      this.logger.log(`Payment intent confirmed: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error confirming payment intent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieve a payment intent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error retrieving payment intent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a payment method
   */
  async createPaymentMethod(type: string, card: any): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: type as Stripe.PaymentMethodCreateParams.Type,
        card,
      });

      this.logger.log(`Payment method created: ${paymentMethod.id}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Error creating payment method: ${error.message}`);
      throw error;
    }
  }

  /**
   * Attach a payment method to a customer
   */
  async attachPaymentMethodToCustomer(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      this.logger.log(`Payment method attached to customer: ${paymentMethod.id}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Error attaching payment method: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create or retrieve a customer
   */
  async createOrRetrieveCustomer(email: string, name: string): Promise<Stripe.Customer> {
    try {
      // Try to find existing customer
      const existingCustomers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email,
        name,
      });

      this.logger.log(`Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error(`Error creating/retrieving customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentIntentId: string, amount?: number, reason?: string): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      if (reason) {
        refundData.reason = reason as Stripe.RefundCreateParams.Reason;
      }

      const refund = await this.stripe.refunds.create(refundData);
      this.logger.log(`Refund created: ${refund.id}`);
      return refund;
    } catch (error) {
      this.logger.error(`Error creating refund: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payment method details
   */
  async getPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Error retrieving payment method: ${error.message}`);
      throw error;
    }
  }
}
