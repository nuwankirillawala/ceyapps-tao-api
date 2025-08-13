import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  UseInterceptors, 
  UploadedFile,
  Query
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery,
  ApiConsumes 
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AddPaymentMethodDto, UpdatePaymentMethodDto, SetDefaultPaymentMethodDto } from './dto/payment-method.dto';
import { ContactSupportDto, FaqQueryDto } from './dto/help.dto';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ===== PROFILE SECTION =====

  @Get('profile')
  @ApiOperation({ 
    summary: 'Get user profile',
    description: 'Retrieve the current user\'s profile information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid-123' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        phoneNumber: { type: 'string', example: '+1234567890' },
        profileImage: { type: 'string', example: 'https://example.com/profile.jpg' },
        role: { type: 'string', example: 'STUDENT' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Req() req) {
    return this.settingsService.getProfile(req.user.userId);
  }

  @Put('profile')
  @ApiOperation({ 
    summary: 'Update user profile',
    description: 'Update the current user\'s profile information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid-123' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        phoneNumber: { type: 'string', example: '+1234567890' },
        profileImage: { type: 'string', example: 'https://example.com/profile.jpg' },
        role: { type: 'string', example: 'STUDENT' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.settingsService.updateProfile(req.user.userId, updateProfileDto);
  }

  @Post('profile/image')
  @ApiOperation({ 
    summary: 'Upload profile image',
    description: 'Upload a new profile image for the current user'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 201, 
    description: 'Profile image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-uuid-123' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        phoneNumber: { type: 'string', example: '+1234567890' },
        profileImage: { type: 'string', example: 'https://example.com/profile.jpg' },
        role: { type: 'string', example: 'STUDENT' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseInterceptors(FileInterceptor('image'))
  async uploadProfileImage(@Req() req, @UploadedFile() file: Express.Multer.File) {
    return this.settingsService.uploadProfileImage(req.user.userId, file);
  }

  // ===== SECURITY SECTION =====

  @Post('security/change-password')
  @ApiOperation({ 
    summary: 'Change password',
    description: 'Change the current user\'s password'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password changed successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized or incorrect current password' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.settingsService.changePassword(req.user.userId, changePasswordDto);
  }

  @Post('security/request-password-reset')
  @ApiOperation({ 
    summary: 'Request password reset',
    description: 'Request a password reset link to be sent to the user\'s email'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset link sent',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'If an account with this email exists, a password reset link has been sent' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async requestPasswordReset(@Body('email') email: string) {
    return this.settingsService.requestPasswordReset(email);
  }

  @Post('security/reset-password')
  @ApiOperation({ 
    summary: 'Reset password',
    description: 'Reset password using a valid reset token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid or expired token' })
  async resetPassword(@Body('token') token: string, @Body('newPassword') newPassword: string) {
    return this.settingsService.resetPassword(token, newPassword);
  }

  // ===== BILLING SECTION =====

  @Get('billing/payment-methods')
  @ApiOperation({ 
    summary: 'Get payment methods',
    description: 'Get all payment methods for the current user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment methods retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        paymentMethods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'pm_1234567890' },
              type: { type: 'string', example: 'card' },
              last4: { type: 'string', example: '4242' },
              brand: { type: 'string', example: 'visa' },
              expMonth: { type: 'number', example: 12 },
              expYear: { type: 'number', example: 2025 },
              isDefault: { type: 'boolean', example: true },
              nickname: { type: 'string', example: 'My Credit Card' }
            }
          }
        },
        defaultPaymentMethod: { type: 'string', example: 'pm_1234567890' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentMethods(@Req() req) {
    return this.settingsService.getPaymentMethods(req.user.userId);
  }

  @Post('billing/payment-methods')
  @ApiOperation({ 
    summary: 'Add payment method',
    description: 'Add a new payment method for the current user'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Payment method added successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'pm_newpaymentmethod' },
        type: { type: 'string', example: 'card' },
        isDefault: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Payment method added successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addPaymentMethod(@Req() req, @Body() addPaymentMethodDto: AddPaymentMethodDto) {
    return this.settingsService.addPaymentMethod(req.user.userId, addPaymentMethodDto);
  }

  @Put('billing/payment-methods/:paymentMethodId')
  @ApiOperation({ 
    summary: 'Update payment method',
    description: 'Update a payment method for the current user'
  })
  @ApiParam({ name: 'paymentMethodId', description: 'Payment method ID', example: 'pm_1234567890' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment method updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'pm_1234567890' },
        nickname: { type: 'string', example: 'My Credit Card' },
        isDefault: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Payment method updated successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async updatePaymentMethod(
    @Req() req, 
    @Param('paymentMethodId') paymentMethodId: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto
  ) {
    return this.settingsService.updatePaymentMethod(req.user.userId, paymentMethodId, updatePaymentMethodDto);
  }

  @Post('billing/payment-methods/default')
  @ApiOperation({ 
    summary: 'Set default payment method',
    description: 'Set a payment method as the default for the current user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Default payment method updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Default payment method updated successfully' },
        defaultPaymentMethodId: { type: 'string', example: 'pm_1234567890' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async setDefaultPaymentMethod(@Req() req, @Body() setDefaultPaymentMethodDto: SetDefaultPaymentMethodDto) {
    return this.settingsService.setDefaultPaymentMethod(req.user.userId, setDefaultPaymentMethodDto);
  }

  @Delete('billing/payment-methods/:paymentMethodId')
  @ApiOperation({ 
    summary: 'Remove payment method',
    description: 'Remove a payment method for the current user'
  })
  @ApiParam({ name: 'paymentMethodId', description: 'Payment method ID', example: 'pm_1234567890' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment method removed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Payment method removed successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async removePaymentMethod(@Req() req, @Param('paymentMethodId') paymentMethodId: string) {
    return this.settingsService.removePaymentMethod(req.user.userId, paymentMethodId);
  }

  @Get('billing/purchase-history')
  @ApiOperation({ 
    summary: 'Get purchase history',
    description: 'Get the purchase history for the current user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Purchase history retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'order-uuid-123' },
          status: { type: 'string', example: 'PAID' },
          totalAmount: { type: 'number', example: 99.99 },
          currency: { type: 'string', example: 'USD' },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          orderItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'order-item-uuid-123' },
                price: { type: 'number', example: 99.99 },
                course: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'course-uuid-123' },
                    title: { type: 'string', example: 'Advanced Bartending Course' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPurchaseHistory(@Req() req) {
    return this.settingsService.getPurchaseHistory(req.user.userId);
  }

  // ===== HELP SECTION =====

  @Get('help/faq')
  @ApiOperation({ 
    summary: 'Get FAQ',
    description: 'Get frequently asked questions with optional filtering'
  })
  @ApiQuery({ 
    name: 'query', 
    required: false, 
    type: String,
    description: 'Search query for FAQ',
    example: 'payment method'
  })
  @ApiQuery({ 
    name: 'category', 
    required: false, 
    enum: ['GENERAL', 'TECHNICAL', 'BILLING', 'COURSE_ACCESS', 'PAYMENT', 'ACCOUNT', 'OTHER'],
    description: 'FAQ category filter',
    example: 'PAYMENT'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'FAQ retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        faqs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              question: { type: 'string', example: 'How do I change my password?' },
              answer: { type: 'string', example: 'Go to Settings > Security > Change Password to update your password.' },
              category: { type: 'string', example: 'ACCOUNT' },
              tags: { type: 'array', items: { type: 'string' }, example: ['password', 'security'] }
            }
          }
        },
        total: { type: 'number', example: 5 }
      }
    }
  })
  async getFaq(@Query() faqQueryDto: FaqQueryDto) {
    return this.settingsService.getFaq(faqQueryDto);
  }

  @Post('help/contact')
  @ApiOperation({ 
    summary: 'Contact support',
    description: 'Create a support ticket for the current user'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Support ticket created successfully',
    schema: {
      type: 'object',
      properties: {
        ticketId: { type: 'string', example: 'ticket-uuid-123' },
        message: { type: 'string', example: 'Support ticket created successfully. We will get back to you soon.' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async contactSupport(@Req() req, @Body() contactSupportDto: ContactSupportDto) {
    return this.settingsService.contactSupport(req.user.userId, contactSupportDto);
  }

  @Get('help/support-tickets')
  @ApiOperation({ 
    summary: 'Get support tickets',
    description: 'Get all support tickets for the current user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Support tickets retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ticket-uuid-123' },
          subject: { type: 'string', example: 'Payment Issue' },
          message: { type: 'string', example: 'I am having trouble with my payment method...' },
          category: { type: 'string', example: 'BILLING' },
          status: { type: 'string', example: 'OPEN' },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSupportTickets(@Req() req) {
    return this.settingsService.getSupportTickets(req.user.userId);
  }

  @Get('help/support-tickets/:ticketId')
  @ApiOperation({ 
    summary: 'Get support ticket',
    description: 'Get a specific support ticket for the current user'
  })
  @ApiParam({ name: 'ticketId', description: 'Support ticket ID', example: 'ticket-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Support ticket retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'ticket-uuid-123' },
        subject: { type: 'string', example: 'Payment Issue' },
        message: { type: 'string', example: 'I am having trouble with my payment method...' },
        category: { type: 'string', example: 'BILLING' },
        status: { type: 'string', example: 'OPEN' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Support ticket not found' })
  async getSupportTicket(@Req() req, @Param('ticketId') ticketId: string) {
    return this.settingsService.getSupportTicket(req.user.userId, ticketId);
  }
}
