import { Controller, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@ApiTags('lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get(':lessonId')
  @ApiOperation({ summary: 'Get lesson by ID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 'lesson-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lesson retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'lesson-uuid-123' },
        title: { type: 'string', example: 'Introduction to HTML' },
        content: { type: 'string', example: 'HTML is the standard markup language...' },
        courseId: { type: 'string', example: 'course-uuid-123' },
        course: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'course-uuid-123' },
            title: { type: 'string', example: 'Web Development Fundamentals' }
          }
        },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async getLesson(@Param('lessonId') lessonId: string) {
    return this.coursesService.getLessonById(lessonId);
  }

  @Patch(':lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a lesson' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 'lesson-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lesson updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'lesson-uuid-123' },
        title: { type: 'string', example: 'Advanced HTML Concepts' },
        content: { type: 'string', example: 'Advanced HTML features...' },
        courseId: { type: 'string', example: 'course-uuid-123' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.coursesService.updateLesson(lessonId, updateLessonDto);
  }

  @Delete(':lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 'lesson-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lesson deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Lesson deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async deleteLesson(@Param('lessonId') lessonId: string) {
    return this.coursesService.deleteLesson(lessonId);
  }
} 