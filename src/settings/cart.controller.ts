import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Query, 
  UseGuards,
  Request,
  ParseIntPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { 
  AddToCartDto, 
  CheckoutDto,
  CartResponseDto,
  CartSummaryDto
} from './dto/cart.dto';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get user cart',
    description: 'Retrieve the authenticated user\'s cart with all courses'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart retrieved successfully',
    type: CartResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserCart(@Request() req) {
    return this.settingsService.getOrCreateCart(req.user.userId);
  }

  @Post('add')
  @ApiOperation({ 
    summary: 'Add course to cart',
    description: 'Add a course to the authenticated user\'s cart'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Course added to cart successfully'
  })
  @ApiResponse({ status: 400, description: 'Course already in cart' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async addToCart(
    @Request() req,
    @Body() addToCartDto: AddToCartDto
  ) {
    return this.settingsService.addToCart(req.user.userId, addToCartDto);
  }

  @Delete('clear')
  @ApiOperation({ 
    summary: 'Clear cart',
    description: 'Remove all courses from the authenticated user\'s cart'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart cleared successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async clearCart(@Request() req) {
    return this.settingsService.clearCart(req.user.userId);
  }

  @Get('summary')
  @ApiOperation({ 
    summary: 'Get cart summary',
    description: 'Get a summary of the cart including total courses and estimated price'
  })
  @ApiQuery({ 
    name: 'country', 
    required: false, 
    type: String,
    description: 'Country code for pricing calculation',
    example: 'US'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cart summary retrieved successfully',
    type: CartSummaryDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCartSummary(
    @Request() req,
    @Query('country') country: string = 'US'
  ) {
    return this.settingsService.getCartSummary(req.user.userId, country);
  }

  @Post('checkout')
  @ApiOperation({ 
    summary: 'Checkout cart courses',
    description: 'Convert cart courses to an order and process checkout with Stripe'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Checkout completed successfully',
    type: 'object'
  })
  @ApiResponse({ status: 400, description: 'Invalid checkout data or courses not in cart' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async checkout(
    @Request() req,
    @Body() checkoutDto: CheckoutDto
  ) {
    return this.settingsService.checkout(req.user.userId, checkoutDto);
  }
}
