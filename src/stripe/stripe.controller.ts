import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Headers, 
  RawBodyRequest, 
  Req,
  UseGuards,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Checkout Session for course enrollment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of course IDs to enroll in'
        },
        successUrl: {
          type: 'string',
          description: 'URL to redirect after successful payment'
        },
        cancelUrl: {
          type: 'string',
          description: 'URL to redirect after cancelled payment'
        }
      },
      required: ['courseIds', 'successUrl', 'cancelUrl']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Checkout session created successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', example: 'cs_test_...' },
        url: { type: 'string', example: 'https://checkout.stripe.com/...' }
      }
    }
  })
  async createCheckoutSession(
    @Body() body: { courseIds: string[]; successUrl: string; cancelUrl: string },
    @Req() req: any
  ) {
    try {
      const { courseIds, successUrl, cancelUrl } = body;
      const userId = req.user.userId;

      // Validate course IDs and get pricing
      const courses = await this.stripeService.validateCoursesAndGetPricing(courseIds);
      
      // Create Stripe Checkout Session
      const session = await this.stripeService.createCheckoutSession({
        courseIds,
        userId,
        successUrl,
        cancelUrl,
        courses
      });

      return {
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create checkout session: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for direct payment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of course IDs to enroll in'
        },
        paymentMethodId: {
          type: 'string',
          description: 'Payment method ID from Stripe'
        }
      },
      required: ['courseIds', 'paymentMethodId']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Payment intent created successfully',
    schema: {
      type: 'object',
      properties: {
        clientSecret: { type: 'string', example: 'pi_..._secret_...' },
        paymentIntentId: { type: 'string', example: 'pi_...' }
      }
    }
  })
  async createPaymentIntent(
    @Body() body: { courseIds: string[]; paymentMethodId: string },
    @Req() req: any
  ) {
    try {
      const { courseIds, paymentMethodId } = body;
      const userId = req.user.userId;

      // Validate courses and get pricing
      const courses = await this.stripeService.validateCoursesAndGetPricing(courseIds);
      
      // Create payment intent
      const paymentIntent = await this.stripeService.createPaymentIntentForCourses({
        courseIds,
        userId,
        paymentMethodId,
        courses
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create payment intent: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      
      if (!webhookSecret) {
        throw new HttpException('Webhook secret not configured', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const event = await this.stripeService.constructWebhookEvent(
        req.rawBody,
        signature,
        webhookSecret
      );

      // Handle the event
      await this.stripeService.handleWebhookEvent(event);

      return { received: true };
    } catch (error) {
      throw new HttpException(
        `Webhook error: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('payment-intent/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment intent details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment intent retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' }
      }
    }
  })
  async getPaymentIntent(@Param('id') id: string) {
    try {
      const paymentIntent = await this.stripeService.retrievePaymentIntent(id);
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve payment intent: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('refund/:paymentIntentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Amount to refund (optional, full refund if not provided)'
        },
        reason: {
          type: 'string',
          description: 'Reason for refund',
          enum: ['duplicate', 'fraudulent', 'requested_by_customer']
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Refund processed successfully',
    schema: {
      type: 'object',
      properties: {
        refundId: { type: 'string' },
        amount: { type: 'number' },
        status: { type: 'string' }
      }
    }
  })
  async refundPayment(
    @Param('paymentIntentId') paymentIntentId: string,
    @Body() body: { amount?: number; reason?: string }
  ) {
    try {
      const refund = await this.stripeService.refundPayment(
        paymentIntentId, 
        body.amount,
        body.reason
      );

      return {
        refundId: refund.id,
        amount: refund.amount / 100, // Convert from cents
        status: refund.status
      };
    } catch (error) {
      throw new HttpException(
        `Failed to process refund: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
