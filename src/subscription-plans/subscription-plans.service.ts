import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { 
  SubscriptionPlan, 
  CreateSubscriptionPlanDto, 
  UpdateSubscriptionPlanDto,
  StripePlanResult
} from './subscription-plans.model';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class SubscriptionPlansService implements OnModuleInit {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(SubscriptionPlansService.name);
  
  constructor(
    private configService: ConfigService, 
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    
    this.stripe = new Stripe(stripeSecretKey);
  }

  /**
   * Initialize subscription plans on module startup
   */
  async onModuleInit() {
    try {
      this.logger.log('🚀 Initializing subscription plans...');
      await this.initializeDefaultSubscriptionPlans();
      this.logger.log('✅ Subscription plans initialized successfully');
    } catch (error) {
      this.logger.error(`❌ Failed to initialize subscription plans: ${error.message}`);
      // Don't throw error to prevent app from crashing
    }
  }

  /**
   * Initialize default subscription plans from TAO_ADMIN
   */
  private async initializeDefaultSubscriptionPlans() {
    const defaultPlans = [
      {
        name: 'The Citrus Starter',
        description: 'Perfect for beginners starting their bartending journey',
        price: 25.00,
        currency: 'USD',
        interval: 'month',
        intervalCount: 1,
        isActive: true,
        features: [
          'Beginner Courses',
          'Lifetime Access',
          'Community Forum Access',
          'Annual Billing Discount Available',
          'À La Carte Course Purchase Option'
        ],
        maxCourses: 5
      },
      {
        name: 'The Shaker Pro',
        description: 'For intermediate bartenders looking to enhance their skills',
        price: 35.00,
        currency: 'USD',
        interval: 'month',
        intervalCount: 1,
        isActive: true,
        features: [
          'Beginner Courses',
          'Intermediate Courses',
          'Lifetime Access',
          'Community Forum Access',
          'Monthly Live Q&A',
          'Downloadable Recipe E-Book',
          'Annual Billing Discount Available',
          'À La Carte Course Purchase Option'
        ],
        maxCourses: 15
      },
      {
        name: 'The Spirit Expert',
        description: 'Comprehensive plan for advanced bartenders and professionals',
        price: 85.00,
        currency: 'USD',
        interval: 'month',
        intervalCount: 1,
        isActive: true,
        features: [
          'Beginner Courses',
          'Intermediate Courses',
          'Advanced Courses',
          'Lifetime Access',
          'Community Forum Access',
          'Monthly Live Q&A',
          'Downloadable Recipe E-Book',
          '1-On-1 Mentorship Session Per Month',
          'Priority Support',
          'Exclusive Masterclass Events',
          'Annual Billing Discount Available',
          'À La Carte Course Purchase Option'
        ],
        maxCourses: -1 // Unlimited
      }
    ];

    for (const planData of defaultPlans) {
      try {
        // Check if plan already exists in database
        const existingPlan = await this.prisma.subscriptionPlan.findFirst({
          where: { name: planData.name }
        });

        if (existingPlan) {
          this.logger.log(`📝 Plan already exists: ${planData.name}`);
          
          // If plan exists but doesn't have Stripe IDs, sync with Stripe
          if (!existingPlan.stripePriceId) {
            this.logger.log(`🔄 Syncing existing plan with Stripe: ${planData.name}`);
            await this.syncPlanWithStripe(existingPlan as SubscriptionPlan);
          }
        } else {
          this.logger.log(`✨ Creating new plan: ${planData.name}`);
          
          // Create plan in database first
          const newPlan = await this.prisma.subscriptionPlan.create({
            data: planData
          });

          // Then create in Stripe
          await this.syncPlanWithStripe(newPlan as SubscriptionPlan);
        }
      } catch (error) {
        this.logger.error(`❌ Failed to initialize plan ${planData.name}: ${error.message}`);
      }
    }
  }

  /**
   * Sync a single plan with Stripe
   */
  private async syncPlanWithStripe(plan: SubscriptionPlan) {
    try {
      // Create product in Stripe
      const product = await this.stripe.products.create({
        name: plan.name,
        description: plan.description || '',
        metadata: {
          features: JSON.stringify(plan.features),
          maxCourses: plan.maxCourses?.toString() || '',
          planId: plan.id,
        },
      });

      // Create price in Stripe
      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.price * 100), // Convert to cents
        currency: plan.currency.toLowerCase(),
        recurring: {
          interval: plan.interval,
          interval_count: plan.intervalCount,
        },
        metadata: {
          productId: product.id,
          planId: plan.id,
        },
      });

      // Update database with Stripe IDs
      await this.prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: {
          stripePriceId: price.id,
        }
      });

      this.logger.log(`✅ Synced plan ${plan.name} with Stripe - Product: ${product.id}, Price: ${price.id}`);
    } catch (error) {
      this.logger.error(`❌ Failed to sync plan ${plan.name} with Stripe: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new subscription plan in Stripe
   */
  async createStripePlan(planData: CreateSubscriptionPlanDto): Promise<StripePlanResult> {
    try {
      // Create product in Stripe
      const product = await this.stripe.products.create({
        name: planData.name,
        description: planData.description,
        metadata: {
          features: JSON.stringify(planData.features),
          maxCourses: planData.maxCourses?.toString() || '',
          trialDays: planData.trialDays?.toString() || '',
        },
      });

      // Create price in Stripe
      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(planData.price * 100), // Convert to cents
        currency: planData.currency.toLowerCase(),
        recurring: {
          interval: planData.interval,
          interval_count: planData.intervalCount,
        },
        metadata: {
          productId: product.id,
        },
      });

      this.logger.log(`Stripe plan created - Product: ${product.id}, Price: ${price.id}`);
      
      return {
        productId: product.id,
        priceId: price.id,
      };
    } catch (error) {
      this.logger.error(`Error creating Stripe plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an existing subscription plan in Stripe
   */
  async updateStripePlan(
    productId: string,
    priceId: string,
    updates: UpdateSubscriptionPlanDto
  ): Promise<StripePlanResult> {
    try {
      // Update product in Stripe
      if (updates.name || updates.description) {
        await this.stripe.products.update(productId, {
          name: updates.name,
          description: updates.description,
          metadata: {
            features: updates.features ? JSON.stringify(updates.features) : undefined,
            maxCourses: updates.maxCourses?.toString() || '',
            trialDays: updates.trialDays?.toString() || '',
          },
        });
      }

      // If price needs to be updated, create a new price (Stripe doesn't allow updating existing prices)
      if (updates.price || updates.currency) {
        const oldPrice = await this.stripe.prices.retrieve(priceId);
        
        // Create new price
        const newPrice = await this.stripe.prices.create({
          product: productId,
          unit_amount: Math.round((updates.price || 0) * 100),
          currency: (updates.currency || 'USD').toLowerCase(),
          recurring: {
            interval: oldPrice.recurring?.interval || 'month',
            interval_count: oldPrice.recurring?.interval_count || 1,
          },
          metadata: {
            productId: productId,
          },
        });

        // Archive old price
        await this.stripe.prices.update(priceId, { active: false });

        this.logger.log(`Stripe plan updated - New Price: ${newPrice.id}`);
        
        return {
          productId,
          priceId: newPrice.id,
        };
      }

      return { productId, priceId };
    } catch (error) {
      this.logger.error(`Error updating Stripe plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Archive a subscription plan in Stripe
   */
  async archiveStripePlan(productId: string, priceId: string): Promise<void> {
    try {
      // Archive the price
      await this.stripe.prices.update(priceId, { active: false });
      
      // Archive the product
      await this.stripe.products.update(productId, { active: false });

      this.logger.log(`Stripe plan archived - Product: ${productId}, Price: ${priceId}`);
    } catch (error) {
      this.logger.error(`Error archiving Stripe plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Stripe product details
   */
  async getStripeProduct(productId: string): Promise<Stripe.Product> {
    try {
      const product = await this.stripe.products.retrieve(productId);
      return product;
    } catch (error) {
      this.logger.error(`Error retrieving Stripe product: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Stripe price details
   */
  async getStripePrice(priceId: string): Promise<Stripe.Price> {
    try {
      const price = await this.stripe.prices.retrieve(priceId);
      return price;
    } catch (error) {
      this.logger.error(`Error retrieving Stripe price: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all active products in Stripe
   */
  async listStripeProducts(): Promise<Stripe.Product[]> {
    try {
      const products = await this.stripe.products.list({
        active: true,
        limit: 100,
      });
      
      return products.data;
    } catch (error) {
      this.logger.error(`Error listing Stripe products: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all active prices for a product in Stripe
   */
  async listStripePrices(productId: string): Promise<Stripe.Price[]> {
    try {
      const prices = await this.stripe.prices.list({
        product: productId,
        active: true,
        limit: 100,
      });
      
      return prices.data;
    } catch (error) {
      this.logger.error(`Error listing Stripe prices: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a coupon in Stripe
   */
  async createCoupon(
    name: string,
    percentOff: number,
    duration: 'once' | 'repeating' | 'forever',
    durationInMonths?: number
  ): Promise<Stripe.Coupon> {
    try {
      const coupon = await this.stripe.coupons.create({
        name,
        percent_off: percentOff,
        duration,
        duration_in_months: durationInMonths,
      });

      this.logger.log(`Coupon created: ${coupon.id}`);
      return coupon;
    } catch (error) {
      this.logger.error(`Error creating coupon: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get coupon details
   */
  async getCoupon(couponId: string): Promise<Stripe.Coupon> {
    try {
      const coupon = await this.stripe.coupons.retrieve(couponId);
      return coupon;
    } catch (error) {
      this.logger.error(`Error retrieving coupon: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all coupons
   */
  async listCoupons(): Promise<Stripe.Coupon[]> {
    try {
      const coupons = await this.stripe.coupons.list({
        limit: 100,
      });
      
      return coupons.data;
    } catch (error) {
      this.logger.error(`Error listing coupons: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a coupon
   */
  async deleteCoupon(couponId: string): Promise<void> {
    try {
      await this.stripe.coupons.del(couponId);
      this.logger.log(`Coupon deleted: ${couponId}`);
    } catch (error) {
      this.logger.error(`Error deleting coupon: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get plan details with pricing
   */
  async getPlanWithPricing(productId: string): Promise<{
    product: Stripe.Product;
    prices: Stripe.Price[];
  }> {
    try {
      const [product, prices] = await Promise.all([
        this.getStripeProduct(productId),
        this.listStripePrices(productId),
      ]);

      return { product, prices };
    } catch (error) {
      this.logger.error(`Error getting plan with pricing: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search plans by name or description
   */
  async searchPlans(query: string): Promise<Stripe.Product[]> {
    try {
      const products = await this.stripe.products.search({
        query,
        limit: 100,
      });
      
      return products.data;
    } catch (error) {
      this.logger.error(`Error searching plans: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription plans with users (from opushub-api)
   */
  async getSubscriptionPlans(): Promise<any> {
    try {
      const prices = await this.stripe.prices.list({
        expand: ['data.product'],
      });

      if (prices.data.length === 0) {
        // Fallback to database if no Stripe prices
        const dbPlans = await this.prisma.subscriptionPlan.findMany();
        prices.data = dbPlans.map(plan => ({
          id: plan.stripePriceId,
          product: { id: plan.stripePriceId, name: plan.name },
          currency: plan.currency,
          unit_amount: plan.price * 100,
          recurring: { interval: plan.interval }
        })) as any;
      }

      const plansWithUsers = await Promise.all(
        prices.data.map(async (price: any) => {
          let subscribedUsers: { subscriptionId: string; customerId: string | Stripe.Customer | Stripe.DeletedCustomer; }[] = [];
          if (price.recurring !== null) {
            subscribedUsers = await this.getUsersSubscribedToPlan(price.id);
          }
          return {
            priceId: price.id,
            productId: (price.product && typeof price.product !== 'string' && 'id' in price.product) ? price.product.id : null,
            name: (price.product && typeof price.product !== 'string' && 'name' in price.product) ? price.product.name : null,
            currency: price.currency,
            amount: price.unit_amount ? price.unit_amount / 100 : 0.00,
            interval: price.recurring?.interval ?? null,
            users: subscribedUsers,
          };
        })
      );

      return { success: true, plans: plansWithUsers };
    } catch (error) {
      this.logger.error(`Error fetching subscription plans: ${error.message}`);
      throw new Error('Failed to fetch subscription plans');
    }
  }

  /**
   * Get users subscribed to a plan (from opushub-api)
   */
  private async getUsersSubscribedToPlan(planId: string): Promise<any[]> {
    try {
      // Fetch subscriptions for the given plan
      const subscriptions = await this.stripe.subscriptions.list({
        price: planId, // Filter by the specific price ID
        status: 'active', // Only active subscriptions
      });

      // Extract user/customer information
      const subscribedUsers = subscriptions.data.map((subscription) => ({
        subscriptionId: subscription.id,
        customerId: subscription.customer,
      }));

      return subscribedUsers;
    } catch (error) {
      this.logger.error(`Error fetching users subscribed to plan: ${error.message}`);
      throw new Error('Failed to fetch subscribed users');
    }
  }

  /**
   * Handle subscription payment (from opushub-api)
   */
  async subscriptionPayment(
    planId: string,
    paymentData: {
      userId: string;
      paymentMethodId?: string;
      email: string;
      phoneNumber?: string;
      name: string;
    }
  ): Promise<any> {
    try {
      const { userId, paymentMethodId, email, phoneNumber, name } = paymentData;
      
      const subscriptions = await this.stripe.prices.list({
        expand: ['data.product'],
      });
      
      const subscription = subscriptions.data.find((sub) => sub.id === planId);
      
      if (!subscription) {
        throw new Error("Subscription not found");
      }

      // Get user and organization (this would need to be implemented based on your models)
      // const user = await this.findUserById(userId);
      // const organization = await this.findOrganizationById(user?.organization);
      // const users = await this.findUsersByOrganization(organization?._id);

      // For now, using placeholder values
      const user = { _id: userId, organization: 'org_placeholder' };
      const organization = { _id: 'org_placeholder' };
      const users = [{ _id: 'user1' }];

      if (!user) {
        throw new Error("User not found");
      }

      if (!organization) {
        throw new Error("Organization not found");
      }

      const subscriptionAmount = subscription.unit_amount !== null ? subscription.unit_amount / 100 : 0;

      const existingCustomer = await this.stripe.customers.list({
        email: email,
        limit: 1,
      });

      let stripeCustomerId: string;
      if (existingCustomer.data.length > 0) {
        stripeCustomerId = existingCustomer.data[0].id;
      } else {
        const newCustomer = await this.stripe.customers.create({
          email: email,
          name: name,
          phone: phoneNumber,
          metadata: {
            userId: organization._id.toString(),
          },
        });
        stripeCustomerId = newCustomer.id;
        
        // Save the customer ID in your database for future use
        // organization.stripeCustomerId = stripeCustomerId;
        // await organization.save();
      }

      if (paymentMethodId) {
        const existingPaymentMethods = await this.stripe.paymentMethods.list({
          customer: stripeCustomerId,
          type: "card",
        });

        const isAlreadyAttached = existingPaymentMethods.data.some(
          (method) => method.id === paymentMethodId
        );

        if (!isAlreadyAttached) {
          await this.stripe.paymentMethods.attach(paymentMethodId, {
            customer: stripeCustomerId,
          });
        }

        await this.stripe.customers.update(stripeCustomerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        });

        const newSubscription = await this.stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [
            {
              price_data: {
                currency: "aud",
                product: (subscription.product as Stripe.Product).id,
                unit_amount: Math.round(
                  (subscriptionAmount) * users.length * 100
                ),
                recurring: {
                  interval:
                    subscription.recurring?.interval ?? 'month',
                },
              },
            },
          ],
          default_payment_method: paymentMethodId,
          expand: ["latest_invoice.payment_intent"],
          proration_behavior: "create_prorations",
        });

        // organization.stripeSubscriptionId = newSubscription.id;
        // await organization.save();

        return {
          data: newSubscription,
          successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/payment-success`,
        };
      } else {
        const session = await this.stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/payment-success`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/setting/organization`,
          customer: stripeCustomerId,
          client_reference_id: user._id.toString(),
          line_items: [
            {
              price_data: {
                currency: "aud",
                product: (subscription.product as Stripe.Product).id,
                unit_amount: Math.round(subscriptionAmount * users.length * 100),
                recurring: {
                  interval:
                    subscription.recurring?.interval ?? 'month',
                },
              },
              quantity: 1,
            },
          ],
        });

        // organization.stripeSubscriptionId = session.id;
        // await organization.save();

        return session;
      }
    } catch (error) {
      this.logger.error(`Error in subscription payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook (from opushub-api)
   */
  async handleStripeWebhook(
    event: Stripe.Event
  ): Promise<void> {
    try {
      this.logger.log(`Processing webhook event: ${event.type}`);
      this.logger.log(`Event ID: ${event.id}`);
      
      switch (event.type) {
        case "payment_intent.succeeded": {
          this.logger.log('Processing payment_intent.succeeded event');
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          // Fetch the invoice (if available)
          if (paymentIntent.latest_charge) {
            const charge = await this.stripe.charges.retrieve(paymentIntent.latest_charge as string);

            // Send email with SendGrid (if configured)
            const email = charge.receipt_email;
            if (email && charge.receipt_url) {
              // Email sending logic would go here
              this.logger.log(`Payment succeeded for ${email} with receipt: ${charge.receipt_url}`);
            } else {
              this.logger.warn("Customer email or invoice URL not available");
            }
          } else {
            this.logger.warn("No invoice associated with this payment");
          }
          break;
        }
        case "customer.subscription.created": {
          this.logger.log('Processing customer.subscription.created event');
          const subscription = event.data.object as Stripe.Subscription;
          const customer = await this.stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
          const user = await this.prisma.user.findUnique({
            where: { email: customer.email }
          });
          await this.subscriptionService.storeSubscriptionInDatabase(subscription, customer, user);
          this.logger.log(`Subscription created successfully: ${subscription.id}`);
          break;
        }
        case "customer.subscription.updated": {
          this.logger.log('Processing customer.subscription.updated event');
          const subscription = event.data.object as Stripe.Subscription;
          this.logger.log(`Subscription updated: ${subscription.id}`);
          await this.subscriptionService.updateSubscriptionInDatabase(subscription);
          break;
        }
        case "invoice.payment_succeeded": {
          this.logger.log('Processing invoice.payment_succeeded event');
          const invoice = event.data.object as any; // Use any to access nested properties
          
          // Try different possible paths for subscription ID
          let subscriptionId: string | undefined;
          
          // Check the nested path you mentioned
          if (invoice.parent?.subscription_details?.subscription) {
            subscriptionId = invoice.parent.subscription_details.subscription;
          }
          // Fallback to direct subscription property
          else if (invoice.subscription) {
            subscriptionId = invoice.subscription;
          }
          
          if (!subscriptionId) {
            this.logger.warn('No subscription found in invoice, available keys:', Object.keys(invoice));
            break;
          }

          const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
          this.logger.log(`Payment succeeded for subscription: ${subscription.id}`);

          // Save receipt URL in the database
          const receiptUrl = invoice.invoice_pdf;
          if (receiptUrl) {
            await this.subscriptionService.updateSubscriptionInDatabase(subscription, receiptUrl);
          }

          await this.subscriptionService.updateSubscriptionInDatabase(subscription);
          break;
        }
        case "customer.subscription.deleted": {
          this.logger.log('Processing customer.subscription.deleted event');
          const subscription = event.data.object as Stripe.Subscription;
          await this.subscriptionService.updateSubscriptionInDatabase(subscription);
          break;
        }
        case "checkout.session.completed": {
          this.logger.log('Processing checkout.session.completed event');
          await this.handleCheckoutSessionCompleted(event);
          break;
        }
        default:
          this.logger.warn(`Unhandled event type: ${event.type}`);
      }
      
      this.logger.log(`Webhook event ${event.type} processed successfully`);
    } catch (error) {
      this.logger.error("Webhook error:", error);
      this.logger.error(`Error details: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Handle checkout session completed event
   */
  private async handleCheckoutSessionCompleted(event: Stripe.Event) {
    try {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.mode === 'subscription' && session.subscription) {
        // Get the subscription details from Stripe
        const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
        
        // Extract metadata
        const planId = session.metadata?.planId;
        const customerEmail = session.customer_email;
        
        if (!planId || !customerEmail) {
          this.logger.error('Missing planId or customerEmail in checkout session metadata');
          return;
        }

        // Find user by email
        const user = await this.prisma.user.findUnique({
          where: { email: customerEmail }
        });

        if (!user) {
          this.logger.error(`User not found for email: ${customerEmail}`);
          return;
        }

        // Create user subscription using the existing subscription service
        // The subscription service will handle the webhook events and create the user subscription
        this.logger.log(`Checkout session completed for user: ${user.id}, plan: ${planId}`);
        this.logger.log(`Subscription will be created via webhook: ${subscription.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling checkout session completed: ${error.message}`);
    }
  }

  /**
   * Sync subscription plans with Stripe (create products and prices)
   */
  async syncSubscriptionPlansWithStripe(): Promise<any[]> {
    try {
      // Get all active subscription plans from database
      const dbPlans = await this.prisma.subscriptionPlan.findMany({
        where: { isActive: true }
      });

      const syncedPlans = [];

      for (const plan of dbPlans) {
        try {
          // Check if plan already has Stripe product/price
          if (plan.stripePriceId) {
            // Verify the price still exists in Stripe
            try {
              await this.stripe.prices.retrieve(plan.stripePriceId);
              syncedPlans.push({
                ...plan,
                synced: true,
                message: 'Already synced with Stripe'
              });
              continue;
            } catch (error) {
              // Price doesn't exist in Stripe, need to recreate
              this.logger.warn(`Stripe price not found for plan ${plan.name}, recreating...`);
            }
          }

          // Create product in Stripe
          const product = await this.stripe.products.create({
            name: plan.name,
            description: plan.description || '',
            metadata: {
              planId: plan.id,
              maxCourses: plan.maxCourses?.toString() || 'unlimited',
              features: JSON.stringify(plan.features)
            }
          });

          // Create price in Stripe
          const price = await this.stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(plan.price * 100), // Convert to cents
            currency: plan.currency.toLowerCase(),
            recurring: {
              interval: plan.interval as any,
              interval_count: plan.intervalCount,
            },
            metadata: {
              planId: plan.id,
              productId: product.id
            }
          });

          // Update database with Stripe IDs
          await this.prisma.subscriptionPlan.update({
            where: { id: plan.id },
            data: {
              stripePriceId: price.id
            }
          });

          syncedPlans.push({
            ...plan,
            stripePriceId: price.id,
            synced: true,
            message: 'Successfully synced with Stripe'
          });

          this.logger.log(`Plan ${plan.name} synced with Stripe - Product: ${product.id}, Price: ${price.id}`);
        } catch (error) {
          this.logger.error(`Failed to sync plan ${plan.name} with Stripe:`, error);
          syncedPlans.push({
            ...plan,
            synced: false,
            error: error.message
          });
        }
      }

      return syncedPlans;
    } catch (error) {
      this.logger.error(`Error syncing subscription plans with Stripe: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all subscription plans from database
   */
  async getAllSubscriptionPlans(): Promise<any[]> {
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' }
      });

      return plans;
    } catch (error) {
      this.logger.error(`Error fetching subscription plans: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription plan by ID
   */
  async getSubscriptionPlanById(id: string): Promise<any> {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id }
      });

      if (!plan) {
        throw new NotFoundException(`Subscription plan with ID ${id} not found`);
      }

      return plan;
    } catch (error) {
      this.logger.error(`Error fetching subscription plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscriptionPlan(id: string, updates: any): Promise<any> {
    try {
      const plan = await this.prisma.subscriptionPlan.update({
        where: { id },
        data: updates
      });

      // If price or features changed, sync with Stripe
      if (updates.price || updates.features || updates.name || updates.description) {
        await this.syncSubscriptionPlansWithStripe();
      }

      return plan;
    } catch (error) {
      this.logger.error(`Error updating subscription plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Toggle subscription plan active status
   */
  async togglePlanStatus(id: string): Promise<any> {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id }
      });

      if (!plan) {
        throw new NotFoundException(`Subscription plan with ID ${id} not found`);
      }

      const updatedPlan = await this.prisma.subscriptionPlan.update({
        where: { id },
        data: { isActive: !plan.isActive }
      });

      return updatedPlan;
    } catch (error) {
      this.logger.error(`Error toggling subscription plan status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's current subscription status and plan features
   */
  async getUserSubscriptionStatus(userEmail: string): Promise<any> {
    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get user's active subscription from database
      const userSubscription = await this.prisma.userSubscription.findFirst({
        where: {
          userId: user.id,
          status: 'ACTIVE'
        },
        include: {
          subscriptionPlan: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!userSubscription) {
        return {
          hasActiveSubscription: false,
          currentPlan: null,
          planFeatures: [],
          maxCourses: 0,
          subscriptionEndDate: null,
          message: 'No active subscription found'
        };
      }

      const plan = userSubscription.subscriptionPlan;
      
      return {
        hasActiveSubscription: true,
        currentPlan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval
        },
        planFeatures: plan.features || [],
        maxCourses: plan.maxCourses || 0,
        subscriptionEndDate: userSubscription.currentPeriodEnd,
        subscriptionId: userSubscription.stripeSubscriptionId,
        message: `Active subscription to ${plan.name}`
      };
    } catch (error) {
      this.logger.error(`Error getting user subscription status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user can access a specific feature
   */
  async checkFeatureAccess(userEmail: string, feature: string, courseId?: string): Promise<any> {
    try {
      const subscriptionStatus = await this.getUserSubscriptionStatus(userEmail);
      
      if (!subscriptionStatus.hasActiveSubscription) {
        return {
          canAccess: false,
          reason: 'No active subscription',
          currentPlan: 'None',
          upgradeRequired: true,
          message: 'Please subscribe to a plan to access this feature'
        };
      }

      const plan = subscriptionStatus.currentPlan;
      const features = subscriptionStatus.planFeatures;
      const maxCourses = subscriptionStatus.maxCourses;

      // Check specific feature access
      switch (feature) {
        case 'beginner_courses':
          if (features.includes('Beginner Courses')) {
            return {
              canAccess: true,
              reason: 'Feature included in current plan',
              currentPlan: plan.name,
              upgradeRequired: false
            };
          }
          break;

        case 'intermediate_courses':
          if (features.includes('Intermediate Courses')) {
            return {
              canAccess: true,
              reason: 'Feature included in current plan',
              currentPlan: plan.name,
              upgradeRequired: false
            };
          }
          break;

        case 'advanced_courses':
          if (features.includes('Advanced Courses')) {
            return {
              canAccess: true,
              reason: 'Feature included in current plan',
              currentPlan: plan.name,
              upgradeRequired: false
            };
          }
          break;

        case 'community_forum':
          if (features.includes('Community Forum Access')) {
            return {
              canAccess: true,
              reason: 'Feature included in current plan',
              currentPlan: plan.name,
              upgradeRequired: false
            };
          }
          break;

        case 'live_qa':
          if (features.includes('Monthly Live Q&A')) {
            return {
              canAccess: true,
              reason: 'Feature included in current plan',
              currentPlan: plan.name,
              upgradeRequired: false
            };
          }
          break;

        case 'mentorship':
          if (features.includes('1-On-1 Mentorship Session Per Month')) {
            return {
              canAccess: true,
              reason: 'Feature included in current plan',
              currentPlan: plan.name,
              upgradeRequired: false
            };
          }
          break;

        case 'priority_support':
          if (features.includes('Priority Support')) {
            return {
              canAccess: true,
              reason: 'Feature included in current plan',
              currentPlan: plan.name,
              upgradeRequired: false
            };
          }
          break;

        case 'course_access':
          // Check if user has reached course limit
          if (maxCourses === -1) { // Unlimited
            return {
              canAccess: true,
              reason: 'Unlimited courses in current plan',
              currentPlan: plan.name,
              upgradeRequired: false
            };
          }

          // Count user's current courses
          const userCourseCount = await this.prisma.userEnrollment.count({
            where: { userId: subscriptionStatus.userId }
          });

          if (userCourseCount < maxCourses) {
            return {
              canAccess: true,
              reason: `Course access available (${userCourseCount}/${maxCourses})`,
              currentPlan: plan.name,
              upgradeRequired: false
            };
          } else {
            return {
              canAccess: false,
              reason: `Course limit reached (${maxCourses} courses)`,
              currentPlan: plan.name,
              upgradeRequired: true,
              message: `Upgrade to access more courses. Current limit: ${maxCourses}`
            };
          }

        default:
          return {
            canAccess: false,
            reason: 'Unknown feature',
            currentPlan: plan.name,
            upgradeRequired: false
          };
      }

      // If feature not found in current plan
      return {
        canAccess: false,
        reason: 'Feature not included in current plan',
        currentPlan: plan.name,
        upgradeRequired: true,
        message: `Upgrade to ${this.getNextPlanName(plan.name)} to access this feature`
      };
    } catch (error) {
      this.logger.error(`Error checking feature access: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get next plan name for upgrade suggestions
   */
  private getNextPlanName(currentPlanName: string): string {
    const planHierarchy = {
      'The Citrus Starter': 'The Shaker Pro',
      'The Shaker Pro': 'The Spirit Expert',
      'The Spirit Expert': 'The Spirit Expert (Already at highest tier)'
    };
    
    return planHierarchy[currentPlanName] || 'a higher tier plan';
  }
}

