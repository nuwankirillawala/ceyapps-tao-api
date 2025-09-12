import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CourseReviewsService } from './course-reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('course-reviews')
@Controller('course-reviews')
export class CourseReviewsController {
  constructor(private readonly courseReviewsService: CourseReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course review' })
  @ApiResponse({ 
    status: 201, 
    description: 'Review created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'review-uuid-123' },
        courseId: { type: 'string', example: 'course-uuid-123' },
        userId: { type: 'string', example: 'user-uuid-123' },
        rating: { type: 'number', example: 4 },
        title: { type: 'string', example: 'Great course!' },
        content: { type: 'string', example: 'This course was very helpful.' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-uuid-123' },
            name: { type: 'string', example: 'John Doe' },
            profileImage: { type: 'string', example: 'https://example.com/avatar.jpg' },
          },
        },
      },
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 409, description: 'User has already reviewed this course' })
  async createReview(@Body() createReviewDto: CreateReviewDto, @Req() req) {
    return this.courseReviewsService.createReview(createReviewDto, req.user.userId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get reviews for a specific course' })
  @ApiParam({ name: 'courseId', description: 'Course ID', example: 'course-uuid-123' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'Reviews retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        reviews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'review-uuid-123' },
              courseId: { type: 'string', example: 'course-uuid-123' },
              userId: { type: 'string', example: 'user-uuid-123' },
              rating: { type: 'number', example: 4 },
              title: { type: 'string', example: 'Great course!' },
              content: { type: 'string', example: 'This course was very helpful.' },
              createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'user-uuid-123' },
                  name: { type: 'string', example: 'John Doe' },
                  profileImage: { type: 'string', example: 'https://example.com/avatar.jpg' },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 3 },
          },
        },
      },
    }
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseReviews(
    @Param('courseId') courseId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.courseReviewsService.getCourseReviews(courseId, page, limit);
  }

  @Get('course/:courseId/stats')
  @ApiOperation({ summary: 'Get review statistics for a specific course' })
  @ApiParam({ name: 'courseId', description: 'Course ID', example: 'course-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Review statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        averageRating: { type: 'number', example: 4.2 },
        totalReviews: { type: 'number', example: 25 },
        ratingDistribution: {
          type: 'object',
          properties: {
            5: { type: 'number', example: 10 },
            4: { type: 'number', example: 8 },
            3: { type: 'number', example: 4 },
            2: { type: 'number', example: 2 },
            1: { type: 'number', example: 1 },
          },
        },
      },
    }
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseReviewStats(@Param('courseId') courseId: string) {
    return this.courseReviewsService.getCourseReviewStats(courseId);
  }

  @Get('course/:courseId/user-review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user review for a specific course' })
  @ApiParam({ name: 'courseId', description: 'Course ID', example: 'course-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'User review retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'review-uuid-123' },
        courseId: { type: 'string', example: 'course-uuid-123' },
        userId: { type: 'string', example: 'user-uuid-123' },
        rating: { type: 'number', example: 4 },
        title: { type: 'string', example: 'Great course!' },
        content: { type: 'string', example: 'This course was very helpful.' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-uuid-123' },
            name: { type: 'string', example: 'John Doe' },
            profileImage: { type: 'string', example: 'https://example.com/avatar.jpg' },
          },
        },
      },
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found or user has not reviewed this course' })
  async getUserReview(@Param('courseId') courseId: string, @Req() req) {
    return this.courseReviewsService.getUserReview(courseId, req.user.userId);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reviews (Admin only)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 50 })
  @ApiResponse({ 
    status: 200, 
    description: 'All reviews retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        reviews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'review-uuid-123' },
              courseId: { type: 'string', example: 'course-uuid-123' },
              userId: { type: 'string', example: 'user-uuid-123' },
              rating: { type: 'number', example: 4 },
              title: { type: 'string', example: 'Great course!' },
              content: { type: 'string', example: 'This course was very helpful.' },
              createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'user-uuid-123' },
                  name: { type: 'string', example: 'John Doe' },
                  profileImage: { type: 'string', example: 'https://example.com/avatar.jpg' },
                },
              },
              course: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'course-uuid-123' },
                  title: { type: 'string', example: 'Bartending Basics' },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 50 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 2 },
          },
        },
      },
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllReviews(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.courseReviewsService.getAllReviews(page, limit);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all review statistics (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Review statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalReviews: { type: 'number', example: 150 },
        averageRating: { type: 'number', example: 4.2 },
        totalCourses: { type: 'number', example: 25 },
        recentReviews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'review-uuid-123' },
              title: { type: 'string', example: 'Great course!' },
              content: { type: 'string', example: 'This course was very helpful.' },
              rating: { type: 'number', example: 4 },
              createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'user-uuid-123' },
                  name: { type: 'string', example: 'John Doe' },
                },
              },
              course: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'course-uuid-123' },
                  title: { type: 'string', example: 'Bartending Basics' },
                },
              },
            },
          },
        },
        topRatedCourses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              courseId: { type: 'string', example: 'course-uuid-123' },
              courseTitle: { type: 'string', example: 'Bartending Basics' },
              averageRating: { type: 'number', example: 4.8 },
              totalReviews: { type: 'number', example: 25 },
            },
          },
        },
      },
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllReviewsStats() {
    return this.courseReviewsService.getAllReviewsStats();
  }

  @Put(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a course review' })
  @ApiParam({ name: 'reviewId', description: 'Review ID', example: 'review-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Review updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'review-uuid-123' },
        courseId: { type: 'string', example: 'course-uuid-123' },
        userId: { type: 'string', example: 'user-uuid-123' },
        rating: { type: 'number', example: 5 },
        title: { type: 'string', example: 'Excellent course!' },
        content: { type: 'string', example: 'This course exceeded my expectations.' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-uuid-123' },
            name: { type: 'string', example: 'John Doe' },
            profileImage: { type: 'string', example: 'https://example.com/avatar.jpg' },
          },
        },
      },
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Req() req,
  ) {
    return this.courseReviewsService.updateReview(reviewId, updateReviewDto, req.user.userId);
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a course review' })
  @ApiParam({ name: 'reviewId', description: 'Review ID', example: 'review-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Review deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Review deleted successfully' },
      },
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(@Param('reviewId') reviewId: string, @Req() req) {
    return this.courseReviewsService.deleteReview(reviewId, req.user.userId);
  }
}
