import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AnnouncementType, AnnouncementPriority, AnnouncementCategory } from '../announcements/enums/announcement.enums';

export interface EmailRecipient {
  id: string;
  email: string;
  name: string;
}

export interface AnnouncementEmailData {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  category: AnnouncementCategory;
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  createdAt: Date;
  creator: {
    name: string;
    email: string;
  };
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // For development, use a test account or configure your email provider
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    // For production, you might want to use services like SendGrid, AWS SES, etc.
    // Example for SendGrid:
    // this.transporter = nodemailer.createTransporter({
    //   host: 'smtp.sendgrid.net',
    //   port: 587,
    //   auth: {
    //     user: 'apikey',
    //     pass: this.configService.get('SENDGRID_API_KEY'),
    //   },
    // });
  }

  async sendAnnouncementEmail(
    recipients: EmailRecipient[],
    announcementData: AnnouncementEmailData,
  ): Promise<void> {
    try {
      const emailPromises = recipients.map(recipient =>
        this.sendSingleAnnouncementEmail(recipient, announcementData)
      );

      await Promise.all(emailPromises);
      this.logger.log(`Sent announcement emails to ${recipients.length} recipients`);
    } catch (error) {
      this.logger.error('Failed to send announcement emails:', error);
      throw error;
    }
  }

  private async sendSingleAnnouncementEmail(
    recipient: EmailRecipient,
    announcementData: AnnouncementEmailData,
  ): Promise<void> {
    const emailContent = this.generateAnnouncementEmailHTML(recipient, announcementData);
    const emailSubject = this.generateEmailSubject(announcementData);

    const mailOptions = {
      from: this.configService.get('EMAIL_FROM', 'noreply@tao-platform.com'),
      to: recipient.email,
      subject: emailSubject,
      html: emailContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${recipient.email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${recipient.email}:`, error);
      throw error;
    }
  }

  private generateEmailSubject(announcementData: AnnouncementEmailData): string {
    const priorityEmoji = this.getPriorityEmoji(announcementData.priority);
    const categoryPrefix = this.getCategoryPrefix(announcementData.category);
    
    return `${priorityEmoji} ${categoryPrefix}: ${announcementData.title}`;
  }

  private getPriorityEmoji(priority: AnnouncementPriority): string {
    switch (priority) {
      case AnnouncementPriority.P1:
        return '🚨';
      case AnnouncementPriority.P2:
        return '⚠️';
      case AnnouncementPriority.P3:
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  private getCategoryPrefix(category: AnnouncementCategory): string {
    switch (category) {
      case AnnouncementCategory.PROMOTION:
        return 'Promotion';
      case AnnouncementCategory.COURSE_UPDATE:
        return 'Course Update';
      case AnnouncementCategory.SYSTEM_MAINTENANCE:
        return 'System Maintenance';
      case AnnouncementCategory.NEW_FEATURE:
        return 'New Feature';
      case AnnouncementCategory.INSTRUCTOR_ANNOUNCEMENT:
        return 'Instructor Announcement';
      default:
        return 'Announcement';
    }
  }

  private generateAnnouncementEmailHTML(
    recipient: EmailRecipient,
    announcementData: AnnouncementEmailData,
  ): string {
    const priorityColor = this.getPriorityColor(announcementData.priority);
    const categoryColor = this.getCategoryColor(announcementData.category);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${announcementData.title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            color: white;
            background-color: ${priorityColor};
            margin-bottom: 15px;
          }
          .category-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            color: white;
            background-color: ${categoryColor};
            margin-left: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 20px;
            line-height: 1.3;
          }
          .content {
            font-size: 16px;
            line-height: 1.8;
            color: #555;
            margin-bottom: 30px;
          }
          .action-button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin-bottom: 30px;
            transition: background-color 0.3s;
          }
          .action-button:hover {
            background-color: #2980b9;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 14px;
            color: #777;
            text-align: center;
          }
          .metadata {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #666;
          }
          .image-container {
            text-align: center;
            margin: 20px 0;
          }
          .announcement-image {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          @media only screen and (max-width: 600px) {
            body {
              padding: 10px;
            }
            .email-container {
              padding: 20px;
            }
            .title {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🍸 Tao Platform</div>
            <div>
              <span class="priority-badge">${announcementData.priority}</span>
              <span class="category-badge">${announcementData.category.replace('_', ' ')}</span>
            </div>
          </div>

          <h1 class="title">${announcementData.title}</h1>

          ${announcementData.imageUrl ? `
            <div class="image-container">
              <img src="${announcementData.imageUrl}" alt="Announcement" class="announcement-image">
            </div>
          ` : ''}

          <div class="content">
            ${announcementData.content.replace(/\n/g, '<br>')}
          </div>

          ${announcementData.actionUrl && announcementData.actionText ? `
            <div style="text-align: center;">
              <a href="${announcementData.actionUrl}" class="action-button">
                ${announcementData.actionText}
              </a>
            </div>
          ` : ''}

          <div class="metadata">
            <strong>From:</strong> ${announcementData.creator.name} (${announcementData.creator.email})<br>
            <strong>Date:</strong> ${announcementData.createdAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}<br>
            <strong>Type:</strong> ${announcementData.type.replace('_', ' ')}
          </div>

          <div class="footer">
            <p>This email was sent to ${recipient.name} (${recipient.email})</p>
            <p>You're receiving this because you're registered on Tao Platform</p>
            <p>© ${new Date().getFullYear()} Tao Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPriorityColor(priority: AnnouncementPriority): string {
    switch (priority) {
      case AnnouncementPriority.P1:
        return '#e74c3c'; // Red
      case AnnouncementPriority.P2:
        return '#f39c12'; // Orange
      case AnnouncementPriority.P3:
        return '#3498db'; // Blue
      default:
        return '#95a5a6'; // Gray
    }
  }

  private getCategoryColor(category: AnnouncementCategory): string {
    switch (category) {
      case AnnouncementCategory.PROMOTION:
        return '#e67e22'; // Orange
      case AnnouncementCategory.COURSE_UPDATE:
        return '#27ae60'; // Green
      case AnnouncementCategory.SYSTEM_MAINTENANCE:
        return '#8e44ad'; // Purple
      case AnnouncementCategory.NEW_FEATURE:
        return '#3498db'; // Blue
      case AnnouncementCategory.INSTRUCTOR_ANNOUNCEMENT:
        return '#2c3e50'; // Dark Blue
      default:
        return '#95a5a6'; // Gray
    }
  }

  async testEmailConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed:', error);
      return false;
    }
  }
}
