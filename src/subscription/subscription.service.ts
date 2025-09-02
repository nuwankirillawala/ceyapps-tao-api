import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateSubscriptionDto, 
  UpdateSubscriptionDto,
  PaymentStatus,
  SubscriptionPlanDetailsResponse
} from './subscription.model';
import { UserSubscription, SubscriptionStatus, User } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    
    this.stripe = new Stripe(stripeSecretKey);
  }

  /**
   * Create a new subscription
   */
  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string,
    couponCode?: string,
    startTrial?: boolean,
    metadata?: Record<string, any>
  ): Promise<Stripe.Subscription> {
    try {
      // Get customer ID for the user
      const customerId = await this.getOrCreateCustomerId(userId);
      
      // Get price ID for the plan
      const priceId = await this.getPriceIdForPlan(planId);
      
      // Prepare subscription parameters
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          planId,
          ...metadata,
        },
      };

      // Add coupon if provided
      if (couponCode) {
        subscriptionParams.discounts = [{ coupon: couponCode }];
      }

      // Add trial if requested
      if (startTrial) {
        subscriptionParams.trial_period_days = 7; // 7-day trial
      }

      // Create subscription
      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      this.logger.log(`Subscription created: ${subscription.id} for user: ${userId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Error creating subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create subscription checkout session
   */
  async createSubscriptionCheckoutSession(
    planId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string,
    couponCode?: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      // Get price ID for the plan
      const priceId = await this.getPriceIdForPlan(planId);
      
      // Get customer ID for the user
      const customerId = await this.getOrCreateCustomerId(userId);

      // Prepare session parameters
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planId,
        },
      };

      // Add coupon if provided
      if (couponCode) {
        sessionParams.discounts = [{ coupon: couponCode }];
      }

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      this.logger.log(`Checkout session created: ${session.id} for user: ${userId}`);
      return session;
    } catch (error) {
      this.logger.error(`Error creating checkout session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      this.logger.error(`Error retrieving subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * List user subscriptions
   */
  async listUserSubscriptions(userId: string): Promise<Stripe.Subscription[]> {
    try {
      const customerId = await this.getOrCreateCustomerId(userId);
      
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.default_payment_method'],
      });
      
      return subscriptions.data;
    } catch (error) {
      this.logger.error(`Error listing user subscriptions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: UpdateSubscriptionDto
  ): Promise<Stripe.Subscription> {
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {};

      if (updates.paymentMethodId) {
        updateParams.default_payment_method = updates.paymentMethodId;
      }

      if (updates.cancelAtPeriodEnd !== undefined) {
        updateParams.cancel_at_period_end = updates.cancelAtPeriodEnd;
      }

      if (updates.planId) {
        const newPriceId = await this.getPriceIdForPlan(updates.planId);
        updateParams.items = [{ price: newPriceId, quantity: 1 }];
      }

      if (updates.metadata) {
        updateParams.metadata = updates.metadata;
      }

      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        updateParams
      );

      this.logger.log(`Subscription updated: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Error updating subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      this.logger.log(`Subscription cancelled: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Error cancelling subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      this.logger.log(`Subscription reactivated: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Error reactivating subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle subscription webhook events
   */
  async handleSubscriptionWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          this.logger.log(`Unhandled subscription event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling subscription webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle subscription created event
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription created via webhook: ${subscription.id}`);
    // TODO: Update local database with subscription details
  }

  /**
   * Handle subscription updated event
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription updated via webhook: ${subscription.id}`);
    // TODO: Update local database with subscription details
  }

  /**
   * Handle subscription deleted event
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription deleted via webhook: ${subscription.id}`);
    // TODO: Update local database with subscription details
  }

  /**
   * Handle invoice payment succeeded event
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription && typeof invoice.subscription === 'string') {
      this.logger.log(`Invoice payment succeeded for subscription: ${invoice.subscription}`);
      // TODO: Update local database with payment details
    }
  }

  /**
   * Handle invoice payment failed event
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription && typeof invoice.subscription === 'string') {
      this.logger.log(`Invoice payment failed for subscription: ${invoice.subscription}`);
      // TODO: Update local database with payment details
    }
  }

  /**
   * Store subscription in database (from opushub-api)
   */
  async storeSubscriptionInDatabase(
    subscription: Stripe.Subscription,
    customer: Stripe.Customer,
    user: User
  ): Promise<void> {
    try {
      // Extract metadata
      const userId = user.id;
      const planId = subscription.metadata?.planId;
      const fullSubscription = await this.stripe.subscriptions.retrieve(subscription.id);
      
      if (!userId || !planId) {
        this.logger.error(`Missing userId or planId in subscription metadata: ${subscription.id}`);
        return;
      }

      // Check if user subscription already exists
      const existingSubscription = await this.prisma.userSubscription.findUnique({
        where: { stripeSubscriptionId: subscription.id }
      });

      if (existingSubscription) {
        this.logger.log(`User subscription already exists: ${subscription.id}`);
        return;
      }

      // Create user subscription
      await this.prisma.userSubscription.create({
        data: {
          userId,
          subscriptionPlanId: planId,
          stripeSubscriptionId: fullSubscription.id,
          stripeCustomerId: customer.id,
          status: this.mapStripeStatusToLocalStatus(subscription.status),
          currentPeriodStart: new Date(fullSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(fullSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: fullSubscription.canceled_at ? new Date(fullSubscription.canceled_at * 1000) : null,
          endedAt: fullSubscription.ended_at ? new Date(fullSubscription.ended_at * 1000) : null,
          trialStart: fullSubscription.trial_start ? new Date(fullSubscription.trial_start * 1000) : null,
          trialEnd: fullSubscription.trial_end ? new Date(fullSubscription.trial_end * 1000) : null,
        }
      });

      this.logger.log(`User subscription stored in database: ${subscription.id} for user: ${userId}`);
    } catch (error) {
      this.logger.error("Error storing subscription in database:", error);
      throw error;
    }
  }

  /**
   * Update subscription in database (from opushub-api)
   */
  async updateSubscriptionInDatabase(
    subscription: Stripe.Subscription,
    receiptUrl?: string
  ): Promise<void> {
    try {
      // Find existing user subscription
      const userSubscription = await this.prisma.userSubscription.findUnique({
        where: { stripeSubscriptionId: subscription.id }
      });
      const fullSubscription = await this.stripe.subscriptions.retrieve(subscription.id);

      if (!userSubscription) {
        this.logger.warn(`User subscription not found for Stripe subscription: ${subscription.id}`);
        return;
      }

      // Update user subscription
      await this.prisma.userSubscription.update({
        where: { id: userSubscription.id },
        data: {
          status: this.mapStripeStatusToLocalStatus(fullSubscription.status),
          currentPeriodStart: new Date(fullSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(fullSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: fullSubscription.cancel_at_period_end,
          canceledAt: fullSubscription.canceled_at ? new Date(fullSubscription.canceled_at * 1000) : null,
          endedAt: fullSubscription.ended_at ? new Date(fullSubscription.ended_at * 1000) : null,
          trialStart: fullSubscription.trial_start ? new Date(fullSubscription.trial_start * 1000) : null,
          trialEnd: fullSubscription.trial_end ? new Date(fullSubscription.trial_end * 1000) : null,
        }
      });

      this.logger.log(`User subscription updated in database: ${subscription.id}`);
    } catch (error) {
      this.logger.error("Error updating subscription in database:", error);
      throw error;
    }
  }

  /**
   * Get user subscription by user ID
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const userSubscription = await this.prisma.userSubscription.findFirst({
        where: { 
          userId,
          status: { in: ['ACTIVE', 'TRIALING'] }
        },
        include: {
          subscriptionPlan: true
        }
      });

      if (!userSubscription) {
        return null;
      }

      return {
        ...userSubscription,
        subscriptionPlanId: userSubscription.subscriptionPlan.id
      };
    } catch (error) {
      this.logger.error(`Error getting user subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    try {
      const userSubscription = await this.prisma.userSubscription.findFirst({
        where: { 
          userId,
          status: { in: ['ACTIVE', 'TRIALING'] }
        },
        include: {
          subscriptionPlan: true
        }
      });

      if (!userSubscription) {
        return false;
      }

      return userSubscription.subscriptionPlan.features.includes(feature);
    } catch (error) {
      this.logger.error(`Error checking feature access: ${error.message}`);
      return false;
    }
  }

  /**
   * Get user's active features
   */
  async getUserFeatures(userId: string): Promise<string[]> {
    try {
      const userSubscription = await this.prisma.userSubscription.findFirst({
        where: { 
          userId,
          status: { in: ['ACTIVE', 'TRIALING'] }
        },
        include: {
          subscriptionPlan: true
        }
      });

      if (!userSubscription) {
        return [];
      }

      return userSubscription.subscriptionPlan.features;
    } catch (error) {
      this.logger.error(`Error getting user features: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if user can enroll in a course
   */
  async canEnrollInCourse(userId: string): Promise<boolean> {
    try {
      const userSubscription = await this.prisma.userSubscription.findFirst({
        where: { 
          userId,
          status: { in: ['ACTIVE', 'TRIALING'] }
        },
        include: {
          subscriptionPlan: true
        }
      });

      if (!userSubscription) {
        return false;
      }

      // Check if user has reached max courses limit
      if (userSubscription.subscriptionPlan.maxCourses) {
        const currentEnrollments = await this.prisma.userEnrollment.count({
          where: { userId }
        });

        return currentEnrollments < userSubscription.subscriptionPlan.maxCourses;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error checking enrollment capability: ${error.message}`);
      return false;
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelUserSubscription(userId: string): Promise<void> {
    try {
      const userSubscription = await this.prisma.userSubscription.findFirst({
        where: { 
          userId,
          status: { in: ['ACTIVE', 'TRIALING'] }
        }
      });

      if (!userSubscription) {
        throw new NotFoundException('No active subscription found');
      }

      // Cancel in Stripe
      await this.stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update local database
      await this.prisma.userSubscription.update({
        where: { id: userSubscription.id },
        data: {
          cancelAtPeriodEnd: true,
          status: 'CANCELED'
        }
      });

      this.logger.log(`User subscription cancelled: ${userSubscription.id} for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error cancelling user subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map Stripe subscription status to local status
   */
  private mapStripeStatusToLocalStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'unpaid':
        return SubscriptionStatus.UNPAID;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'incomplete':
        return SubscriptionStatus.INCOMPLETE;
      case 'incomplete_expired':
        return SubscriptionStatus.INCOMPLETE_EXPIRED;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }

  /**
   * Find user by organization and email
   */
  private async findUserByOrganizationAndEmail(organization: string, email: string): Promise<any> {
    try {
      // This would need to be implemented based on your user model
      // For now, returning null as placeholder
      return null;
    } catch (error) {
      this.logger.error(`Error finding user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get or create customer ID for user
   */
  private async getOrCreateCustomerId(userId: string): Promise<string> {
    try {
      // First, try to find an existing customer for this user
      const existingCustomers = await this.stripe.customers.list({
        limit: 100
      });

      const existingCustomer = existingCustomers.data.find(customer => 
        customer.metadata?.userId === userId
      );

      if (existingCustomer) {
        return existingCustomer.id;
      }

      // If no existing customer, get user details and create one
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Create new customer in Stripe
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId },
      });

      this.logger.log(`Created new Stripe customer: ${customer.id} for user: ${userId}`);
      return customer.id;
    } catch (error) {
      this.logger.error(`Error getting or creating customer ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get price ID for plan
   */
  private async getPriceIdForPlan(planId: string): Promise<string> {
    try {
      // Get the subscription plan from database
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        throw new Error(`Subscription plan not found: ${planId}`);
      }

      if (!plan.stripePriceId) {
        throw new Error(`Subscription plan ${plan.name} does not have a Stripe price ID`);
      }

      return plan.stripePriceId;
    } catch (error) {
      this.logger.error(`Error getting price ID for plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription plan details by user ID
   */
  async getSubscriptionPlanDetailsByUserId(userId: string): Promise<SubscriptionPlanDetailsResponse> {
    try {
      // Get user's active subscription
      const userSubscription = await this.prisma.userSubscription.findFirst({
        where: { 
          userId,
          status: { in: ['ACTIVE', 'TRIALING'] }
        },
        include: {
          subscriptionPlan: true
        }
      });

      // If no active subscription, return default status
      if (!userSubscription) {
        return {
          hasActiveSubscription: false,
          currentPlan: null,
          subscriptionDetails: null,
          planFeatures: [],
          maxCourses: 0,
          subscriptionEndDate: null,
          subscriptionId: null,
          message: 'No active subscription found'
        };
      }

      // Extract plan features and calculate max courses
      const planFeatures = userSubscription.subscriptionPlan.features || [];
      const maxCourses = this.calculateMaxCourses(userSubscription.subscriptionPlan.features);

      // Format the response
      const subscriptionDetails = {
        hasActiveSubscription: true,
        currentPlan: {
          id: userSubscription.subscriptionPlan.id,
          name: userSubscription.subscriptionPlan.name,
          description: userSubscription.subscriptionPlan.description,
          price: userSubscription.subscriptionPlan.price,
          currency: userSubscription.subscriptionPlan.currency,
          interval: userSubscription.subscriptionPlan.interval,
          intervalCount: userSubscription.subscriptionPlan.intervalCount,
          features: userSubscription.subscriptionPlan.features
        },
        subscriptionDetails: {
          id: userSubscription.id,
          status: userSubscription.status as any,
          currentPeriodStart: userSubscription.currentPeriodStart.toISOString(),
          currentPeriodEnd: userSubscription.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: userSubscription.cancelAtPeriodEnd,
          trialStart: userSubscription.trialStart?.toISOString() || null,
          trialEnd: userSubscription.trialEnd?.toISOString() || null
        },
        planFeatures,
        maxCourses,
        subscriptionEndDate: userSubscription.currentPeriodEnd.toISOString(),
        subscriptionId: userSubscription.id,
        message: 'Active subscription found'
      };

      this.logger.log(`Subscription plan details retrieved for user: ${userId}`);
      return subscriptionDetails;
    } catch (error) {
      this.logger.error(`Error getting subscription plan details for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate max courses based on plan features
   */
  private calculateMaxCourses(features: string[]): number {
    if (!features || features.length === 0) {
      return 0;
    }

    // Look for course limit in features
    const courseLimitFeature = features.find(feature => 
      feature.toLowerCase().includes('course') && 
      (feature.toLowerCase().includes('limit') || feature.toLowerCase().includes('max'))
    );

    if (courseLimitFeature) {
      // Extract number from feature string (e.g., "10 courses", "unlimited courses")
      const match = courseLimitFeature.match(/(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
      
      // Check for unlimited
      if (courseLimitFeature.toLowerCase().includes('unlimited')) {
        return -1; // -1 represents unlimited
      }
    }

    // Default based on plan features
    if (features.includes('premium') || features.includes('pro')) {
      return -1; // Unlimited for premium plans
    } else if (features.includes('basic')) {
      return 5; // 5 courses for basic plans
    }

    return 0; // Default to 0 if no specific limit found
  }
}

