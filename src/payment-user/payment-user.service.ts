import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentUser, CreatePaymentUserDto, UpdatePaymentUserDto } from './payment-user.model';

@Injectable()
export class PaymentUserService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentUserService.name);

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    
    this.stripe = new Stripe(stripeSecretKey);
  }

  /**
   * Create a new payment user in Stripe
   */
  async createStripeCustomer(paymentUserData: CreatePaymentUserDto): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: paymentUserData.email,
        name: paymentUserData.name,
        phone: paymentUserData.phoneNumber,
        address: paymentUserData.address,
        metadata: {
          userId: paymentUserData.userId,
          ...paymentUserData.metadata,
        },
      });

      this.logger.log(`Stripe customer created: ${customer.id} for user: ${paymentUserData.userId}`);
      return customer;
    } catch (error) {
      this.logger.error(`Error creating Stripe customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an existing Stripe customer
   */
  async updateStripeCustomer(
    customerId: string,
    updates: UpdatePaymentUserDto
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        email: updates.email,
        name: updates.name,
        phone: updates.phoneNumber,
        address: updates.address,
        metadata: updates.metadata,
      });

      this.logger.log(`Stripe customer updated: ${customerId}`);
      return customer;
    } catch (error) {
      this.logger.error(`Error updating Stripe customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Stripe customer details
   */
  async getStripeCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }
      return customer as Stripe.Customer;
    } catch (error) {
      this.logger.error(`Error retrieving Stripe customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find customer by email
   */
  async findCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
    try {
      const customers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      return customers.data.length > 0 ? customers.data[0] : null;
    } catch (error) {
      this.logger.error(`Error finding customer by email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a Stripe customer
   */
  async deleteStripeCustomer(customerId: string): Promise<void> {
    try {
      await this.stripe.customers.del(customerId);
      this.logger.log(`Stripe customer deleted: ${customerId}`);
    } catch (error) {
      this.logger.error(`Error deleting Stripe customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all customers
   */
  async listCustomers(limit: number = 100): Promise<Stripe.Customer[]> {
    try {
      const customers = await this.stripe.customers.list({
        limit,
      });
      
      return customers.data;
    } catch (error) {
      this.logger.error(`Error listing customers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get customer's payment methods
   */
  async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      
      return paymentMethods.data;
    } catch (error) {
      this.logger.error(`Error getting customer payment methods: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set default payment method for customer
   */
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.Customer> {
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
}
