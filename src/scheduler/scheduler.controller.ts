import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('scheduler')
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('trigger-announcements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger scheduled announcements check (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Scheduled announcements check triggered',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Scheduled announcements check triggered successfully' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async triggerAnnouncements() {
    await this.schedulerService.triggerScheduledAnnouncements();
    return {
      message: 'Scheduled announcements check triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('upcoming-announcements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get upcoming scheduled announcements (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of upcoming scheduled announcements',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'announcement-uuid-123' },
          title: { type: 'string', example: 'Upcoming Course Launch' },
          content: { type: 'string', example: 'New course will be available soon!' },
          type: { type: 'string', example: 'ALL_USERS' },
          displayType: { type: 'string', example: 'EMAIL' },
          startsAt: { type: 'string', example: '2024-01-15T10:00:00.000Z' },
          expiresAt: { type: 'string', example: '2024-01-16T10:00:00.000Z' },
          creator: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Admin User' },
              email: { type: 'string', example: 'admin@example.com' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getUpcomingAnnouncements() {
    return this.schedulerService.getUpcomingScheduledAnnouncements();
  }
}
