import { Controller, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { UpdateMaterialDto } from './dto/update-material.dto';

@ApiTags('materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get materials by lesson ID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID', example: 'lesson-uuid-123' })
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
          fileUrl: { type: 'string', example: 'https://example.com/cheatsheet.pdf' },
          courseId: { type: 'string', example: 'course-uuid-123' },
          lessonId: { type: 'string', example: 'lesson-uuid-123' },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
        }
      }
    }
  })
  async getMaterialsByLessonId(@Param('lessonId') lessonId: string) {
    return this.coursesService.getMaterialsByLessonId(lessonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by ID' })
  @ApiParam({ name: 'id', description: 'Material ID', example: 'material-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Material retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'material-uuid-123' },
        title: { type: 'string', example: 'HTML Cheat Sheet' },
        fileUrl: { type: 'string', example: 'https://example.com/cheatsheet.pdf' },
        courseId: { type: 'string', example: 'course-uuid-123' },
        lessonId: { type: 'string', example: 'lesson-uuid-123' },
        course: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'course-uuid-123' },
            title: { type: 'string', example: 'Web Development Fundamentals' }
          }
        },
        lesson: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'lesson-uuid-123' },
            title: { type: 'string', example: 'Introduction to HTML' }
          }
        },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async getMaterial(@Param('id') materialId: string) {
    return this.coursesService.getMaterialById(materialId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a material' })
  @ApiParam({ name: 'id', description: 'Material ID', example: 'material-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Material updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'material-uuid-123' },
        title: { type: 'string', example: 'Updated HTML Cheat Sheet' },
        fileUrl: { type: 'string', example: 'https://example.com/updated-cheatsheet.pdf' },
        courseId: { type: 'string', example: 'course-uuid-123' },
        lessonId: { type: 'string', example: 'lesson-uuid-123' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async updateMaterial(
    @Param('id') materialId: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ) {
    return this.coursesService.updateMaterial(materialId, updateMaterialDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a material' })
  @ApiParam({ name: 'id', description: 'Material ID', example: 'material-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Material deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Material deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async deleteMaterial(@Param('id') materialId: string) {
    return this.coursesService.deleteMaterial(materialId);
  }
}
