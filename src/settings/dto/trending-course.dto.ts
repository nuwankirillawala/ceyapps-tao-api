import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateTrendingCourseDto {
  @ApiProperty({
    description: 'Course ID to add to trending list',
    example: 'course-uuid-123'
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 1,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: 'Whether the trending course is active',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTrendingCourseDto {
  @ApiProperty({
    description: 'Display order for sorting',
    example: 1,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: 'Whether the trending course is active',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TrendingCourseResponseDto {
  @ApiProperty({
    description: 'Trending course ID',
    example: 'trending-uuid-123'
  })
  id: string;

  @ApiProperty({
    description: 'Course ID',
    example: 'course-uuid-123'
  })
  courseId: string;

  @ApiProperty({
    description: 'Course details',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'course-uuid-123' },
      title: { type: 'string', example: 'Advanced Bartending Course' },
      description: { type: 'string', example: 'Learn advanced bartending techniques' },
      instructorName: { type: 'string', example: 'John Doe' },
      level: { type: 'string', example: 'ADVANCED' },
      category: { type: 'string', example: 'BARTENDING' }
    }
  })
  course: {
    id: string;
    title: string;
    description: string | null;
    instructorName: string | null;
    level: string;
    category: string;
  };

  @ApiProperty({
    description: 'Display order for sorting',
    example: 1
  })
  order: number;

  @ApiProperty({
    description: 'Whether the trending course is active',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Trending course creation date',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Trending course last update date',
    example: '2024-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
}
