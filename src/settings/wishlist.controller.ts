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
  AddToWishlistDto, 
  RemoveFromWishlistDto, 
  WishlistResponseDto 
} from './dto/wishlist.dto';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post('add')
  @ApiOperation({ 
    summary: 'Add course to wishlist',
    description: 'Add a course to the authenticated user\'s wishlist'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Course added to wishlist successfully'
  })
  @ApiResponse({ status: 400, description: 'Course already in wishlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async addToWishlist(
    @Request() req,
    @Body() addToWishlistDto: AddToWishlistDto
  ) {
    return this.settingsService.addToWishlist(req.user.userId, addToWishlistDto);
  }

  @Delete('remove')
  @ApiOperation({ 
    summary: 'Remove course from wishlist',
    description: 'Remove a course from the authenticated user\'s wishlist'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Course removed from wishlist successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not in wishlist' })
  async removeFromWishlist(
    @Request() req,
    @Body() removeFromWishlistDto: RemoveFromWishlistDto
  ) {
    return this.settingsService.removeFromWishlist(req.user.userId, removeFromWishlistDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get user wishlist',
    description: 'Retrieve the authenticated user\'s wishlist with pagination'
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
    description: 'Number of items per page',
    example: 10
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wishlist retrieved successfully',
    type: WishlistResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserWishlist(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10
  ) {
    return this.settingsService.getUserWishlist(req.user.userId, page, limit);
  }

  @Get('check/:courseId')
  @ApiOperation({ 
    summary: 'Check wishlist status',
    description: 'Check if a specific course is in the authenticated user\'s wishlist'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wishlist status checked successfully',
    schema: {
      type: 'object',
      properties: {
        isInWishlist: { type: 'boolean', example: true },
        addedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkWishlistStatus(
    @Request() req,
    @Query('courseId') courseId: string
  ) {
    return this.settingsService.checkWishlistStatus(req.user.userId, courseId);
  }
}
