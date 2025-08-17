import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  HttpException,
  HttpStatus
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
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { EnrollCourseDto } from './dto/cart.dto';

@ApiTags('enrollment')
@Controller('enrollment')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EnrollmentController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ 
    summary: 'Get all enrollments (Admin/Instructor only)',
    description: 'Retrieve all course enrollments with pagination and filtering. Requires ADMIN or INSTRUCTOR role.'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10, max: 100)', example: 10 })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by enrollment status', example: 'ACTIVE' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID', example: 'course-uuid-123' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID', example: 'user-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Enrollments retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        enrollments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'enrollment-uuid-123' },
              userId: { type: 'string', example: 'user-uuid-123' },
              courseId: { type: 'string', example: 'course-uuid-123' },
              status: { type: 'string', example: 'ACTIVE' },
              progress: { type: 'number', example: 0.5 },
              enrolledAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              lastAccessedAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' }
                }
              },
              course: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 50 },
            totalPages: { type: 'number', example: 5 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getAllEnrollments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('courseId') courseId?: string,
    @Query('userId') userId?: string
  ) {
    // Ensure limit doesn't exceed maximum
    const maxLimit = Math.min(limit, 100);
    
    return this.settingsService.getAllEnrollments({
      page,
      limit: maxLimit,
      status,
      courseId,
      userId
    });
  }

  @Get('user/:userId')
  @ApiOperation({ 
    summary: 'Get enrollments by user ID',
    description: 'Retrieve all course enrollments for a specific user. Users can only view their own enrollments unless they have ADMIN/INSTRUCTOR role.'
  })
  @ApiParam({ name: 'userId', description: 'User ID to get enrollments for', example: 'user-uuid-123' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10, max: 100)', example: 10 })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by enrollment status', example: 'ACTIVE' })
  @ApiResponse({ 
    status: 200, 
    description: 'User enrollments retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        enrollments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'enrollment-uuid-123' },
              courseId: { type: 'string', example: 'course-uuid-123' },
              status: { type: 'string', example: 'ACTIVE' },
              progress: { type: 'number', example: 0.5 },
              enrolledAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              lastAccessedAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              course: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  instructorName: { type: 'string' }
                }
              }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 5 },
            totalPages: { type: 'number', example: 1 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserEnrollments(
    @Request() req: any,
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string
  ) {
    const authenticatedUserId = req.user.userId;
    const userRole = req.user.role;

    // Check permissions: Users can only view their own enrollments unless they have elevated role
    if (userId !== authenticatedUserId && userRole !== Role.ADMIN && userRole !== Role.INSTRUCTOR) {
      throw new HttpException(
        'Insufficient permissions to view other users\' enrollments',
        HttpStatus.FORBIDDEN
      );
    }

    // Ensure limit doesn't exceed maximum
    const maxLimit = Math.min(limit, 100);
    
    return this.settingsService.getUserEnrollments(userId, {
      page,
      limit: maxLimit,
      status
    });
  }

  @Get('course/:courseId')
  @ApiOperation({ 
    summary: 'Get enrollments by course ID',
    description: 'Retrieve all user enrollments for a specific course. Requires ADMIN or INSTRUCTOR role, or user must be enrolled in the course.'
  })
  @ApiParam({ name: 'courseId', description: 'Course ID to get enrollments for', example: 'course-uuid-123' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10, max: 100)', example: 10 })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by enrollment status', example: 'ACTIVE' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course enrollments retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        enrollments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'enrollment-uuid-123' },
              userId: { type: 'string', example: 'user-uuid-123' },
              status: { type: 'string', example: 'ACTIVE' },
              progress: { type: 'number', example: 0.5 },
              enrolledAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              lastAccessedAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' }
                }
              }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 3 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseEnrollments(
    @Request() req: any,
    @Param('courseId') courseId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string
  ) {
    const authenticatedUserId = req.user.userId;
    const userRole = req.user.role;

    // Check permissions: Only ADMIN/INSTRUCTOR or enrolled users can view course enrollments
    if (userRole !== Role.ADMIN && userRole !== Role.INSTRUCTOR) {
      // Check if user is enrolled in this course
      const isEnrolled = await this.settingsService.isUserEnrolledInCourse(authenticatedUserId, courseId);
      if (!isEnrolled) {
        throw new HttpException(
          'Insufficient permissions to view course enrollments',
          HttpStatus.FORBIDDEN
        );
      }
    }

    // Ensure limit doesn't exceed maximum
    const maxLimit = Math.min(limit, 100);
    
    return this.settingsService.getCourseEnrollments(courseId, {
      page,
      limit: maxLimit,
      status
    });
  }

  @Get('my-enrollments')
  @ApiOperation({ 
    summary: 'Get current user\'s enrollments',
    description: 'Retrieve all course enrollments for the currently authenticated user.'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10, max: 100)', example: 10 })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by enrollment status', example: 'ACTIVE' })
  @ApiResponse({ 
    status: 200, 
    description: 'User enrollments retrieved successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyEnrollments(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string
  ) {
    const authenticatedUserId = req.user.userId;
    
    // Ensure limit doesn't exceed maximum
    const maxLimit = Math.min(limit, 100);
    
    return this.settingsService.getUserEnrollments(authenticatedUserId, {
      page,
      limit: maxLimit,
      status
    });
  }

  @Get(':enrollmentId')
  @ApiOperation({ 
    summary: 'Get specific enrollment details',
    description: 'Retrieve details of a specific enrollment. Users can only view their own enrollments unless they have ADMIN/INSTRUCTOR role.'
  })
  @ApiParam({ name: 'enrollmentId', description: 'Enrollment ID to retrieve', example: 'enrollment-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Enrollment details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'enrollment-uuid-123' },
        userId: { type: 'string', example: 'user-uuid-123' },
        courseId: { type: 'string', example: 'course-uuid-123' },
        status: { type: 'string', example: 'ACTIVE' },
        progress: { type: 'number', example: 0.5 },
        enrolledAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
        lastAccessedAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
        orderId: { type: 'string', example: 'order-uuid-123' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' }
          }
        },
        course: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            instructorName: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async getEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @Request() req: any
  ) {
    const authenticatedUserId = req.user.userId;
    const userRole = req.user.role;

    // Get enrollment to check permissions
    const enrollment = await this.settingsService.getEnrollmentById(enrollmentId);
    
    if (!enrollment) {
      throw new HttpException('Enrollment not found', HttpStatus.NOT_FOUND);
    }

    // Check permissions: Users can only view their own enrollments unless they have elevated role
    if (enrollment.userId !== authenticatedUserId && userRole !== Role.ADMIN && userRole !== Role.INSTRUCTOR) {
      throw new HttpException(
        'Insufficient permissions to view this enrollment',
        HttpStatus.FORBIDDEN
      );
    }

    return enrollment;
  }

  @Post('enroll')
  @ApiOperation({ 
    summary: 'Enroll in a course',
    description: 'Enroll user in a course. If userId is provided, requires ADMIN/INSTRUCTOR role. If not provided, enrolls the authenticated user.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Enrollment completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Enrollment completed successfully' },
        orderId: { type: 'string', example: 'order-uuid-123' },
        courseId: { type: 'string', example: 'course-uuid-123' },
        price: { type: 'number', example: 99.99 },
        currency: { type: 'string', example: 'USD' },
        stripePaymentIntentId: { type: 'string', example: 'pi_1234567890' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid enrollment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 409, description: 'User already enrolled in this course' })
  async enrollCourse(
    @Request() req,
    @Body() enrollCourseDto: EnrollCourseDto
  ) {
    const { userId: requestedUserId, courseId, country, paymentMethodId } = enrollCourseDto;
    const authenticatedUserId = req.user.userId;
    const userRole = req.user.role;

    // Determine which user ID to use
    let targetUserId: string;

    if (requestedUserId) {
      // If userId is provided, check if it's the same as authenticated user
      if (requestedUserId === authenticatedUserId) {
        // User is providing their own ID - this is allowed for all roles
        targetUserId = authenticatedUserId;
      } else {
        // User is trying to enroll someone else - check permissions
        if (userRole !== Role.ADMIN && userRole !== Role.INSTRUCTOR) {
          throw new HttpException(
            'Insufficient permissions to enroll other users',
            HttpStatus.FORBIDDEN
          );
        }
        targetUserId = requestedUserId;
      }
    } else {
      // No userId provided, use authenticated user
      targetUserId = authenticatedUserId;
    }

    return this.settingsService.enrollCourse(targetUserId, {
      courseId,
      country,
      paymentMethodId
    });
  }

  @Post('admin/enroll')
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ 
    summary: 'Admin enrollment (enroll any user in a course)',
    description: 'Admin/Instructor endpoint to enroll any user in a course. Requires ADMIN or INSTRUCTOR role.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Enrollment completed successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid enrollment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Course or user not found' })
  @ApiResponse({ status: 409, description: 'User already enrolled in this course' })
  async adminEnrollUser(
    @Request() req,
    @Body() enrollCourseDto: EnrollCourseDto
  ) {
    const { userId, courseId, country, paymentMethodId } = enrollCourseDto;

    if (!userId) {
      throw new HttpException(
        'User ID is required for admin enrollment',
        HttpStatus.BAD_REQUEST
      );
    }

    // Additional validation for admin enrollment
    // Could include checking if the target user exists, etc.

    return this.settingsService.enrollCourse(userId, {
      courseId,
      country,
      paymentMethodId
    });
  }
}
