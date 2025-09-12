import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Course ID', example: 'course-uuid-123' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: 'Rating from 1 to 5 stars', example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review title', example: 'Great course for beginners' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Review content', example: 'This course was very helpful and well-structured.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
