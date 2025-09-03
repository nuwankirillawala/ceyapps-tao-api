# Email Notification System Setup

This document explains how to set up and use the email notification system for announcements in the Tao backend.

## Features

- **Formatted Email Templates**: Beautiful, responsive HTML emails with priority badges, category colors, and action buttons
- **Immediate Sending**: Send emails immediately when creating announcements with `displayType: 'EMAIL'` and `sendEmail: true`
- **Scheduled Sending**: Automatically send emails for announcements scheduled for future dates
- **Target Audience**: Support for different announcement types (ALL_USERS, INSTRUCTORS, COURSE_STUDENTS, etc.)
- **Priority System**: Visual priority indicators (P1, P2, P3) with color coding
- **Category System**: Different colors for different announcement categories

## Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@tao-platform.com"
```

### Gmail Setup (Recommended for Development)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the generated password as `SMTP_PASS`

### Production Setup (SendGrid Example)

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
EMAIL_FROM="noreply@yourdomain.com"
```

## Installation

1. Install the required dependencies:
```bash
yarn add @nestjs/schedule nodemailer
yarn add -D @types/nodemailer
```

2. The email system is automatically integrated into the announcements module.

## Usage

### Creating Email Announcements

When creating an announcement, set the following fields:

```json
{
  "title": "New Course Available",
  "content": "We've just launched a new advanced mixology course!",
  "type": "ALL_USERS",
  "displayType": "EMAIL",
  "sendEmail": true,
  "priority": "P2",
  "category": "COURSE_UPDATE",
  "actionUrl": "https://yourdomain.com/courses/new-course",
  "actionText": "View Course"
}
```

### Immediate vs Scheduled Sending

- **Immediate**: Set `sendEmail: true` and either no `startsAt` date or `startsAt` set to today
- **Scheduled**: Set `sendEmail: true`, `displayType: "EMAIL"`, and `startsAt` to a future date

### Announcement Types and Recipients

- `ALL_USERS`: All registered users with email addresses
- `REGISTERED_USERS`: All registered users
- `INSTRUCTORS`: Users with INSTRUCTOR role
- `COURSE_STUDENTS`: Students enrolled in a specific course (requires `courseId`)
- `SPECIFIC_ROLES`: Users with specific roles (requires `targetRoles`)
- `SPECIFIC_USERS`: Specific users (requires `targetUserIds`)
- `PROMOTIONAL`: All registered users
- `SYSTEM_UPDATE`: All registered users

## API Endpoints

### Test Email Connection
```http
GET /email/test-connection
Authorization: Bearer <admin-token>
```

### Trigger Scheduled Announcements (Manual)
```http
POST /scheduler/trigger-announcements
Authorization: Bearer <admin-token>
```

### Get Upcoming Scheduled Announcements
```http
GET /scheduler/upcoming-announcements
Authorization: Bearer <admin-token>
```

## Email Template Features

### Visual Elements
- **Priority Badges**: Color-coded priority indicators (P1=Red, P2=Orange, P3=Blue)
- **Category Badges**: Different colors for different categories
- **Action Buttons**: Clickable buttons for call-to-action
- **Responsive Design**: Mobile-friendly email layout
- **Branding**: Tao Platform logo and styling

### Content Sections
- **Header**: Platform logo, priority and category badges
- **Title**: Large, prominent announcement title
- **Image**: Optional announcement image
- **Content**: Formatted announcement content
- **Action Button**: Optional call-to-action button
- **Metadata**: Creator info, date, and announcement type
- **Footer**: Recipient info and platform branding

## Scheduling System

The system includes a cron job that runs every hour to check for announcements scheduled for the current day. It will:

1. Find announcements with `displayType: 'EMAIL'` scheduled for today
2. Get the appropriate recipients based on announcement type
3. Send formatted emails to all recipients
4. Log the results

## Error Handling

- Email sending failures are logged but don't prevent announcement creation
- Invalid email addresses are filtered out
- Connection issues are logged with detailed error messages
- Scheduled announcements that fail to send will be retried on the next cron run

## Monitoring

Check the application logs for email-related activities:
- Email connection verification
- Scheduled announcement processing
- Email sending success/failure
- Recipient filtering

## Security Considerations

- Use environment variables for sensitive email credentials
- Consider using email service providers with delivery tracking
- Implement rate limiting for bulk email sending
- Use app passwords instead of account passwords for Gmail
- Consider using dedicated email services (SendGrid, AWS SES) for production
