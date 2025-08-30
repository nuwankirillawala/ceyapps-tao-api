import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete,
  Body, 
  Param, 
  UseGuards,
  HttpException,
  HttpStatus,
  Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto, AttachCardDto } from './cards.model';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('cards')
@Controller('cards')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
  ) {}

  @Post('create-payment-method')
  @ApiOperation({ summary: 'Create a new payment method' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of payment method (card, bank_account, sepa_debit)',
          enum: ['card', 'bank_account', 'sepa_debit']
        },
        card: {
          type: 'object',
          properties: {
            number: { type: 'string', description: 'Card number' },
            expMonth: { type: 'number', description: 'Expiration month' },
            expYear: { type: 'number', description: 'Expiration year' },
            cvc: { type: 'string', description: 'Card CVC' }
          }
        }
      },
      required: ['type', 'card']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Payment method created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string' },
        card: { type: 'object' }
      }
    }
  })
  async createPaymentMethod(
    @Body() body: { type: string; card: any }
  ) {
    try {
      const paymentMethod = await this.cardsService.createPaymentMethod(body.type, body.card);
      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create payment method: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('attach-card')
  @ApiOperation({ summary: 'Attach a payment method to a customer' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'Stripe customer ID'
        },
        paymentMethodId: {
          type: 'string',
          description: 'Payment method ID to attach'
        },
        billingDetails: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                line1: { type: 'string' },
                line2: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                postalCode: { type: 'string' },
                country: { type: 'string' }
              }
            }
          }
        }
      },
      required: ['customerId', 'paymentMethodId']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Payment method attached successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        customerId: { type: 'string' },
        type: { type: 'string' }
      }
    }
  })
  async attachCard(@Body() attachCardData: AttachCardDto) {
    try {
      const paymentMethod = await this.cardsService.attachPaymentMethodToCustomer(
        attachCardData.paymentMethodId,
        attachCardData.customerId
      );

      // Update billing details if provided
      if (attachCardData.billingDetails) {
        await this.cardsService.updatePaymentMethod(paymentMethod.id, {
          billingDetails: attachCardData.billingDetails
        });
      }

      return {
        id: paymentMethod.id,
        customerId: paymentMethod.customer,
        type: paymentMethod.type
      };
    } catch (error) {
      throw new HttpException(
        `Failed to attach payment method: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('payment-method/:id')
  @ApiOperation({ summary: 'Get payment method details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment method retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string' },
        card: { type: 'object' },
        customerId: { type: 'string' }
      }
    }
  })
  async getPaymentMethod(@Param('id') id: string) {
    try {
      const paymentMethod = await this.cardsService.getPaymentMethod(id);
      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card,
        customerId: paymentMethod.customer
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve payment method: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put('payment-method/:id')
  @ApiOperation({ summary: 'Update payment method' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        billingDetails: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                line1: { type: 'string' },
                line2: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                postalCode: { type: 'string' },
                country: { type: 'string' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment method updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string' }
      }
    }
  })
  async updatePaymentMethod(
    @Param('id') id: string,
    @Body() updates: UpdatePaymentMethodDto
  ) {
    try {
      const paymentMethod = await this.cardsService.updatePaymentMethod(id, updates);
      return {
        id: paymentMethod.id,
        type: paymentMethod.type
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update payment method: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete('payment-method/:id')
  @ApiOperation({ summary: 'Detach payment method from customer' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment method detached successfully'
  })
  async detachPaymentMethod(@Param('id') id: string) {
    try {
      await this.cardsService.detachPaymentMethod(id);
      return { message: 'Payment method detached successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to detach payment method: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('customer/:customerId/payment-methods')
  @ApiOperation({ summary: 'List customer payment methods' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment methods retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          card: { type: 'object' }
        }
      }
    }
  })
  async listCustomerPaymentMethods(
    @Param('customerId') customerId: string,
    @Body() body: { type?: string } = {}
  ) {
    try {
      const paymentMethods = await this.cardsService.listCustomerPaymentMethods(
        customerId,
        body.type || 'card'
      );
      
      return paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
      }));
    } catch (error) {
      throw new HttpException(
        `Failed to list payment methods: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('customer/:customerId/default-payment-method')
  @ApiOperation({ summary: 'Set default payment method for customer' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethodId: {
          type: 'string',
          description: 'Payment method ID to set as default'
        }
      },
      required: ['paymentMethodId']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Default payment method set successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        defaultPaymentMethod: { type: 'string' }
      }
    }
  })
  async setDefaultPaymentMethod(
    @Param('customerId') customerId: string,
    @Body() body: { paymentMethodId: string }
  ) {
    try {
      const customer = await this.cardsService.setDefaultPaymentMethod(
        customerId,
        body.paymentMethodId
      );
      
      return {
        id: customer.id,
        defaultPaymentMethod: customer.invoice_settings?.default_payment_method
      };
    } catch (error) {
      throw new HttpException(
        `Failed to set default payment method: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }



  @Get('user/:userId/payment-methods')
  @ApiOperation({ summary: 'Get payment methods for a user based on organization (from opushub-api)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment methods retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          card: { type: 'object' }
        }
      }
    }
  })
  async getPaymentMethods(@Param('userId') userId: string) {
    try {
      const paymentMethods = await this.cardsService.getPaymentMethods(userId);
      return {
        success: true,
        data: paymentMethods,
        message: 'Payment methods retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve payment methods: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('payment-method/:id/remove')
  @ApiOperation({ summary: 'Remove a payment method (from opushub-api)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment method removed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  async removePaymentMethod(@Param('id') paymentMethodId: string) {
    try {
      await this.cardsService.removePaymentMethod(paymentMethodId);
      return {
        success: true,
        message: 'Payment method removed successfully'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to remove payment method: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

