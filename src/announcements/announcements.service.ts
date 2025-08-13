import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto, CreatePublicAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AnnouncementType, AnnouncementPriority, AnnouncementCategory, AnnouncementDisplayType } from './enums/announcement.enums';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async createAnnouncement(createAnnouncementDto: CreateAnnouncementDto, userId: string) {
    const { type, courseId, targetRoles, targetUserIds, ...data } = createAnnouncementDto;

    // Validate based on announcement type
    this.validateAnnouncementData(type, courseId, targetRoles, targetUserIds);

    // Validate course exists if courseId is provided
    if (courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });
      if (!course) {
        throw new BadRequestException(`Course with ID ${courseId} not found`);
      }
    }

    // Validate target users exist if targetUserIds is provided
    if (targetUserIds && targetUserIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: targetUserIds } },
        select: { id: true },
      });
      if (users.length !== targetUserIds.length) {
        const foundUserIds = users.map(user => user.id);
        const missingUserIds = targetUserIds.filter(id => !foundUserIds.includes(id));
        throw new BadRequestException(`Users with IDs ${missingUserIds.join(', ')} not found`);
      }
    }

    return this.prisma.announcement.create({
      data: {
        ...data,
        type,
        courseId,
        targetRoles: targetRoles || [],
        targetUserIds: targetUserIds || [],
        createdBy: userId,
      },
      include: {
        course: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async createPublicAnnouncement(createPublicAnnouncementDto: CreatePublicAnnouncementDto, userId: string) {
    const { ...data } = createPublicAnnouncementDto;

    return this.prisma.announcement.create({
      data: {
        ...data,
        type: AnnouncementType.PUBLIC_USERS,
        createdBy: userId,
        targetRoles: [],
        targetUserIds: [],
      },
      include: {
        course: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getAllAnnouncements(
    filters?: {
      isActive?: boolean;
      priority?: AnnouncementPriority;
      type?: AnnouncementType;
      category?: AnnouncementCategory;
      displayType?: AnnouncementDisplayType;
      createdBy?: string;
      courseId?: string;
      expiresBefore?: Date;
      expiresAfter?: Date;
      startsBefore?: Date;
      startsAfter?: Date;
      tags?: string[];
      showAsBanner?: boolean;
    }
  ) {
    const where: any = {};

    // Apply filters if provided
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.displayType) {
      where.displayType = filters.displayType;
    }

    if (filters?.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters?.courseId) {
      where.courseId = filters.courseId;
    }

    if (filters?.showAsBanner !== undefined) {
      where.showAsBanner = filters.showAsBanner;
    }

    // Handle expiration date filters
    if (filters?.expiresBefore || filters?.expiresAfter) {
      where.expiresAt = {};
      if (filters.expiresBefore) {
        where.expiresAt.lt = filters.expiresBefore;
      }
      if (filters.expiresAfter) {
        where.expiresAt.gt = filters.expiresAfter;
      }
    }

    // Handle start date filters
    if (filters?.startsBefore || filters?.startsAfter) {
      where.startsAt = {};
      if (filters.startsBefore) {
        where.startsAt.lt = filters.startsBefore;
      }
      if (filters.startsAfter) {
        where.startsAt.gt = filters.startsAfter;
      }
    }

    // Handle tags filter
    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    return this.prisma.announcement.findMany({
      where,
      include: {
        course: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getAnnouncementById(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        course: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return announcement;
  }

  async getAnnouncementsForUser(userId: string, userRole: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const userCourseIds = user.courses.map(course => course.id);

    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: new Date() } },
            ],
          },
          {
            OR: [
              // ALL_USERS announcements
              { type: AnnouncementType.ALL_USERS },
              // REGISTERED_USERS announcements
              { type: AnnouncementType.REGISTERED_USERS },
              // INSTRUCTORS announcements
              { type: AnnouncementType.INSTRUCTORS },
              // COURSE_STUDENTS announcements for user's courses
              {
                type: AnnouncementType.COURSE_STUDENTS,
                courseId: { in: userCourseIds },
              },
              // SPECIFIC_ROLES announcements
              {
                type: AnnouncementType.SPECIFIC_ROLES,
                targetRoles: { has: userRole },
              },
              // SPECIFIC_USERS announcements
              {
                type: AnnouncementType.SPECIFIC_USERS,
                targetUserIds: { has: userId },
              },
              // PROMOTIONAL announcements for registered users
              { type: AnnouncementType.PROMOTIONAL },
              // SYSTEM_UPDATE announcements for registered users
              { type: AnnouncementType.SYSTEM_UPDATE },
            ],
          },
        ],
      },
      include: {
        course: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getAnnouncementsForPublic() {
    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        type: AnnouncementType.PUBLIC_USERS,
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: new Date() } },
            ],
          },
        ],
      },
      include: {
        course: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getBannerAnnouncements() {
    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        showAsBanner: true,
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: new Date() } },
            ],
          },
        ],
      },
      include: {
        course: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getAnnouncementsForAdmin(filters?: {
    isActive?: boolean;
    priority?: AnnouncementPriority;
    type?: AnnouncementType;
    category?: AnnouncementCategory;
    displayType?: AnnouncementDisplayType;
    createdBy?: string;
    courseId?: string;
    expiresBefore?: Date;
    expiresAfter?: Date;
    startsBefore?: Date;
    startsAfter?: Date;
    tags?: string[];
    showAsBanner?: boolean;
  }) {
    return this.getAllAnnouncements(filters);
  }

  async updateAnnouncement(id: string, updateAnnouncementDto: UpdateAnnouncementDto) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    const { type, courseId, targetRoles, targetUserIds, ...data } = updateAnnouncementDto;

    // Validate based on announcement type if type is being updated
    if (type) {
      this.validateAnnouncementData(type, courseId, targetRoles, targetUserIds);
    }

    // Validate course exists if courseId is being updated
    if (courseId !== undefined) {
      if (courseId) {
        const course = await this.prisma.course.findUnique({
          where: { id: courseId },
        });
        if (!course) {
          throw new BadRequestException(`Course with ID ${courseId} not found`);
        }
      }
    }

    // Validate target users exist if targetUserIds is being updated
    if (targetUserIds !== undefined && targetUserIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: targetUserIds } },
        select: { id: true },
      });
      if (users.length !== targetUserIds.length) {
        const foundUserIds = users.map(user => user.id);
        const missingUserIds = targetUserIds.filter(id => !foundUserIds.includes(id));
        throw new BadRequestException(`Users with IDs ${missingUserIds.join(', ')} not found`);
      }
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...data,
        type: type || announcement.type,
        courseId: courseId !== undefined ? courseId : announcement.courseId,
        targetRoles: targetRoles !== undefined ? targetRoles : announcement.targetRoles,
        targetUserIds: targetUserIds !== undefined ? targetUserIds : announcement.targetUserIds,
      },
      include: {
        course: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteAnnouncement(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    await this.prisma.announcement.delete({
      where: { id },
    });

    return { message: 'Announcement deleted successfully' };
  }

  async toggleAnnouncementStatus(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        isActive: !announcement.isActive,
      },
      include: {
        course: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  private validateAnnouncementData(
    type: AnnouncementType,
    courseId?: string,
    targetRoles?: string[],
    targetUserIds?: string[],
  ) {
    switch (type) {
      case AnnouncementType.COURSE_STUDENTS:
        if (!courseId) {
          throw new BadRequestException('Course ID is required for COURSE_STUDENTS type announcements');
        }
        break;
      case AnnouncementType.SPECIFIC_ROLES:
        if (!targetRoles || targetRoles.length === 0) {
          throw new BadRequestException('Target roles are required for SPECIFIC_ROLES type announcements');
        }
        break;
      case AnnouncementType.SPECIFIC_USERS:
        if (!targetUserIds || targetUserIds.length === 0) {
          throw new BadRequestException('Target user IDs are required for SPECIFIC_USERS type announcements');
        }
        break;
      case AnnouncementType.ALL_USERS:
      case AnnouncementType.REGISTERED_USERS:
      case AnnouncementType.INSTRUCTORS:
      case AnnouncementType.PUBLIC_USERS:
      case AnnouncementType.PROMOTIONAL:
      case AnnouncementType.SYSTEM_UPDATE:
        // No additional validation needed
        break;
    }
  }

  async createTestAnnouncements(adminUserId: string) {
    const testAnnouncements = [
      {
        title: 'Welcome to Tao Platform',
        content: 'Welcome to our bartending and mixology learning platform! We are excited to have you here.',
        type: AnnouncementType.PUBLIC_USERS,
        priority: AnnouncementPriority.P1,
        category: AnnouncementCategory.GENERAL,
        displayType: AnnouncementDisplayType.BANNER,
        isActive: true,
        showAsBanner: true,
        actionUrl: '/courses',
        actionText: 'Browse Courses',
        tags: ['welcome', 'general'],
      },
      {
        title: 'New Advanced Course Available',
        content: 'We have added a new advanced mixology course. Check it out in the courses section!',
        type: AnnouncementType.ALL_USERS,
        priority: AnnouncementPriority.P2,
        category: AnnouncementCategory.COURSE_UPDATE,
        displayType: AnnouncementDisplayType.IN_APP,
        isActive: true,
        actionUrl: '/courses/advanced-mixology',
        actionText: 'View Course',
        tags: ['new-course', 'mixology', 'advanced'],
      },
      {
        title: 'Instructor Meeting Reminder',
        content: 'Monthly instructor meeting scheduled for next Friday at 3 PM. Please mark your calendars.',
        type: AnnouncementType.INSTRUCTORS,
        priority: AnnouncementPriority.P2,
        category: AnnouncementCategory.INSTRUCTOR_ANNOUNCEMENT,
        displayType: AnnouncementDisplayType.IN_APP,
        isActive: true,
        tags: ['meeting', 'instructor'],
      },
      {
        title: 'System Maintenance Notice',
        content: 'The platform will be under maintenance from 2-4 AM tonight. We apologize for any inconvenience.',
        type: AnnouncementType.ALL_USERS,
        priority: AnnouncementPriority.P1,
        category: AnnouncementCategory.SYSTEM_MAINTENANCE,
        displayType: AnnouncementDisplayType.BANNER,
        isActive: true,
        showAsBanner: true,
        tags: ['maintenance', 'system'],
      },
      {
        title: 'Admin Training Session',
        content: 'New admin training session available for all administrators. Contact support for details.',
        type: AnnouncementType.SPECIFIC_ROLES,
        targetRoles: ['ADMIN'],
        priority: AnnouncementPriority.P1,
        category: AnnouncementCategory.INSTRUCTOR_ANNOUNCEMENT,
        displayType: AnnouncementDisplayType.IN_APP,
        isActive: true,
        tags: ['training', 'admin'],
      },
      {
        title: 'Special Promotion: 20% Off All Courses',
        content: 'Limited time offer! Get 20% off all courses this week. Use code TAO20 at checkout.',
        type: AnnouncementType.PROMOTIONAL,
        priority: AnnouncementPriority.P1,
        category: AnnouncementCategory.PROMOTION,
        displayType: AnnouncementDisplayType.BANNER,
        isActive: true,
        showAsBanner: true,
        actionUrl: '/courses',
        actionText: 'Shop Now',
        tags: ['promotion', 'discount', 'sale'],
      },
    ];

    const createdAnnouncements = [];
    
    for (const announcement of testAnnouncements) {
      try {
        const created = await this.createAnnouncement(announcement, adminUserId);
        createdAnnouncements.push(created);
      } catch (error) {
        console.error(`Failed to create test announcement: ${announcement.title}`, error.message);
      }
    }

    return createdAnnouncements;
  }

  async getAnnouncementStats() {
    const [
      total,
      active,
      inactive,
      byPriority,
      byType,
      byCategory,
      byDisplayType
    ] = await Promise.all([
      this.prisma.announcement.count(),
      this.prisma.announcement.count({ where: { isActive: true } }),
      this.prisma.announcement.count({ where: { isActive: false } }),
      this.prisma.announcement.groupBy({
        by: ['priority'],
        _count: { priority: true }
      }),
      this.prisma.announcement.groupBy({
        by: ['type'],
        _count: { type: true }
      }),
      this.prisma.announcement.groupBy({
        by: ['category'],
        _count: { category: true }
      }),
      this.prisma.announcement.groupBy({
        by: ['displayType'],
        _count: { displayType: true }
      })
    ]);

    const priorityStats = {};
    byPriority.forEach(item => {
      priorityStats[item.priority] = item._count.priority;
    });

    const typeStats = {};
    byType.forEach(item => {
      typeStats[item.type] = item._count.type;
    });

    const categoryStats = {};
    byCategory.forEach(item => {
      categoryStats[item.category] = item._count.category;
    });

    const displayTypeStats = {};
    byDisplayType.forEach(item => {
      displayTypeStats[item.displayType] = item._count.displayType;
    });

    return {
      total,
      active,
      inactive,
      byPriority: priorityStats,
      byType: typeStats,
      byCategory: categoryStats,
      byDisplayType: displayTypeStats
    };
  }

  async getAnnouncementsByTags(tags: string[]) {
    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        tags: {
          hasSome: tags,
        },
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: new Date() } },
            ],
          },
        ],
      },
      include: {
        course: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getPopularTags() {
    const announcements = await this.prisma.announcement.findMany({
      where: {
        isActive: true,
        tags: {
          isEmpty: false,
        },
      },
      select: {
        tags: true,
      },
    });

    const tagCounts: Record<string, number> = {};
    announcements.forEach(announcement => {
      if (announcement.tags) {
        announcement.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 10); // Top 10 tags
  }
} 