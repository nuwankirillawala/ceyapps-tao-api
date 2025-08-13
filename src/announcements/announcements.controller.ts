import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CreateAnnouncementDto, CreatePublicAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@ApiTags('announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new announcement (Admin only)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Announcement created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'announcement-uuid-123' },
        title: { type: 'string', example: 'New Course Available' },
        content: { type: 'string', example: 'We have added a new advanced mixology course.' },
        type: { type: 'string', example: 'ALL_USERS' },
        priority: { type: 'string', example: 'P1' },
        category: { type: 'string', example: 'GENERAL' },
        displayType: { type: 'string', example: 'BANNER' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createAnnouncement(@Body() createAnnouncementDto: CreateAnnouncementDto, @Req() req) {
    return this.announcementsService.createAnnouncement(createAnnouncementDto, req.user.userId);
  }

  @Post('public')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a public announcement (Admin only)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Public announcement created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'announcement-uuid-123' },
        title: { type: 'string', example: 'Welcome to Tao Platform' },
        content: { type: 'string', example: 'Welcome to our bartending and mixology learning platform!' },
        type: { type: 'string', example: 'PUBLIC_USERS' },
        priority: { type: 'string', example: 'P1' },
        category: { type: 'string', example: 'GENERAL' },
        displayType: { type: 'string', example: 'BANNER' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createPublicAnnouncement(@Body() createPublicAnnouncementDto: CreatePublicAnnouncementDto, @Req() req) {
    return this.announcementsService.createPublicAnnouncement(createPublicAnnouncementDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all announcements (Admin) or user-specific announcements (Users)',
    description: 'Retrieve announcements with optional filters. Admins can see all announcements with filters, users see their relevant announcements, and public users see only public announcements.'
  })
  @ApiQuery({ 
    name: 'isActive', 
    required: false, 
    type: Boolean,
    description: 'Filter by active status (true/false)',
    example: true
  })
  @ApiQuery({ 
    name: 'priority', 
    required: false, 
    enum: ['P1', 'P2', 'P3'],
    description: 'Filter by priority level',
    example: 'P1'
  })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    enum: ['ALL_USERS', 'PUBLIC_USERS', 'REGISTERED_USERS', 'COURSE_STUDENTS', 'INSTRUCTORS', 'SPECIFIC_ROLES', 'SPECIFIC_USERS', 'PROMOTIONAL', 'SYSTEM_UPDATE'],
    description: 'Filter by announcement type',
    example: 'ALL_USERS'
  })
  @ApiQuery({ 
    name: 'category', 
    required: false, 
    enum: ['GENERAL', 'PROMOTION', 'COURSE_UPDATE', 'SYSTEM_MAINTENANCE', 'NEW_FEATURE', 'INSTRUCTOR_ANNOUNCEMENT'],
    description: 'Filter by announcement category',
    example: 'GENERAL'
  })
  @ApiQuery({ 
    name: 'displayType', 
    required: false, 
    enum: ['BANNER', 'NOTIFICATION', 'SIDEBAR', 'EMAIL', 'IN_APP'],
    description: 'Filter by display type',
    example: 'BANNER'
  })
  @ApiQuery({ 
    name: 'createdBy', 
    required: false, 
    type: String,
    description: 'Filter by creator user ID',
    example: 'user-uuid-123'
  })
  @ApiQuery({ 
    name: 'courseId', 
    required: false, 
    type: String,
    description: 'Filter by course ID',
    example: 'course-uuid-123'
  })
  @ApiQuery({ 
    name: 'expiresBefore', 
    required: false, 
    type: String,
    description: 'Filter announcements that expire before this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.000Z'
  })
  @ApiQuery({ 
    name: 'expiresAfter', 
    required: false, 
    type: String,
    description: 'Filter announcements that expire after this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({ 
    name: 'startsBefore', 
    required: false, 
    type: String,
    description: 'Filter announcements that start before this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59.000Z'
  })
  @ApiQuery({ 
    name: 'startsAfter', 
    required: false, 
    type: String,
    description: 'Filter announcements that start after this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({ 
    name: 'tags', 
    required: false, 
    type: String,
    description: 'Filter by tags (comma-separated)',
    example: 'new-course,mixology,advanced'
  })
  @ApiQuery({ 
    name: 'showAsBanner', 
    required: false, 
    type: Boolean,
    description: 'Filter by banner display status (true/false)',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of announcements retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'announcement-uuid-123' },
          title: { type: 'string', example: 'New Course Available' },
          content: { type: 'string', example: 'We have added a new advanced mixology course.' },
          type: { type: 'string', example: 'ALL_USERS' },
          priority: { type: 'string', example: 'P1' },
          category: { type: 'string', example: 'GENERAL' },
          displayType: { type: 'string', example: 'BANNER' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
        }
      }
    }
  })
  async getAllAnnouncements(
    @Req() req,
    @Query('isActive') isActive?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('displayType') displayType?: string,
    @Query('createdBy') createdBy?: string,
    @Query('courseId') courseId?: string,
    @Query('expiresBefore') expiresBefore?: string,
    @Query('expiresAfter') expiresAfter?: string,
    @Query('startsBefore') startsBefore?: string,
    @Query('startsAfter') startsAfter?: string,
    @Query('tags') tags?: string,
    @Query('showAsBanner') showAsBanner?: string,
  ) {
    // If user is authenticated, check if they're admin
    if (req.user) {
      const isAdmin = req.user.role === 'ADMIN';
      
      if (isAdmin) {
        // Admin can see all announcements with filters
        const filters: any = {};
        
        if (isActive !== undefined) {
          filters.isActive = isActive === 'true';
        }
        if (priority) {
          filters.priority = priority;
        }
        if (type) {
          filters.type = type;
        }
        if (category) {
          filters.category = category;
        }
        if (displayType) {
          filters.displayType = displayType;
        }
        if (createdBy) {
          filters.createdBy = createdBy;
        }
        if (courseId) {
          filters.courseId = courseId;
        }
        if (expiresBefore) {
          filters.expiresBefore = new Date(expiresBefore);
        }
        if (expiresAfter) {
          filters.expiresAfter = new Date(expiresAfter);
        }
        if (startsBefore) {
          filters.startsBefore = new Date(startsBefore);
        }
        if (startsAfter) {
          filters.startsAfter = new Date(startsAfter);
        }
        if (tags) {
          filters.tags = tags.split(',');
        }
        if (showAsBanner !== undefined) {
          filters.showAsBanner = showAsBanner === 'true';
        }
        
        return this.announcementsService.getAnnouncementsForAdmin(filters);
      } else {
        // Regular users see only their relevant announcements
        return this.announcementsService.getAnnouncementsForUser(req.user.userId, req.user.role);
      }
    }
    
    // Unauthenticated users see only active, non-expired PUBLIC_USERS announcements
    return this.announcementsService.getAnnouncementsForPublic();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all announcements without any filters (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'All announcements retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'announcement-uuid-123' },
          title: { type: 'string', example: 'New Course Available' },
          content: { type: 'string', example: 'We have added a new advanced mixology course.' },
          type: { type: 'string', example: 'ALL_USERS' },
          priority: { type: 'string', example: 'P1' },
          category: { type: 'string', example: 'GENERAL' },
          displayType: { type: 'string', example: 'BANNER' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getAllAnnouncementsUnfiltered() {
    return this.announcementsService.getAllAnnouncements();
  }

  @Get('public')
  @ApiOperation({ 
    summary: 'Get announcements for public users (no authentication required)',
    description: 'Retrieve announcements specifically for non-registered users. These are announcements marked as PUBLIC_USERS type and are visible to anyone visiting the platform.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Public announcements retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'announcement-uuid-123' },
          title: { type: 'string', example: 'Welcome to Tao Platform' },
          content: { type: 'string', example: 'Welcome to our bartending and mixology learning platform!' },
          type: { type: 'string', example: 'PUBLIC_USERS' },
          priority: { type: 'string', example: 'P1' },
          category: { type: 'string', example: 'GENERAL' },
          displayType: { type: 'string', example: 'BANNER' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
        }
      }
    }
  })
  async getPublicAnnouncements() {
    return this.announcementsService.getAnnouncementsForPublic();
  }

  @Get('banners')
  @ApiOperation({ summary: 'Get banner announcements for homepage' })
  @ApiResponse({ 
    status: 200, 
    description: 'Banner announcements retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'announcement-uuid-123' },
          title: { type: 'string', example: 'Welcome to Tao Platform' },
          content: { type: 'string', example: 'Welcome to our bartending and mixology learning platform!' },
          type: { type: 'string', example: 'PUBLIC_USERS' },
          priority: { type: 'string', example: 'P1' },
          category: { type: 'string', example: 'GENERAL' },
          displayType: { type: 'string', example: 'BANNER' },
          showAsBanner: { type: 'boolean', example: true },
          actionUrl: { type: 'string', example: '/courses' },
          actionText: { type: 'string', example: 'Browse Courses' },
          imageUrl: { type: 'string', example: 'https://example.com/banner.jpg' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
        }
      }
    }
  })
  async getBannerAnnouncements() {
    return this.announcementsService.getBannerAnnouncements();
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get popular announcement tags' })
  @ApiResponse({ 
    status: 200, 
    description: 'Popular tags retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tag: { type: 'string', example: 'new-course' },
          count: { type: 'number', example: 5 }
        }
      }
    }
  })
  async getPopularTags() {
    return this.announcementsService.getPopularTags();
  }

  @Get('tags/:tags')
  @ApiOperation({ summary: 'Get announcements by tags' })
  @ApiParam({ name: 'tags', description: 'Comma-separated tags', example: 'new-course,mixology' })
  @ApiResponse({ 
    status: 200, 
    description: 'Announcements by tags retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'announcement-uuid-123' },
          title: { type: 'string', example: 'New Course Available' },
          content: { type: 'string', example: 'We have added a new advanced mixology course.' },
          tags: { type: 'array', items: { type: 'string' }, example: ['new-course', 'mixology'] },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
        }
      }
    }
  })
  async getAnnouncementsByTags(@Param('tags') tags: string) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    return this.announcementsService.getAnnouncementsByTags(tagArray);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get announcements for the authenticated user' })
  @ApiResponse({ 
    status: 200, 
    description: 'User-specific announcements retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'announcement-uuid-123' },
          title: { type: 'string', example: 'New Course Available' },
          content: { type: 'string', example: 'We have added a new advanced mixology course.' },
          type: { type: 'string', example: 'ALL_USERS' },
          priority: { type: 'string', example: 'P1' },
          category: { type: 'string', example: 'GENERAL' },
          displayType: { type: 'string', example: 'BANNER' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserAnnouncements(@Req() req) {
    return this.announcementsService.getAnnouncementsForUser(req.user.userId, req.user.role);
  }

  @Get('view/:id')
  @ApiOperation({ summary: 'View a single announcement by ID' })
  @ApiParam({ name: 'id', description: 'Announcement ID', example: 'announcement-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Announcement retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'announcement-uuid-123' },
        title: { type: 'string', example: 'New Course Available' },
        content: { type: 'string', example: 'We have added a new advanced mixology course.' },
        type: { type: 'string', example: 'ALL_USERS' },
        priority: { type: 'string', example: 'P1' },
        category: { type: 'string', example: 'GENERAL' },
        displayType: { type: 'string', example: 'BANNER' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async viewAnnouncement(@Param('id') id: string) {
    return this.announcementsService.getAnnouncementById(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Announcement ID', example: 'announcement-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Announcement retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'announcement-uuid-123' },
        title: { type: 'string', example: 'New Course Available' },
        content: { type: 'string', example: 'We have added a new advanced mixology course.' },
        type: { type: 'string', example: 'ALL_USERS' },
        priority: { type: 'string', example: 'P1' },
        category: { type: 'string', example: 'GENERAL' },
        displayType: { type: 'string', example: 'BANNER' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async getAnnouncementById(@Param('id') id: string) {
    return this.announcementsService.getAnnouncementById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an announcement (Admin only)' })
  @ApiParam({ name: 'id', description: 'Announcement ID', example: 'announcement-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Announcement updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'announcement-uuid-123' },
        title: { type: 'string', example: 'Updated Course Available' },
        content: { type: 'string', example: 'We have updated the advanced mixology course.' },
        type: { type: 'string', example: 'ALL_USERS' },
        priority: { type: 'string', example: 'P1' },
        category: { type: 'string', example: 'GENERAL' },
        displayType: { type: 'string', example: 'BANNER' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.updateAnnouncement(id, updateAnnouncementDto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle announcement active status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Announcement ID', example: 'announcement-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Announcement status toggled successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'announcement-uuid-123' },
        title: { type: 'string', example: 'New Course Available' },
        content: { type: 'string', example: 'We have added a new advanced mixology course.' },
        type: { type: 'string', example: 'ALL_USERS' },
        priority: { type: 'string', example: 'P1' },
        category: { type: 'string', example: 'GENERAL' },
        displayType: { type: 'string', example: 'BANNER' },
        isActive: { type: 'boolean', example: false },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async toggleAnnouncementStatus(@Param('id') id: string) {
    return this.announcementsService.toggleAnnouncementStatus(id);
  }

  @Post('test-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create test announcements (Admin only)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Test announcements created successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'announcement-uuid-123' },
          title: { type: 'string', example: 'Welcome to Tao Platform' },
          content: { type: 'string', example: 'Welcome to our platform!' },
          type: { type: 'string', example: 'PUBLIC_USERS' },
          priority: { type: 'string', example: 'P1' },
          category: { type: 'string', example: 'GENERAL' },
          displayType: { type: 'string', example: 'BANNER' },
          isActive: { type: 'boolean', example: true }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createTestAnnouncements(@Req() req) {
    return this.announcementsService.createTestAnnouncements(req.user.userId);
  }

  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get announcement statistics (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Announcement statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 10 },
        active: { type: 'number', example: 8 },
        inactive: { type: 'number', example: 2 },
        byPriority: {
          type: 'object',
          properties: {
            P1: { type: 'number', example: 3 },
            P2: { type: 'number', example: 4 },
            P3: { type: 'number', example: 3 }
          }
        },
        byType: {
          type: 'object',
          properties: {
            ALL_USERS: { type: 'number', example: 5 },
            PUBLIC_USERS: { type: 'number', example: 2 },
            REGISTERED_USERS: { type: 'number', example: 1 },
            COURSE_STUDENTS: { type: 'number', example: 2 },
            INSTRUCTORS: { type: 'number', example: 2 },
            SPECIFIC_ROLES: { type: 'number', example: 1 },
            PROMOTIONAL: { type: 'number', example: 1 },
            SYSTEM_UPDATE: { type: 'number', example: 1 }
          }
        },
        byCategory: {
          type: 'object',
          properties: {
            GENERAL: { type: 'number', example: 3 },
            PROMOTION: { type: 'number', example: 2 },
            COURSE_UPDATE: { type: 'number', example: 2 },
            SYSTEM_MAINTENANCE: { type: 'number', example: 1 },
            NEW_FEATURE: { type: 'number', example: 1 },
            INSTRUCTOR_ANNOUNCEMENT: { type: 'number', example: 1 }
          }
        },
        byDisplayType: {
          type: 'object',
          properties: {
            BANNER: { type: 'number', example: 3 },
            NOTIFICATION: { type: 'number', example: 2 },
            SIDEBAR: { type: 'number', example: 1 },
            EMAIL: { type: 'number', example: 1 },
            IN_APP: { type: 'number', example: 3 }
          }
        }
      }
    }
  })
  async getAnnouncementStats() {
    return this.announcementsService.getAnnouncementStats();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an announcement (Admin only)' })
  @ApiParam({ name: 'id', description: 'Announcement ID', example: 'announcement-uuid-123' })
  @ApiResponse({ 
    status: 200, 
    description: 'Announcement deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Announcement deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async deleteAnnouncement(@Param('id') id: string) {
    return this.announcementsService.deleteAnnouncement(id);
  }
} 