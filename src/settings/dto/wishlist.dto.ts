import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

// ===== WISHLIST DTOs =====

export class AddToWishlistDto {
  @ApiProperty({
    description: 'Course ID to add to wishlist',
    example: 'course-uuid-123'
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  courseId: string;
}

export class WishlistItemDto {
  @ApiProperty({
    description: 'Wishlist item ID',
    example: 'wishlist-uuid-123'
  })
  id: string;

  @ApiProperty({
    description: 'Course ID',
    example: 'course-uuid-123'
  })
  courseId: string;

  @ApiProperty({
    description: 'User ID',
    example: 'user-uuid-123'
  })
  userId: string;

  @ApiProperty({
    description: 'When the item was added to wishlist',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the item was last updated',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date;
}

export class WishlistItemWithCourseDto extends WishlistItemDto {
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
  };
}

export class WishlistResponseDto {
  @ApiProperty({
    description: 'List of wishlist items',
    type: [WishlistItemWithCourseDto]
  })
  items: WishlistItemWithCourseDto[];

  @ApiProperty({
    description: 'Total number of wishlist items',
    example: 5
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 1
  })
  totalPages: number;
}

export class RemoveFromWishlistDto {
  @ApiProperty({
    description: 'Course ID to remove from wishlist',
    example: 'course-uuid-123'
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  courseId: string;
}
