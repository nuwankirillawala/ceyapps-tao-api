import { Controller, Get, Post, Body, Param, Put, Patch, Delete, UseGuards, Req } from '@nestjs/common';
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
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

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

  @Get('lessons/:lessonId')
  async getLessonById(@Param('lessonId') lessonId: string) {
    return this.coursesService.getLessonById(lessonId);
  }

  @Get('materials/:materialId')
  async getMaterialById(@Param('materialId') materialId: string) {
    return this.coursesService.getMaterialById(materialId);
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
  async getLessonsByCourseId(@Param('id') courseId: string) {
    return this.coursesService.getLessonsByCourseId(courseId);
  }

  @Get(':id/materials')
  async getMaterialsByCourseId(@Param('id') courseId: string) {
    return this.coursesService.getMaterialsByCourseId(courseId);
  }

  @Post(':id/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async addLesson(
    @Param('id') courseId: string,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.coursesService.addLesson(courseId, createLessonDto);
  }

  @Post(':id/materials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async addMaterial(
    @Param('id') courseId: string,
    @Body() createMaterialDto: CreateMaterialDto,
  ) {
    return this.coursesService.addMaterial(courseId, createMaterialDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.updateCourse(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteCourse(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
  }

  // Lesson management endpoints
  @Patch('lessons/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.coursesService.updateLesson(lessonId, updateLessonDto);
  }

  @Delete('lessons/:lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async deleteLesson(@Param('lessonId') lessonId: string) {
    return this.coursesService.deleteLesson(lessonId);
  }

  // Material management endpoints
  @Put('materials/:materialId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async updateMaterial(
    @Param('materialId') materialId: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.coursesService.updateMaterial(materialId, updateMaterialDto);
  }

  @Delete('materials/:materialId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async deleteMaterial(@Param('materialId') materialId: string) {
    return this.coursesService.deleteMaterial(materialId);
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