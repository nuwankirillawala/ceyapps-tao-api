import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'Earnings from subscription payments' })
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
  id: string;

  @ApiProperty({ description: 'Course title' })
  title: string;

  @ApiProperty({ description: 'Instructor name' })
  instructorName: string;

  @ApiProperty({ description: 'Course category' })
  category: string;

  @ApiProperty({ description: 'Number of enrollments' })
  enrollmentCount: number;
}

export class CategoryCountDto {
  @ApiProperty({ description: 'Course category' })
  category: string;

  @ApiProperty({ description: 'Number of courses in this category' })
  count: number;
}

export class CourseAnalyticsDto {
  @ApiProperty({ description: 'Total number of courses' })
  totalCourses: number;

  @ApiProperty({ description: 'Total number of enrollments' })
  totalEnrollments: number;

  @ApiProperty({ description: 'Average enrollments per course' })
  averageEnrollmentsPerCourse: number;

  @ApiProperty({ description: 'Top 5 courses by enrollment', type: [TopCourseDto] })
  topCourses: TopCourseDto[];

  @ApiProperty({ description: 'Courses grouped by category', type: [CategoryCountDto] })
  coursesByCategory: CategoryCountDto[];
}

export class UserGrowthTrendDto {
  @ApiProperty({ description: 'Month name (short format)' })
  month: string;

  @ApiProperty({ description: 'Year' })
  year: number;

  @ApiProperty({ description: 'New users in this month' })
  newUsers: number;

  @ApiProperty({ description: 'Cumulative users up to this month' })
  cumulativeUsers: number;

  @ApiProperty({ description: 'Formatted period string' })
  period: string;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Overall users statistics' })
  overallUsers: OverallUsersDto;

  @ApiProperty({ description: 'Registration statistics' })
  registrationStats: RegistrationStatsDto;

  @ApiProperty({ description: 'Course selling statistics' })
  courseSellingStats: CourseSellingStatsDto;

  @ApiProperty({ description: 'Total earnings information' })
  totalEarnings: TotalEarningsDto;

  @ApiProperty({ description: 'Registrations per month for last 10 months', type: [MonthlyRegistrationDto] })
  registrationsPerMonth: MonthlyRegistrationDto[];

  @ApiProperty({ description: 'Course analytics and insights' })
  courseAnalytics: CourseAnalyticsDto;

  @ApiProperty({ description: 'User growth trend for last 12 months', type: [UserGrowthTrendDto] })
  userGrowthTrend: UserGrowthTrendDto[];
}
