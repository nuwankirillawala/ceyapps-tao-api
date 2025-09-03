import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService, EmailRecipient, AnnouncementEmailData } from '../email/email.service';
import { AnnouncementType, AnnouncementDisplayType } from '../announcements/enums/announcement.enums';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledAnnouncements() {
    this.logger.log('Checking for scheduled announcements...');
    
    try {
      const currentDate = new Date();
      const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Find announcements that should be sent today
      const scheduledAnnouncements = await this.prisma.announcement.findMany({
        where: {
          isActive: true,
          displayType: AnnouncementDisplayType.EMAIL,
          startsAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: currentDate } },
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course: true,
        },
      });

      this.logger.log(`Found ${scheduledAnnouncements.length} scheduled announcements for today`);

      for (const announcement of scheduledAnnouncements) {
        await this.processScheduledAnnouncement(announcement);
      }
    } catch (error) {
      this.logger.error('Error processing scheduled announcements:', error);
    }
  }

  private async processScheduledAnnouncement(announcement: any) {
    try {
      this.logger.log(`Processing scheduled announcement: ${announcement.title}`);

      // Get recipients based on announcement type
      const recipients = await this.getRecipientsForAnnouncement(announcement);
      
      if (recipients.length === 0) {
        this.logger.warn(`No recipients found for announcement: ${announcement.title}`);
        return;
      }

      // Prepare email data
      const emailData: AnnouncementEmailData = {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        priority: announcement.priority,
        category: announcement.category,
        actionUrl: announcement.actionUrl,
        actionText: announcement.actionText,
        imageUrl: announcement.imageUrl,
        createdAt: announcement.createdAt,
        creator: {
          name: announcement.creator.name,
          email: announcement.creator.email,
        },
      };

      // Send emails
      await this.emailService.sendAnnouncementEmail(recipients, emailData);
      
      this.logger.log(`Successfully sent scheduled announcement "${announcement.title}" to ${recipients.length} recipients`);
    } catch (error) {
      this.logger.error(`Error processing scheduled announcement ${announcement.title}:`, error);
    }
  }

  private async getRecipientsForAnnouncement(announcement: any): Promise<EmailRecipient[]> {
    const recipients: EmailRecipient[] = [];

    switch (announcement.type) {
      case AnnouncementType.ALL_USERS:
        recipients.push(...await this.getAllUsers());
        break;

      case AnnouncementType.REGISTERED_USERS:
        recipients.push(...await this.getRegisteredUsers());
        break;

      case AnnouncementType.INSTRUCTORS:
        recipients.push(...await this.getInstructors());
        break;

      case AnnouncementType.COURSE_STUDENTS:
        if (announcement.courseId) {
          recipients.push(...await this.getCourseStudents(announcement.courseId));
        }
        break;

      case AnnouncementType.SPECIFIC_ROLES:
        if (announcement.targetRoles && announcement.targetRoles.length > 0) {
          recipients.push(...await this.getUsersByRoles(announcement.targetRoles));
        }
        break;

      case AnnouncementType.SPECIFIC_USERS:
        if (announcement.targetUserIds && announcement.targetUserIds.length > 0) {
          recipients.push(...await this.getSpecificUsers(announcement.targetUserIds));
        }
        break;

      case AnnouncementType.PROMOTIONAL:
        recipients.push(...await this.getRegisteredUsers());
        break;

      case AnnouncementType.SYSTEM_UPDATE:
        recipients.push(...await this.getRegisteredUsers());
        break;

      default:
        this.logger.warn(`Unknown announcement type: ${announcement.type}`);
    }

    return recipients;
  }

  private async getAllUsers(): Promise<EmailRecipient[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return users.filter(user => user.email && user.name);
  }

  private async getRegisteredUsers(): Promise<EmailRecipient[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return users.filter(user => user.email && user.name);
  }

  private async getInstructors(): Promise<EmailRecipient[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return users.filter(user => user.email && user.name);
  }

  private async getCourseStudents(courseId: string): Promise<EmailRecipient[]> {
    const enrollments = await this.prisma.userEnrollment.findMany({
      where: {
        courseId: courseId,
        status: 'ENROLLED',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return enrollments
      .map(enrollment => enrollment.user)
      .filter(user => user.email && user.name);
  }

  private async getUsersByRoles(roles: string[]): Promise<EmailRecipient[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: { in: roles as any },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return users.filter(user => user.email && user.name);
  }

  private async getSpecificUsers(userIds: string[]): Promise<EmailRecipient[]> {
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return users.filter(user => user.email && user.name);
  }

  // Manual trigger for testing
  async triggerScheduledAnnouncements() {
    this.logger.log('Manually triggering scheduled announcements check...');
    await this.handleScheduledAnnouncements();
  }

  // Get upcoming scheduled announcements
  async getUpcomingScheduledAnnouncements() {
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        displayType: AnnouncementDisplayType.EMAIL,
        startsAt: {
          gt: currentDate,
          lte: futureDate,
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: true,
      },
      orderBy: {
        startsAt: 'asc',
      },
    });
  }
}
