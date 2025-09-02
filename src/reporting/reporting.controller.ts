import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import {
  OverallUsersDto,
  RegistrationStatsDto,
  CourseSellingStatsDto,
  TotalEarningsDto,
  MonthlyRegistrationDto,
  CourseAnalyticsDto,
  UserGrowthTrendDto,
  DashboardStatsDto,
} from './dto/reporting.dto';

@ApiTags('Reporting')
@Controller('reporting')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('overall-users')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get overall users count' })
  @ApiResponse({
    status: 200,
    description: 'Returns the total number of users in the system',
    type: OverallUsersDto,
  })
  async getOverallUsers(): Promise<OverallUsersDto> {
    return this.reportingService.getOverallUsers();
  }

  @Get('registration-stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get registration statistics for current month and today' })
  @ApiResponse({
    status: 200,
    description: 'Returns registration statistics including monthly count, today count, and percentage',
    type: RegistrationStatsDto,
  })
  async getRegistrationStats(): Promise<RegistrationStatsDto> {
    return this.reportingService.getRegistrationStats();
  }

  @Get('course-selling-stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get course selling statistics for current month and today' })
  @ApiResponse({
    status: 200,
    description: 'Returns course selling statistics including monthly sales, today sales, and percentage',
    type: CourseSellingStatsDto,
  })
  async getCourseSellingStats(): Promise<CourseSellingStatsDto> {
    return this.reportingService.getCourseSellingStats();
  }

  @Get('total-earnings')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get total earnings from all sources' })
  @ApiResponse({
    status: 200,
    description: 'Returns total earnings breakdown from subscriptions and course orders',
    type: TotalEarningsDto,
  })
  async getTotalEarnings(): Promise<TotalEarningsDto> {
    return this.reportingService.getTotalEarnings();
  }

  @Get('registrations-per-month')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get registrations per month for the last 10 months' })
  @ApiResponse({
    status: 200,
    description: 'Returns registration count for each of the last 10 months',
    type: [MonthlyRegistrationDto],
  })
  async getRegistrationsPerMonth(): Promise<MonthlyRegistrationDto[]> {
    return this.reportingService.getRegistrationsPerMonth();
  }

  @Get('course-analytics')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get comprehensive course analytics' })
  @ApiResponse({
    status: 200,
    description: 'Returns course analytics including top courses, category distribution, and enrollment metrics',
    type: CourseAnalyticsDto,
  })
  async getCourseAnalytics(): Promise<CourseAnalyticsDto> {
    return this.reportingService.getCourseAnalytics();
  }

  @Get('user-growth-trend')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user growth trend for the last 12 months' })
  @ApiResponse({
    status: 200,
    description: 'Returns user growth data including new users and cumulative users for each month',
    type: [UserGrowthTrendDto],
  })
  async getUserGrowthTrend(): Promise<UserGrowthTrendDto[]> {
    return this.reportingService.getUserGrowthTrend();
  }

  @Get('dashboard-stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get comprehensive dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns all reporting data in one comprehensive response',
    type: DashboardStatsDto,
  })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.reportingService.getDashboardStats();
  }
}
