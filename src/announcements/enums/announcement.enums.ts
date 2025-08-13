export enum AnnouncementType {
  ALL_USERS = 'ALL_USERS',
  PUBLIC_USERS = 'PUBLIC_USERS', // For non-registered users
  REGISTERED_USERS = 'REGISTERED_USERS', // For registered users only
  COURSE_STUDENTS = 'COURSE_STUDENTS',
  INSTRUCTORS = 'INSTRUCTORS',
  SPECIFIC_ROLES = 'SPECIFIC_ROLES',
  SPECIFIC_USERS = 'SPECIFIC_USERS',
  PROMOTIONAL = 'PROMOTIONAL', // For promotions and offers
  SYSTEM_UPDATE = 'SYSTEM_UPDATE', // For system maintenance and updates
}

export enum AnnouncementPriority {
  P1 = 'P1', // High priority - Critical/Urgent
  P2 = 'P2', // Medium priority - Important
  P3 = 'P3', // Low priority - Informational
}

export enum AnnouncementCategory {
  GENERAL = 'GENERAL',
  PROMOTION = 'PROMOTION',
  COURSE_UPDATE = 'COURSE_UPDATE',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  NEW_FEATURE = 'NEW_FEATURE',
  INSTRUCTOR_ANNOUNCEMENT = 'INSTRUCTOR_ANNOUNCEMENT',
}

export enum AnnouncementDisplayType {
  BANNER = 'BANNER', // Full-width banner
  NOTIFICATION = 'NOTIFICATION', // Popup notification
  SIDEBAR = 'SIDEBAR', // Sidebar widget
  EMAIL = 'EMAIL', // Email notification
  IN_APP = 'IN_APP', // In-app notification
} 