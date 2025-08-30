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
import { PaymentUserService } from './payment-user.service';
import { CreatePaymentUserDto, UpdatePaymentUserDto } from './payment-user.model';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('payment-users')
@Controller('payment-users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentUserController {
  constructor(
    private readonly paymentUserService: PaymentUserService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID from the system'
        },
        email: {
          type: 'string',
          description: 'User email address'
        },
        name: {
          type: 'string',
          description: 'User full name'
        },
        phoneNumber: {
          type: 'string',
          description: 'User phone number'
        },
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
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata'
        }
      },
      required: ['userId', 'email', 'name']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Payment user created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' }
      }
    }
  })
  async createPaymentUser(@Body() paymentUserData: CreatePaymentUserDto) {
    try {
      const customer = await this.paymentUserService.createStripeCustomer(paymentUserData);
      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        stripeCustomerId: customer.id
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create payment user: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':customerId')
  @ApiOperation({ summary: 'Update an existing payment user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'User email address'
        },
        name: {
          type: 'string',
          description: 'User full name'
        },
        phoneNumber: {
          type: 'string',
          description: 'User phone number'
        },
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
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment user updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' }
      }
    }
  })
  async updatePaymentUser(
    @Param('customerId') customerId: string,
    @Body() updates: UpdatePaymentUserDto
  ) {
    try {
      const customer = await this.paymentUserService.updateStripeCustomer(customerId, updates);
      return {
        id: customer.id,
        email: customer.email,
        name: customer.name
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update payment user: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':customerId')
  @ApiOperation({ summary: 'Get payment user details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment user retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'object' }
      }
    }
  })
  async getPaymentUser(@Param('customerId') customerId: string) {
    try {
      const customer = await this.paymentUserService.getStripeCustomer(customerId);
      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve payment user: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':customerId/payment-methods')
  @ApiOperation({ summary: 'Get customer payment methods' })
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
  async getPaymentMethods(@Param('customerId') customerId: string) {
    try {
      const paymentMethods = await this.paymentUserService.getCustomerPaymentMethods(customerId);
      return paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
      }));
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve payment methods: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':customerId/default-payment-method')
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
      const customer = await this.paymentUserService.setDefaultPaymentMethod(
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

  @Delete(':customerId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a payment user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment user deleted successfully'
  })
  async deletePaymentUser(@Param('customerId') customerId: string) {
    try {
      await this.paymentUserService.deleteStripeCustomer(customerId);
      return { message: 'Payment user deleted successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to delete payment user: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all payment users' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment users retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' }
        }
      }
    }
  })
  async listPaymentUsers() {
    try {
      const customers = await this.paymentUserService.listCustomers();
      return customers.map(customer => ({
        id: customer.id,
        email: customer.email,
        name: customer.name
      }));
    } catch (error) {
      throw new HttpException(
        `Failed to list payment users: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
