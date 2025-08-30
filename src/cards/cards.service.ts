import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { 
  PaymentMethod, 
  CreatePaymentMethodDto, 
  UpdatePaymentMethodDto,
  AttachCardDto 
} from './cards.model';

@Injectable()
export class CardsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(CardsService.name);

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    
    this.stripe = new Stripe(stripeSecretKey);
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
  async attachPaymentMethodToCustomer(
    paymentMethodId: string, 
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
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

  /**
   * Update a payment method
   */
  async updatePaymentMethod(
    paymentMethodId: string,
    updates: UpdatePaymentMethodDto
  ): Promise<Stripe.PaymentMethod> {
    try {
      const updateParams: Stripe.PaymentMethodUpdateParams = {};

      if (updates.billingDetails) {
        updateParams.billing_details = {
          name: updates.billingDetails.name,
          email: updates.billingDetails.email,
          phone: updates.billingDetails.phone,
          address: updates.billingDetails.address,
        };
      }

      const paymentMethod = await this.stripe.paymentMethods.update(
        paymentMethodId,
        updateParams
      );

      this.logger.log(`Payment method updated: ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Error updating payment method: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detach a payment method from a customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
      this.logger.log(`Payment method detached: ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Error detaching payment method: ${error.message}`);
      throw error;
    }
  }

  /**
   * List customer's payment methods
   */
  async listCustomerPaymentMethods(
    customerId: string,
    type: string = 'card'
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type as Stripe.PaymentMethodListParams.Type,
      });
      
      return paymentMethods.data;
    } catch (error) {
      this.logger.error(`Error listing customer payment methods: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set default payment method for customer
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      this.logger.log(`Default payment method set for customer: ${customerId}`);
      return customer;
    } catch (error) {
      this.logger.error(`Error setting default payment method: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payment methods for a user based on organization (from opushub-api)
   */
  async getPaymentMethods(userId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const customers = await this.stripe.customers.list();

      const orgCustomers: Stripe.Customer[] = customers.data.filter(
        (user: Stripe.Customer) => user.metadata.userId === userId
      );

      const orgPaymentMethods: Stripe.PaymentMethod[] = [];

      await Promise.all(
        orgCustomers.map(async (cus) => {
          const paymentMethods = await this.stripe.paymentMethods.list({
            customer: cus.id,
            type: 'card',
          });
          orgPaymentMethods.push(...paymentMethods.data);
        })
      );

      const uniquePaymentMethods = Array.from(
        new Map(
          orgPaymentMethods.map((method) => [method.card?.fingerprint, method])
        ).values()
      );

      this.logger.log(`Retrieved ${uniquePaymentMethods.length} payment methods for user: ${userId}`);
      return uniquePaymentMethods;
    } catch (error) {
      this.logger.error(`Error fetching payment methods: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove payment method (from opushub-api)
   */
  async removePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
      this.logger.log(`Payment method removed: ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Error removing payment method: ${error.message}`);
      throw error;
    }
  }
}

