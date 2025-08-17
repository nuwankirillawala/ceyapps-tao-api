import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

// ===== CART DTOs =====

export class AddToCartDto {
  @ApiProperty({
    description: 'Course ID to add to cart',
    example: 'course-uuid-123'
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  courseId: string;
}

export class CartItemDto {
  @ApiProperty({
    description: 'Cart item ID',
    example: 'cart-item-uuid-123'
  })
  id: string;

  @ApiProperty({
    description: 'Course ID',
    example: 'course-uuid-123'
  })
  courseId: string;

  @ApiProperty({
    description: 'When the item was added to cart',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the item was last updated',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date;
}

export class CartItemWithCourseDto extends CartItemDto {
  @ApiProperty({
    description: 'Course information',
    type: 'object'
  })
  course: {
    id: string;
    title: string;
    description?: string;
    instructorName?: string;
    level: string;
    category: string;
    demoVideoThumbnail?: string;
    demoVideoDuration?: number;
    courseDuration?: string;
    // Note: Price will be fetched from CoursePricing based on user's country
  };
}

export class CartResponseDto {
  @ApiProperty({
    description: 'Cart ID',
    example: 'cart-uuid-123'
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: 'user-uuid-123'
  })
  userId: string;

  @ApiProperty({
    description: 'List of cart items',
    type: [CartItemWithCourseDto]
  })
  items: CartItemWithCourseDto[];

  @ApiProperty({
    description: 'Total number of courses in cart',
    example: 3
  })
  totalCourses: number;

  @ApiProperty({
    description: 'When the cart was created',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the cart was last updated',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date;
}

export class CartSummaryDto {
  @ApiProperty({
    description: 'Total number of courses in cart',
    example: 3
  })
  totalCourses: number;

  @ApiProperty({
    description: 'Estimated total price (will vary by country)',
    example: 99.99
  })
  estimatedTotal: number;

  @ApiProperty({
    description: 'Currency for the estimated total',
    example: 'USD'
  })
  currency: string;
}

// ===== ENROLLMENT DTOs =====

export class EnrollCourseDto {
  @ApiProperty({
    description: 'User ID to enroll (optional, defaults to authenticated user)',
    example: 'user-uuid-123'
  })
  @IsString()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Course ID to enroll in',
    example: 'course-uuid-123'
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @ApiProperty({
    description: 'User\'s country for pricing',
    example: 'US'
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'Payment method ID from Stripe',
    example: 'pm_1234567890'
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'Course ID to update',
    example: 'course-uuid-123'
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @ApiProperty({
    description: 'New quantity for the course',
    example: 2
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class RemoveFromCartDto {
  @ApiProperty({
    description: 'Course ID to remove from cart',
    example: 'course-uuid-123'
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  courseId: string;
}

export class CheckoutDto {
  @ApiProperty({
    description: 'Array of course IDs to checkout',
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  courseIds: string[];

  @ApiProperty({
    description: 'User\'s country for pricing',
    example: 'US'
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'Payment method ID from Stripe',
    example: 'pm_1234567890'
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

// ===== ORDER DTOs =====

export class OrderItemDto {
  @ApiProperty({
    description: 'Order item ID',
    example: 'order-item-uuid-123'
  })
  id: string;

  @ApiProperty({
    description: 'Course ID',
    example: 'course-uuid-123'
  })
  courseId: string;

  @ApiProperty({
    description: 'Course title',
    example: 'Advanced JavaScript Course'
  })
  courseTitle: string;

  @ApiProperty({
    description: 'Course price at time of purchase',
    example: 99.99
  })
  price: number;

  @ApiProperty({
    description: 'Currency of the price',
    example: 'USD'
  })
  currency: string;

  @ApiProperty({
    description: 'When the order item was created',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;
}

export class OrderDto {
  @ApiProperty({
    description: 'Order ID',
    example: 'order-uuid-123'
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: 'user-uuid-123'
  })
  userId: string;

  @ApiProperty({
    description: 'Order status',
    example: 'completed'
  })
  status: string;

  @ApiProperty({
    description: 'Total amount of the order',
    example: 99.99
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Currency of the total amount',
    example: 'USD'
  })
  currency: string;

  @ApiProperty({
    description: 'Stripe payment intent ID',
    example: 'pi_1234567890'
  })
  stripePaymentIntentId: string;

  @ApiProperty({
    description: 'List of order items',
    type: [OrderItemDto]
  })
  items: OrderItemDto[];

  @ApiProperty({
    description: 'When the order was created',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the order was last updated',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date;
}
