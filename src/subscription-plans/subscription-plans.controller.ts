import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete,
  Body, 
  Param, 
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Req,
  Patch,
  Logger
} from '@nestjs/common';
import { StripeCheckoutService } from '../stripe/stripe-checkout.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SubscriptionPlansService } from './subscription-plans.service';
import { 
  CreateSubscriptionPlanDto, 
  UpdateSubscriptionPlanDto,
} from './subscription-plans.model';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import Stripe from 'stripe';
import { Public } from '../auth/public.decorator';
import { CoursesService } from 'src/courses/courses.service';

@ApiTags('subscription-plans')
@Controller('subscription-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubscriptionPlansController {
  private readonly logger = new Logger(SubscriptionPlansController.name);

  constructor(
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly stripeCheckoutService: StripeCheckoutService,
    private readonly coursesService: CoursesService
  ) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the subscription plan'
        },
        description: {
          type: 'string',
          description: 'Description of the plan'
        },
        price: {
          type: 'number',
          description: 'Price of the plan'
        },
        currency: {
          type: 'string',
          description: 'Currency code (e.g., USD)'
        },
        interval: {
          type: 'string',
          enum: ['month', 'year', 'week', 'day'],
          description: 'Billing interval'
        },
        intervalCount: {
          type: 'number',
          description: 'Number of intervals between billings'
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of features included in the plan'
        },
        maxCourses: {
          type: 'number',
          description: 'Maximum number of courses allowed'
        },
        trialDays: {
          type: 'number',
          description: 'Number of trial days'
        }
      },
      required: ['name', 'price', 'currency', 'interval', 'intervalCount', 'features']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Subscription plan created successfully',
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        priceId: { type: 'string' }
      }
    }
  })
  async createSubscriptionPlan(@Body() planData: CreateSubscriptionPlanDto) {
    try {
      const result = await this.subscriptionPlansService.createStripePlan(planData);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to create subscription plan: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }



  @Delete(':productId/:priceId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Archive a subscription plan' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription plan archived successfully'
  })
  async archiveSubscriptionPlan(
    @Param('productId') productId: string,
    @Param('priceId') priceId: string
  ) {
    try {
      await this.subscriptionPlansService.archiveStripePlan(productId, priceId);
      return { message: 'Subscription plan archived successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to archive subscription plan: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'List all active subscription plans' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription plans retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          active: { type: 'boolean' }
        }
      }
    }
  })
  async listSubscriptionPlans() {
    try {
      const products = await this.subscriptionPlansService.listStripeProducts();
      return products;
    } catch (error) {
      throw new HttpException(
        `Failed to list subscription plans: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search subscription plans' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' }
        }
      }
    }
  })
  async searchPlans(@Query('q') query: string) {
    try {
      if (!query) {
        throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
      }
      
      const products = await this.subscriptionPlansService.searchPlans(query);
      return products;
    } catch (error) {
      throw new HttpException(
        `Failed to search subscription plans: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('stripe/:productId')
  @ApiOperation({ summary: 'Get subscription plan details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription plan retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        active: { type: 'boolean' },
        metadata: { type: 'object' }
      }
    }
  })
  async getSubscriptionPlan(@Param('productId') productId: string) {
    try {
      const product = await this.subscriptionPlansService.getStripeProduct(productId);
      return product;
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve subscription plan: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':productId/prices')
  @ApiOperation({ summary: 'List all prices for a subscription plan' })
  @ApiResponse({ 
    status: 200, 
    description: 'Prices retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          unit_amount: { type: 'number' },
          currency: { type: 'string' },
          recurring: { type: 'object' }
        }
      }
    }
  })
  async listPlanPrices(@Param('productId') productId: string) {
    try {
      const prices = await this.subscriptionPlansService.listStripePrices(productId);
      return prices;
    } catch (error) {
      throw new HttpException(
        `Failed to list plan prices: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':productId/with-pricing')
  @ApiOperation({ summary: 'Get subscription plan with pricing details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Plan with pricing retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        product: { type: 'object' },
        prices: { type: 'array' }
      }
    }
  })
  async getPlanWithPricing(@Param('productId') productId: string) {
    try {
      const result = await this.subscriptionPlansService.getPlanWithPricing(productId);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve plan with pricing: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ==================== COUPON MANAGEMENT ====================

  @Post('coupons')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new coupon' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the coupon'
        },
        percentOff: {
          type: 'number',
          description: 'Percentage discount (e.g., 20 for 20% off)'
        },
        duration: {
          type: 'string',
          enum: ['once', 'repeating', 'forever'],
          description: 'Duration of the coupon'
        },
        durationInMonths: {
          type: 'number',
          description: 'Number of months for repeating coupons'
        }
      },
      required: ['name', 'percentOff', 'duration']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Coupon created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        percent_off: { type: 'number' }
      }
    }
  })
  async createCoupon(
    @Body() body: {
      name: string;
      percentOff: number;
      duration: 'once' | 'repeating' | 'forever';
      durationInMonths?: number;
    }
  ) {
    try {
      const coupon = await this.subscriptionPlansService.createCoupon(
        body.name,
        body.percentOff,
        body.duration,
        body.durationInMonths
      );
      return coupon;
    } catch (error) {
      throw new HttpException(
        `Failed to create coupon: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('coupons')
  @ApiOperation({ summary: 'List all coupons' })
  @ApiResponse({ 
    status: 200, 
    description: 'Coupons retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          percent_off: { type: 'number' },
          duration: { type: 'string' }
        }
      }
    }
  })
  async listCoupons() {
    try {
      const coupons = await this.subscriptionPlansService.listCoupons();
      return coupons;
    } catch (error) {
      throw new HttpException(
        `Failed to list coupons: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('coupons/:id')
  @ApiOperation({ summary: 'Get coupon details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Coupon retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        percent_off: { type: 'number' },
        duration: { type: 'string' }
      }
    }
  })
  async getCoupon(@Param('id') id: string) {
    try {
      const coupon = await this.subscriptionPlansService.getCoupon(id);
      return coupon;
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve coupon: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete('coupons/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a coupon' })
  @ApiResponse({ 
    status: 200, 
    description: 'Coupon deleted successfully'
  })
  async deleteCoupon(@Param('id') id: string) {
    try {
      await this.subscriptionPlansService.deleteCoupon(id);
      return { message: 'Coupon deleted successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to delete coupon: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get subscription plans' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription plans retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          currency: { type: 'string' },
          interval: { type: 'string' },
          features: { type: 'array', items: { type: 'string' } },
          maxCourses: { type: 'number' },
          isActive: { type: 'boolean' },
          stripePriceId: { type: 'string' }
        }
      }
    }
  })
  async getSubscriptionPlans() {
    try {
      const plans = await this.subscriptionPlansService.getAllSubscriptionPlans();
      return plans;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch subscription plans: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create Stripe checkout session for subscription plan (uses authenticated user email)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'ID of the subscription plan'
        },
        successUrl: {
          type: 'string',
          description: 'URL to redirect after successful payment'
        },
        cancelUrl: {
          type: 'string',
          description: 'URL to redirect if payment is cancelled'
        }
      },
      required: ['planId', 'successUrl', 'cancelUrl']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Checkout session created successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        url: { type: 'string' }
      }
    }
  })
  async createCheckoutSession(
    @Body() body: {
      planId: string;
      successUrl: string;
      cancelUrl: string;
    },
    @Req() req: any
  ) {
    try {
      // Get the authenticated user's email from the JWT token
      const userEmail = req.user?.email;
      if (!userEmail) {
        throw new HttpException('User email not found in token', HttpStatus.UNAUTHORIZED);
      }

      // Get the plan details
      const plan = await this.subscriptionPlansService.getSubscriptionPlanById(body.planId);
      if (!plan) {
        throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);
      }

      // Create checkout session with user's email
      const checkoutSession = await this.stripeCheckoutService.createCheckoutSession({
        planId: plan.id,
        planName: plan.name,
        priceId: plan.stripePriceId,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
        customerEmail: userEmail, // Automatically use authenticated user's email
      });

      return checkoutSession;
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw new HttpException(
        `Failed to create checkout session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('/course/checkout')
  @ApiOperation({ summary: 'Create Stripe checkout session for course' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'string', description: 'ID of the course' },
        successUrl: { type: 'string', description: 'URL to redirect after successful payment' },
        cancelUrl: { type: 'string', description: 'URL to redirect if payment is cancelled' }
      },
      required: ['courseId', 'successUrl', 'cancelUrl']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Checkout session created successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        url: { type: 'string' }
      }
    }
  })
  async createCourseCheckoutSession(
    @Body() body: {
      courseId: string;
      successUrl: string;
      cancelUrl: string;
    },
    @Req() req: any
  ) {
    try {
      const userEmail = req.user?.email;
      if (!userEmail) {
        throw new HttpException('User email not found in token', HttpStatus.UNAUTHORIZED);
      }

      const course = await this.coursesService.getCourseById(body.courseId);
      if (!course) {
        throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
      }

      const checkoutSession = await this.stripeCheckoutService.createCourseCheckoutSession({
        courseId: course.id,
        courseName: course.title,
        coursePrice: course.coursePricings[0].pricing.price,
        currency: course.coursePricings[0].pricing.currency,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
        customerEmail: userEmail,
      });
      return checkoutSession;
    } catch (error) {
      throw new HttpException(
        `Failed to create course checkout session: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }


  @Post('payment/:planId')
  @ApiOperation({ summary: 'Handle subscription payment (from opushub-api)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID' },
        paymentMethodId: { type: 'string', description: 'Payment method ID (optional)' },
        email: { type: 'string', description: 'User email' },
        phoneNumber: { type: 'string', description: 'Phone number (optional)' },
        name: { type: 'string', description: 'User name' }
      },
      required: ['userId', 'email', 'name']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription payment processed successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
        successUrl: { type: 'string' }
      }
    }
  })
  async subscriptionPayment(
    @Param('planId') planId: string,
    @Body() body: {
      userId: string;
      paymentMethodId?: string;
      email: string;
      phoneNumber?: string;
      name: string;
    }
  ) {
    try {
      const result = await this.subscriptionPlansService.subscriptionPayment(planId, body);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to process subscription payment: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Handle Stripe webhook for subscription events' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully'
  })
  async handleStripeWebhook(@Req() req: any) {
    try {
      this.logger.log('Webhook received');
      this.logger.log(`Headers: ${JSON.stringify(req.headers)}`);
      this.logger.log(`Body length: ${req.body?.length || 'undefined'}`);
      
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      this.logger.log(`Signature: ${sig ? 'Present' : 'Missing'}`);
      this.logger.log(`Webhook secret: ${endpointSecret ? 'Present' : 'Missing'}`);

      if (!sig || !endpointSecret) {
        this.logger.error('Missing Stripe signature or webhook secret');
        throw new HttpException('Missing Stripe signature or webhook secret', HttpStatus.BAD_REQUEST);
      }

      const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      this.logger.log(`Webhook event type: ${event.type}`);
      
      await this.subscriptionPlansService.handleStripeWebhook(event);
      
      this.logger.log('Webhook processed successfully');
      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw new HttpException(
        `Webhook error: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('admin/plans')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all subscription plans (Admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription plans retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          currency: { type: 'string' },
          interval: { type: 'string' },
          features: { type: 'array', items: { type: 'string' } },
          maxCourses: { type: 'number' },
          isActive: { type: 'boolean' },
          stripePriceId: { type: 'string' }
        }
      }
    }
  })
  async getAllSubscriptionPlans() {
    try {
      const plans = await this.subscriptionPlansService.getAllSubscriptionPlans();
      return plans;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch subscription plans: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('admin/plans/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get subscription plan by ID (Admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription plan retrieved successfully'
  })
  async getSubscriptionPlanById(@Param('id') id: string) {
    try {
      const plan = await this.subscriptionPlansService.getSubscriptionPlanById(id);
      return plan;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch subscription plan: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Put('admin/plans/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update subscription plan (Admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        features: { type: 'array', items: { type: 'string' } },
        maxCourses: { type: 'number' },
        isActive: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription plan updated successfully'
  })
  async updateSubscriptionPlan(
    @Param('id') id: string,
    @Body() updates: any
  ) {
    try {
      const plan = await this.subscriptionPlansService.updateSubscriptionPlan(id, updates);
      return plan;
    } catch (error) {
      throw new HttpException(
        `Failed to update subscription plan: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Patch('admin/plans/:id/toggle-status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Toggle subscription plan status (Admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription plan status toggled successfully'
  })
  async togglePlanStatus(@Param('id') id: string) {
    try {
      const plan = await this.subscriptionPlansService.togglePlanStatus(id);
      return plan;
    } catch (error) {
      throw new HttpException(
        `Failed to toggle subscription plan status: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('admin/sync-stripe')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Sync subscription plans with Stripe (Admin)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription plans synced with Stripe successfully'
  })
  async syncWithStripe() {
    try {
      const result = await this.subscriptionPlansService.syncSubscriptionPlansWithStripe();
      return {
        message: 'Subscription plans synced with Stripe successfully',
        results: result
      };
    } catch (error) {
      throw new HttpException(
        `Failed to sync with Stripe: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

