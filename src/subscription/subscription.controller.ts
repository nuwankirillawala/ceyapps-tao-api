import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  UseGuards,
  HttpException,
  HttpStatus,
  Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './subscription.model';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        planId: {
          type: 'string',
          description: 'ID of the subscription plan'
        },
        paymentMethodId: {
          type: 'string',
          description: 'Payment method ID from Stripe'
        },
        couponCode: {
          type: 'string',
          description: 'Optional coupon code for discount'
        },
        startTrial: {
          type: 'boolean',
          description: 'Whether to start trial if available'
        }
      },
      required: ['planId', 'paymentMethodId']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Subscription created successfully',
    schema: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string' },
        status: { type: 'string' },
        currentPeriodEnd: { type: 'string' }
      }
    }
  })
  async createSubscription(
    @Body() body: { planId: string; paymentMethodId: string; couponCode?: string; startTrial?: boolean },
    @Req() req: any
  ) {
    try {
      const { planId, paymentMethodId, couponCode, startTrial } = body;
      const userId = req.user.userId;

      const subscription = await this.subscriptionService.createSubscription(
        userId,
        planId,
        paymentMethodId,
        couponCode,
        startTrial
      );

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end?.toString()
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create subscription: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('checkout-session')
  @ApiOperation({ summary: 'Create checkout session for subscription' })
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
          description: 'URL to redirect after successful subscription'
        },
        cancelUrl: {
          type: 'string',
          description: 'URL to redirect after cancelled subscription'
        },
        couponCode: {
          type: 'string',
          description: 'Optional coupon code for discount'
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
  async createSubscriptionCheckoutSession(
    @Body() body: { planId: string; successUrl: string; cancelUrl: string; couponCode?: string },
    @Req() req: any
  ) {
    try {
      const { planId, successUrl, cancelUrl, couponCode } = body;
      const userId = req.user.userId;

      const session = await this.subscriptionService.createSubscriptionCheckoutSession(
        planId,
        userId,
        successUrl,
        cancelUrl,
        couponCode
      );

      return {
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create subscription checkout session: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get user subscriptions' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscriptions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string' },
          currentPeriodEnd: { type: 'string' },
          plan: { type: 'object' }
        }
      }
    }
  })
  async getUserSubscriptions(@Req() req: any) {
    try {
      const userId = req.user.userId;
      const subscriptions = await this.subscriptionService.listUserSubscriptions(userId);

      return subscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: (sub as any).current_period_end?.toString(),
        plan: sub.items.data[0]?.price?.product
      }));
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve subscriptions: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' },
        currentPeriodStart: { type: 'string' },
        currentPeriodEnd: { type: 'string' },
        cancelAtPeriodEnd: { type: 'boolean' }
      }
    }
  })
  async getSubscription(@Param('id') id: string) {
    try {
      const subscription = await this.subscriptionService.getSubscription(id);

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: (subscription as any).current_period_start?.toString(),
        currentPeriodEnd: (subscription as any).current_period_end?.toString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve subscription: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethodId: {
          type: 'string',
          description: 'New payment method ID'
        },
        cancelAtPeriodEnd: {
          type: 'boolean',
          description: 'Whether to cancel at period end'
        },
        planId: {
          type: 'string',
          description: 'New plan ID'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription updated successfully',
    schema: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string' },
        status: { type: 'string' },
        cancelAtPeriodEnd: { type: 'boolean' }
      }
    }
  })
  async updateSubscription(
    @Param('id') id: string,
    @Body() body: { paymentMethodId?: string; cancelAtPeriodEnd?: boolean; planId?: string }
  ) {
    try {
      const subscription = await this.subscriptionService.updateSubscription(id, body);

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update subscription: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel subscription (from opushub-api)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Subscription ID to cancel' }
      },
      required: ['id']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription canceled successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'object' }
      }
    }
  })
  async cancelSubscription(@Body() body: { id: string }) {
    try {
      const { id } = body;
      if (!id) {
        throw new HttpException('Subscription ID is required', HttpStatus.BAD_REQUEST);
      }

      const deletedSubscription = await this.subscriptionService.cancelSubscription(id);
      return {
        success: true,
        message: 'Subscription canceled immediately',
        data: { deletedSubscription }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to cancel subscription: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate cancelled subscription' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription reactivated successfully',
    schema: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string' },
        status: { type: 'string' },
        cancelAtPeriodEnd: { type: 'boolean' }
      }
    }
  })
  async reactivateSubscription(@Param('id') id: string) {
    try {
      const subscription = await this.subscriptionService.reactivateSubscription(id);

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      };
    } catch (error) {
      throw new HttpException(
        `Failed to reactivate subscription: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}

