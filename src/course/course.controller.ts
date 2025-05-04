import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, CourseStatus } from '.prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('courses')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async createCourse(
    @Request() req,
    @Body()
    data: {
      title: string;
      description?: string;
      code: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    return this.courseService.createCourse(req.user.id, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  async getAllCourses(@Query('status') status?: CourseStatus) {
    return this.courseService.getAllCourses(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  async getCourseById(@Param('id') id: string) {
    return this.courseService.getCourseById(id);
  }

  @Put(':id')
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Update course' })
  async updateCourse(
    @Request() req,
    @Param('id') id: string,
    @Body()
    data: {
      title?: string;
      description?: string;
      code?: string;
      status?: CourseStatus;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    return this.courseService.updateCourse(id, req.user.id, data);
  }

  @Post(':id/enroll')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Enroll in a course' })
  async enrollInCourse(@Request() req, @Param('id') courseId: string) {
    return this.courseService.enrollStudent(courseId, req.user.id);
  }

  @Post(':id/unenroll')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Unenroll from a course' })
  async unenrollFromCourse(@Request() req, @Param('id') courseId: string) {
    return this.courseService.unenrollStudent(courseId, req.user.id);
  }
} 