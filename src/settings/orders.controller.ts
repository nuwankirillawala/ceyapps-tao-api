import { 
  Controller, 
  Get, 
  Param, 
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
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get user orders',
    description: 'Retrieve the authenticated user\'s order history with pagination'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Number of orders per page',
    example: 10
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    type: String,
    description: 'Filter orders by status (completed, pending, failed)',
    example: 'completed'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Orders retrieved successfully',
    type: 'object'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserOrders(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: string
  ) {
    return this.settingsService.getUserOrders(req.user.userId, page, limit, status);
  }

  @Get(':orderId')
  @ApiOperation({ 
    summary: 'Get order details',
    description: 'Retrieve detailed information about a specific order'
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order ID',
    example: 'order-uuid-123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Order details retrieved successfully',
    type: 'object'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderDetails(
    @Request() req,
    @Param('orderId') orderId: string
  ) {
    return this.settingsService.getOrderDetails(req.user.userId, orderId);
  }
}
