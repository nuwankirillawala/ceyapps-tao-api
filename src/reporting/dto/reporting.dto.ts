import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum ReportType {
  SALES = 'sales',
  USERS = 'users',
}

export enum ReportPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

// Base DTO for date range requests
export class DateRangeDto {
  @ApiProperty({ description: 'Start date (ISO string)', example: '2025-01-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date (ISO string)', example: '2025-01-31T23:59:59.999Z' })
  @IsDateString()
  endDate: string;
}

// Sales Report DTOs
export class SalesReportDto extends DateRangeDto {
  @ApiProperty({ description: 'Report type', enum: ReportType, example: ReportType.SALES })
  @IsEnum(ReportType)
  reportType: ReportType.SALES;

  @ApiProperty({ description: 'Include instructor breakdown', example: true, required: false })
  @IsOptional()
  includeInstructorBreakdown?: boolean;

  @ApiProperty({ description: 'Include country breakdown', example: true, required: false })
  @IsOptional()
  includeCountryBreakdown?: boolean;

  @ApiProperty({ description: 'Include course breakdown', example: true, required: false })
  @IsOptional()
  includeCourseBreakdown?: boolean;
}

export class SalesReportResponseDto {
  @ApiProperty({ description: 'Report period' })
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalSales: number;
    totalOrders: number;
    totalSubscriptions: number;
    averageOrderValue: number;
    totalRevenue: number;
  };

  @ApiProperty({ description: 'Daily breakdown' })
  dailyBreakdown: Array<{
    date: string;
    sales: number;
    orders: number;
    subscriptions: number;
    revenue: number;
  }>;

  @ApiProperty({ description: 'Instructor breakdown', required: false })
  instructorBreakdown?: Array<{
    instructorId: string;
    instructorName: string;
    totalSales: number;
    totalRevenue: number;
    courseCount: number;
  }>;

  @ApiProperty({ description: 'Country breakdown', required: false })
  countryBreakdown?: Array<{
    country: string;
    totalSales: number;
    totalRevenue: number;
    orderCount: number;
  }>;

  @ApiProperty({ description: 'Course breakdown', required: false })
  courseBreakdown?: Array<{
    courseId: string;
    courseName: string;
    totalSales: number;
    totalRevenue: number;
    instructorName: string;
  }>;
}

// User Report DTOs
export class UserReportDto extends DateRangeDto {
  @ApiProperty({ description: 'Report type', enum: ReportType, example: ReportType.USERS })
  @IsEnum(ReportType)
  reportType: ReportType.USERS;

  @ApiProperty({ description: 'Include enrollment breakdown', example: true, required: false })
  @IsOptional()
  includeEnrollmentBreakdown?: boolean;

  @ApiProperty({ description: 'Include country breakdown', example: true, required: false })
  @IsOptional()
  includeCountryBreakdown?: boolean;

  @ApiProperty({ description: 'Include role breakdown', example: true, required: false })
  @IsOptional()
  includeRoleBreakdown?: boolean;
}

export class UserReportResponseDto {
  @ApiProperty({ description: 'Report period' })
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalNewUsers: number;
    totalEnrollments: number;
    activeUsers: number;
    conversionRate: number;
  };

  @ApiProperty({ description: 'Daily breakdown' })
  dailyBreakdown: Array<{
    date: string;
    newUsers: number;
    enrollments: number;
    activeUsers: number;
  }>;

  @ApiProperty({ description: 'Enrollment breakdown', required: false })
  enrollmentBreakdown?: Array<{
    courseId: string;
    courseName: string;
    enrollments: number;
    instructorName: string;
  }>;

  @ApiProperty({ description: 'Country breakdown', required: false })
  countryBreakdown?: Array<{
    country: string;
    newUsers: number;
    enrollments: number;
  }>;

  @ApiProperty({ description: 'Role breakdown', required: false })
  roleBreakdown?: Array<{
    role: string;
    newUsers: number;
    percentage: number;
  }>;
}

// Dashboard DTOs (original functionality)
export class OverallUsersDto {
  @ApiProperty({ description: 'Total number of users in the system' })
  totalUsers: number;
}

export class RegistrationStatsDto {
  @ApiProperty({ description: 'Number of registrations in current month' })
  monthlyRegistrations: number;

  @ApiProperty({ description: 'Number of registrations today' })
  todayRegistrations: number;

  @ApiProperty({ description: 'Percentage of today registrations compared to monthly' })
  todayPercentage: number;
}

export class CourseSellingStatsDto {
  @ApiProperty({ description: 'Number of course sales in current month' })
  monthlyCourseSales: number;

  @ApiProperty({ description: 'Number of course sales today' })
  todayCourseSales: number;

  @ApiProperty({ description: 'Percentage of today sales compared to monthly' })
  todayPercentage: number;
}

export class TotalEarningsDto {
  @ApiProperty({ description: 'Total earnings from all sources' })
  totalEarnings: number;

  @ApiProperty({ description: 'Earnings from subscriptions' })
  subscriptionEarnings: number;

  @ApiProperty({ description: 'Earnings from course orders' })
  orderEarnings: number;
}

export class MonthlyRegistrationDto {
  @ApiProperty({ description: 'Month name' })
  month: string;

  @ApiProperty({ description: 'Year' })
  year: number;

  @ApiProperty({ description: 'Number of registrations in this month' })
  count: number;

  @ApiProperty({ description: 'Formatted period string' })
  period: string;
}

export class TopCourseDto {
  @ApiProperty({ description: 'Course ID' })
  courseId: string;

  @ApiProperty({ description: 'Course name' })
  courseName: string;

  @ApiProperty({ description: 'Sales count' })
  salesCount: number;

  @ApiProperty({ description: 'Revenue generated' })
  revenue: number;
}

export class CategoryCountDto {
  @ApiProperty({ description: 'Category name' })
  category: string;

  @ApiProperty({ description: 'Course count' })
  count: number;
}

export class CourseAnalyticsDto {
  @ApiProperty({ description: 'Total courses' })
  totalCourses: number;

  @ApiProperty({ description: 'Published courses' })
  publishedCourses: number;

  @ApiProperty({ description: 'Draft courses' })
  draftCourses: number;

  @ApiProperty({ description: 'Top selling courses' })
  topCourses: TopCourseDto[];

  @ApiProperty({ description: 'Courses by category' })
  coursesByCategory: CategoryCountDto[];
}

export class UserGrowthTrendDto {
  @ApiProperty({ description: 'Month' })
  month: string;

  @ApiProperty({ description: 'Year' })
  year: number;

  @ApiProperty({ description: 'New users' })
  newUsers: number;

  @ApiProperty({ description: 'Total users' })
  totalUsers: number;

  @ApiProperty({ description: 'Growth percentage' })
  growthPercentage: number;

  @ApiProperty({ description: 'Formatted period string' })
  period: string;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Overall users statistics' })
  users: OverallUsersDto;

  @ApiProperty({ description: 'Registration statistics' })
  registrations: RegistrationStatsDto;

  @ApiProperty({ description: 'Course selling statistics' })
  courseSales: CourseSellingStatsDto;

  @ApiProperty({ description: 'Total earnings' })
  earnings: TotalEarningsDto;

  @ApiProperty({ description: 'Monthly registrations trend' })
  monthlyRegistrations: MonthlyRegistrationDto[];

  @ApiProperty({ description: 'Course analytics' })
  courseAnalytics: CourseAnalyticsDto;

  @ApiProperty({ description: 'User growth trend' })
  userGrowthTrend: UserGrowthTrendDto[];
}
