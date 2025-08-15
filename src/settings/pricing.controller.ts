import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { SettingsService } from './settings.service';
import {
  CreatePricingDto,
  UpdatePricingDto,
  CreateCoursePricingDto,
  UpdateCoursePricingDto,
  PricingQueryDto,
  BulkPricingUpdateDto,
  PricingResponseDto,
  CoursePricingResponseDto,
  PricingHistoryResponseDto,
} from './dto/pricing.dto';

@ApiTags('Course Pricing Management')
@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PricingController {
  constructor(private readonly settingsService: SettingsService) {}

  // ===== PRICING MANAGEMENT =====

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new pricing record' })
  @ApiResponse({
    status: 201,
    description: 'Pricing created successfully',
    type: PricingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid pricing data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async createPricing(
    @Body() createPricingDto: CreatePricingDto,
  ): Promise<PricingResponseDto> {
    return this.settingsService.createPricing(createPricingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pricing records with filters' })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region' })
  @ApiQuery({ name: 'currency', required: false, description: 'Filter by currency' })
  @ApiQuery({ name: 'pricingTier', required: false, description: 'Filter by pricing tier' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter' })
  @ApiResponse({
    status: 200,
    description: 'Pricing records retrieved successfully',
    type: [PricingResponseDto],
  })
  async getAllPricing(
    @Query() query: PricingQueryDto,
  ): Promise<PricingResponseDto[]> {
    return this.settingsService.getAllPricing(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific pricing record by ID' })
  @ApiParam({ name: 'id', description: 'Pricing ID' })
  @ApiResponse({
    status: 200,
    description: 'Pricing record retrieved successfully',
    type: PricingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Pricing record not found',
  })
  async getPricingById(@Param('id') id: string): Promise<PricingResponseDto> {
    return this.settingsService.getPricingById(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a pricing record' })
  @ApiParam({ name: 'id', description: 'Pricing ID' })
  @ApiResponse({
    status: 200,
    description: 'Pricing updated successfully',
    type: PricingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Pricing record not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async updatePricing(
    @Param('id') id: string,
    @Body() updatePricingDto: UpdatePricingDto,
  ): Promise<PricingResponseDto> {
    return this.settingsService.updatePricing(id, updatePricingDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a pricing record' })
  @ApiParam({ name: 'id', description: 'Pricing ID' })
  @ApiResponse({
    status: 204,
    description: 'Pricing deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Pricing record not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async deletePricing(@Param('id') id: string): Promise<void> {
    return this.settingsService.deletePricing(id);
  }

  // ===== COURSE PRICING MANAGEMENT =====

  @Post('course')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign pricing to a course' })
  @ApiResponse({
    status: 201,
    description: 'Course pricing created successfully',
    type: CoursePricingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid course pricing data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async createCoursePricing(
    @Body() createCoursePricingDto: CreateCoursePricingDto,
  ): Promise<CoursePricingResponseDto> {
    return this.settingsService.createCoursePricing(createCoursePricingDto);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get pricing for a specific course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region' })
  @ApiResponse({
    status: 200,
    description: 'Course pricing retrieved successfully',
    type: [CoursePricingResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  async getCoursePricing(
    @Param('courseId') courseId: string,
    @Query('country') country?: string,
    @Query('region') region?: string,
  ): Promise<CoursePricingResponseDto[]> {
    return this.settingsService.getCoursePricing(courseId, country, region);
  }

  @Put('course/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update course pricing' })
  @ApiParam({ name: 'id', description: 'Course Pricing ID' })
  @ApiResponse({
    status: 200,
    description: 'Course pricing updated successfully',
    type: CoursePricingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Course pricing not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async updateCoursePricing(
    @Param('id') id: string,
    @Body() updateCoursePricingDto: UpdateCoursePricingDto,
  ): Promise<CoursePricingResponseDto> {
    return this.settingsService.updateCoursePricing(id, updateCoursePricingDto);
  }

  @Delete('course/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove pricing from a course' })
  @ApiParam({ name: 'id', description: 'Course Pricing ID' })
  @ApiResponse({
    status: 204,
    description: 'Course pricing removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Course pricing not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async deleteCoursePricing(@Param('id') id: string): Promise<void> {
    return this.settingsService.deleteCoursePricing(id);
  }

  // ===== BULK OPERATIONS =====

  @Post('bulk-update')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Bulk update pricing for multiple courses' })
  @ApiResponse({
    status: 200,
    description: 'Bulk pricing update completed successfully',
    type: [CoursePricingResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid bulk update data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async bulkUpdatePricing(
    @Body() bulkPricingUpdateDto: BulkPricingUpdateDto,
    @Req() req: any,
  ): Promise<CoursePricingResponseDto[]> {
    const userId = req.user?.userId;
    return this.settingsService.bulkUpdatePricing(bulkPricingUpdateDto, userId);
  }

  // ===== PRICING HISTORY =====

  @Get('history/:courseId')
  @ApiOperation({ summary: 'Get pricing history for a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pricing history retrieved successfully',
    type: [PricingHistoryResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  async getPricingHistory(
    @Param('courseId') courseId: string,
    @Query('country') country?: string,
    @Query('region') region?: string,
    @Query('limit') limit?: number,
  ): Promise<PricingHistoryResponseDto[]> {
    return this.settingsService.getPricingHistory(courseId, country, region, limit);
  }

  // ===== PRICING ANALYTICS =====

  @Get('analytics/summary')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get pricing analytics summary' })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
  @ApiQuery({ name: 'region', required: false, description: 'Filter by region' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for analysis' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for analysis' })
  @ApiResponse({
    status: 200,
    description: 'Pricing analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalCourses: { type: 'number' },
        averagePrice: { type: 'number' },
        priceRange: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' },
          },
        },
        currencyDistribution: { type: 'object' },
        regionalPricing: { type: 'array' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getPricingAnalytics(
    @Query('country') country?: string,
    @Query('region') region?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.settingsService.getPricingAnalytics(country, region, startDate, endDate);
  }

  // ===== PRICING VALIDATION =====

  @Post('validate')
  @ApiOperation({ summary: 'Validate pricing configuration' })
  @ApiResponse({
    status: 200,
    description: 'Pricing validation completed',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async validatePricing(
    @Body() pricingData: CreatePricingDto,
  ) {
    return this.settingsService.validatePricing(pricingData);
  }
}
