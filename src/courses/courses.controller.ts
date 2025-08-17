import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CreateCourseDto, CreatePricingDto } from './dto/create-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ 
    status: 201, 
    description: 'Course created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'course-uuid-123' },
        title: { type: 'string', example: 'Web Development Fundamentals' },
        description: { type: 'string', example: 'Learn the basics of web development' },
        instructorId: { type: 'string', example: 'a1c8add5-4cec-4d31-b9db-a1469cfc521d' },
        instructorName: { type: 'string', example: 'John Doe' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createCourse(@Body() createCourseDto: CreateCourseDto, @Req() req) {
    // If instructorName is provided, don't set instructorId
    // If instructorId is provided, use it
    // If neither is provided, use current user as instructorId
    const courseData = {
      ...createCourseDto,
    };

    if (!createCourseDto.instructorId && !createCourseDto.instructorName) {
      courseData.instructorId = req.user.userId;
    }

    return this.coursesService.createCourse(courseData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all courses retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'course-uuid-123' },
          title: { type: 'string', example: 'Web Development Fundamentals' },
          description: { type: 'string', example: 'Learn the basics of web development' },
          instructorId: { type: 'string', example: 'a1c8add5-4cec-4d31-b9db-a1469cfc521d' },
          instructorName: { type: 'string', example: 'John Doe' },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
        }
      }
    }
  })
  async getCourses() {
    return this.coursesService.getCourses();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', description: 'Course ID', example: 'course-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'course-uuid-123' },
        title: { type: 'string', example: 'Web Development Fundamentals' },
        description: { type: 'string', example: 'Learn the basics of web development' },
        instructorId: { type: 'string', example: 'a1c8add5-4cec-4d31-b9db-a1469cfc521d' },
        instructorName: { type: 'string', example: 'John Doe' },
        lessons: { type: 'array', items: { type: 'object' } },
        materials: { type: 'array', items: { type: 'object' } },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseById(@Param('id') id: string) {
    return this.coursesService.getCourseById(id);
  }

  @Get(':id/lessons')
  @ApiOperation({ summary: 'Get lessons by course ID' })
  @ApiParam({ name: 'id', description: 'Course ID', example: 'course-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lessons retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'lesson-uuid-123' },
          title: { type: 'string', example: 'Introduction to HTML' },
          content: { type: 'string', example: 'HTML is the standard markup language...' },
          courseId: { type: 'string', example: 'course-uuid-123' }
        }
      }
    }
  })
  async getLessonsByCourseId(@Param('id') courseId: string) {
    return this.coursesService.getLessonsByCourseId(courseId);
  }

  @Get(':id/materials')
  @ApiOperation({ summary: 'Get materials by course ID' })
  @ApiParam({ name: 'id', description: 'Course ID', example: 'course-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Materials retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'material-uuid-123' },
          title: { type: 'string', example: 'HTML Cheat Sheet' },
          fileUrl: { type: 'string', example: 'https://example.com/html-cheatsheet.pdf' },
          courseId: { type: 'string', example: 'course-uuid-123' }
        }
      }
    }
  })
  async getMaterialsByCourseId(@Param('id') courseId: string) {
    return this.coursesService.getMaterialsByCourseId(courseId);
  }

  @Post(':id/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add lesson to course' })
  @ApiParam({ name: 'id', description: 'Course ID', example: 'course-uuid-123' })
  @ApiResponse({ 
    status: 201, 
    description: 'Lesson added successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'lesson-uuid-123' },
        title: { type: 'string', example: 'Introduction to HTML' },
        content: { type: 'string', example: 'HTML is the standard markup language...' },
        courseId: { type: 'string', example: 'course-uuid-123' }
      }
    }
  })
  async addLesson(
    @Param('id') courseId: string,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.coursesService.addLesson(courseId, createLessonDto);
  }

  @Post(':id/materials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add material to course' })
  @ApiParam({ name: 'id', description: 'Course ID', example: 'course-uuid-123' })
  @ApiResponse({ 
    status: 201, 
    description: 'Material added successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'material-uuid-123' },
        title: { type: 'string', example: 'HTML Cheat Sheet' },
        fileUrl: { type: 'string', example: 'https://example.com/html-cheatsheet.pdf' },
        courseId: { type: 'string', example: 'course-uuid-123' }
      }
    }
  })
  async addMaterial(
    @Param('id') courseId: string,
    @Body() createMaterialDto: CreateMaterialDto,
  ) {
    return this.coursesService.addMaterial(courseId, createMaterialDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course' })
  @ApiParam({ name: 'id', description: 'Course ID', example: 'course-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'course-uuid-123' },
        title: { type: 'string', example: 'Advanced Web Development' },
        description: { type: 'string', example: 'Learn advanced web development techniques' },
        instructorId: { type: 'string', example: 'a1c8add5-4cec-4d31-b9db-a1469cfc521d' },
        instructorName: { type: 'string', example: 'John Doe' }
      }
    }
  })
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.updateCourse(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete course' })
  @ApiParam({ name: 'id', description: 'Course ID', example: 'course-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Course deleted successfully' }
      }
    }
  })
  async deleteCourse(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
  }

  // Course pricing management endpoints
  @Get(':id/pricing')
  @ApiOperation({ summary: 'Get course pricing' })
  @ApiParam({ name: 'id', description: 'Course ID', example: 'course-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course pricing retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'pricing-uuid-123' },
          pricing: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'pricing-uuid-123' },
              price: { type: 'number', example: 99.99 },
              country: { type: 'string', example: 'US' },
            },
          },
        },
      },
    }
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCoursePricing(@Param('id') courseId: string) {
    return this.coursesService.getCoursePricing(courseId);
  }

  @Post(':id/pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add pricing to course' })
  @ApiParam({ name: 'id', description: 'Course ID', example: 'course-uuid-123' })
  @ApiResponse({ 
    status: 201, 
    description: 'Course pricing added successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'course-pricing-uuid-123' },
        courseId: { type: 'string', example: 'course-uuid-123' },
        pricingId: { type: 'string', example: 'pricing-uuid-123' },
        pricing: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'pricing-uuid-123' },
            price: { type: 'number', example: 99.99 },
            country: { type: 'string', example: 'US' },
          },
        },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async addCoursePricing(
    @Param('id') courseId: string,
    @Body() pricingData: CreatePricingDto,
  ) {
    return this.coursesService.addCoursePricing(courseId, pricingData);
  }

  @Delete(':courseId/pricing/:pricingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove pricing from course' })
  @ApiParam({ name: 'courseId', description: 'Course ID', example: 'course-uuid-123' })
  @ApiParam({ name: 'pricingId', description: 'Pricing ID', example: 'pricing-uuid-123' })
  @ApiResponse({ status: 200, description: 'Course pricing removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Course or pricing not found' })
  async removeCoursePricing(
    @Param('courseId') courseId: string,
    @Param('pricingId') pricingId: string,
  ) {
    return this.coursesService.removeCoursePricing(courseId, pricingId);
  }
} 