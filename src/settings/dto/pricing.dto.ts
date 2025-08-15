import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsDateString, Min, Max, IsEnum, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum PricingTier {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR'
}

export enum ChangeReason {
  PRICE_UPDATE = 'PRICE_UPDATE',
  DISCOUNT = 'DISCOUNT',
  REGIONAL_ADJUSTMENT = 'REGIONAL_ADJUSTMENT',
  CURRENCY_CHANGE = 'CURRENCY_CHANGE',
  PROMOTIONAL = 'PROMOTIONAL',
  SEASONAL = 'SEASONAL'
}

// ===== PRICING DTOs =====

export class CreatePricingDto {
  @ApiProperty({
    description: 'Price amount',
    example: 99.99
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Country code for this pricing',
    example: 'US'
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
    required: false
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Region for this pricing',
    example: 'North America',
    required: false
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiProperty({
    description: 'Pricing tier',
    example: 'BASIC',
    required: false
  })
  @IsString()
  @IsOptional()
  pricingTier?: string;

  @ApiProperty({
    description: 'Discount percentage (0-100)',
    example: 10,
    minimum: 0,
    maximum: 100,
    required: false
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount?: number;

  @ApiProperty({
    description: 'Valid from date',
    example: '2024-01-01T00:00:00Z',
    required: false
  })
  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @ApiProperty({
    description: 'Valid to date',
    example: '2024-12-31T23:59:59Z',
    required: false
  })
  @IsDateString()
  @IsOptional()
  validTo?: string;
}

export class UpdatePricingDto {
  @ApiProperty({
    description: 'Price amount',
    example: 99.99,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    description: 'Country code for this pricing',
    example: 'US',
    required: false
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
    required: false
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Region for this pricing',
    example: 'North America',
    required: false
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiProperty({
    description: 'Pricing tier',
    example: 'BASIC',
    required: false
  })
  @IsString()
  @IsOptional()
  pricingTier?: string;

  @ApiProperty({
    description: 'Discount percentage (0-100)',
    example: 10,
    minimum: 0,
    maximum: 100,
    required: false
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount?: number;

  @ApiProperty({
    description: 'Valid from date',
    example: '2024-01-01T00:00:00Z',
    required: false
  })
  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @ApiProperty({
    description: 'Valid to date',
    example: '2024-12-31T23:59:59Z',
    required: false
  })
  @IsOptional()
  validTo?: string;

  @ApiProperty({
    description: 'Whether this pricing is active',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateCoursePricingDto {
  @ApiProperty({
    description: 'Course ID',
    example: 'course-uuid-123'
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    description: 'Pricing ID',
    example: 'pricing-uuid-123'
  })
  @IsString()
  @IsNotEmpty()
  pricingId: string;

  @ApiProperty({
    description: 'Whether this course pricing is active',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCoursePricingDto {
  @ApiProperty({
    description: 'Course ID',
    example: 'course-uuid-123',
    required: false
  })
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiProperty({
    description: 'Pricing ID',
    example: 'pricing-uuid-123',
    required: false
  })
  @IsString()
  @IsOptional()
  pricingId?: string;

  @ApiProperty({
    description: 'Whether this course pricing is active',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class PricingQueryDto {
  @ApiProperty({
    description: 'Country code to filter by',
    example: 'US',
    required: false
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Region to filter by',
    example: 'North America',
    required: false
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiProperty({
    description: 'Currency to filter by',
    example: 'USD',
    required: false
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Pricing tier to filter by',
    enum: PricingTier,
    example: PricingTier.BASIC,
    required: false
  })
  @IsEnum(PricingTier)
  @IsOptional()
  pricingTier?: PricingTier;

  @ApiProperty({
    description: 'Whether to include only active pricing',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Minimum price to filter by',
    example: 50,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiProperty({
    description: 'Maximum price to filter by',
    example: 200,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;
}

export class BulkPricingUpdateDto {
  @ApiProperty({
    description: 'Array of course IDs to update pricing for',
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  courseIds: string[];

  @ApiProperty({
    description: 'Pricing data to apply to all courses',
    type: CreatePricingDto
  })
  @ValidateNested()
  @Type(() => CreatePricingDto)
  pricing: CreatePricingDto;

  @ApiProperty({
    description: 'Reason for the bulk update',
    example: 'PRICE_UPDATE'
  })
  @IsString()
  @IsOptional()
  changeReason?: string;
}

// ===== RESPONSE DTOs =====

export class PricingResponseDto {
  @ApiProperty({
    description: 'Pricing ID',
    example: 'pricing-uuid-123'
  })
  id: string;

  @ApiProperty({
    description: 'Price amount',
    example: 99.99
  })
  price: number;

  @ApiProperty({
    description: 'Country code',
    example: 'US'
  })
  country: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD'
  })
  currency: string;

  @ApiProperty({
    description: 'Region',
    example: 'North America'
  })
  region?: string;

  @ApiProperty({
    description: 'Whether this pricing is active',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Pricing tier',
    example: 'BASIC'
  })
  pricingTier?: string;

  @ApiProperty({
    description: 'Discount percentage',
    example: 10
  })
  discount?: number;

  @ApiProperty({
    description: 'Original price before discount',
    example: 99.99
  })
  originalPrice?: number;

  @ApiProperty({
    description: 'Valid from date',
    example: '2024-01-01T00:00:00Z'
  })
  validFrom?: Date;

  @ApiProperty({
    description: 'Valid to date',
    example: '2024-12-31T23:59:59Z'
  })
  validTo?: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00Z'
  })
  updatedAt: Date;
}

export class CoursePricingResponseDto {
  @ApiProperty({
    description: 'Course pricing ID',
    example: 'course-pricing-uuid-123'
  })
  id: string;

  @ApiProperty({
    description: 'Course ID',
    example: 'course-uuid-123'
  })
  courseId: string;

  @ApiProperty({
    description: 'Pricing ID',
    example: 'pricing-uuid-123'
  })
  pricingId: string;

  @ApiProperty({
    description: 'Whether this course pricing is active',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00Z'
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Course details',
    type: 'object'
  })
  course?: any;

  @ApiProperty({
    description: 'Pricing details',
    type: 'object'
  })
  pricing?: any;
}

export class PricingHistoryResponseDto {
  @ApiProperty({
    description: 'Pricing history ID',
    example: 'pricing-history-uuid-123'
  })
  id: string;

  @ApiProperty({
    description: 'Course ID',
    example: 'course-uuid-123'
  })
  courseId: string;

  @ApiProperty({
    description: 'Old price',
    example: 99.99
  })
  oldPrice: number;

  @ApiProperty({
    description: 'New price',
    example: 89.99
  })
  newPrice: number;

  @ApiProperty({
    description: 'Currency',
    example: 'USD'
  })
  currency: string;

  @ApiProperty({
    description: 'Country',
    example: 'US'
  })
  country: string;

  @ApiProperty({
    description: 'Region',
    example: 'North America'
  })
  region?: string;

  @ApiProperty({
    description: 'Reason for change',
    example: 'DISCOUNT'
  })
  changeReason?: string;

  @ApiProperty({
    description: 'User ID who made the change',
    example: 'user-uuid-123'
  })
  changedBy?: string;

  @ApiProperty({
    description: 'When change was made',
    example: '2024-01-01T00:00:00Z'
  })
  changedAt: Date;
}
