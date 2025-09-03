import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
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
  SalesReportDto,
  UserReportDto,
  SalesReportResponseDto,
  UserReportResponseDto,
} from './dto/reporting.dto';

@ApiTags('Reporting')
@Controller('reporting')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  // New comprehensive report endpoints
  @Post('sales-report')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Generate comprehensive sales report with date range' })
  @ApiResponse({
    status: 200,
    description: 'Sales report generated successfully',
    type: SalesReportResponseDto,
  })
  async generateSalesReport(@Body() reportDto: SalesReportDto): Promise<SalesReportResponseDto> {
    return this.reportingService.generateSalesReport(reportDto);
  }

  @Post('user-report')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Generate comprehensive user report with date range' })
  @ApiResponse({
    status: 200,
    description: 'User report generated successfully',
    type: UserReportResponseDto,
  })
  async generateUserReport(@Body() reportDto: UserReportDto): Promise<UserReportResponseDto> {
    return this.reportingService.generateUserReport(reportDto);
  }

  // Existing endpoints (keeping for backward compatibility)
  @Get('overall-users')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get overall users statistics' })
  @ApiResponse({
    status: 200,
    description: 'Overall users statistics retrieved successfully',
    type: OverallUsersDto,
  })
  async getOverallUsers(): Promise<OverallUsersDto> {
    return this.reportingService.getOverallUsers();
  }

  @Get('registration-stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get registration statistics for current month' })
  @ApiResponse({
    status: 200,
    description: 'Registration statistics retrieved successfully',
    type: RegistrationStatsDto,
  })
  async getRegistrationStats(): Promise<RegistrationStatsDto> {
    return this.reportingService.getRegistrationStats();
  }

  @Get('course-selling-stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get course selling statistics for current month' })
  @ApiResponse({
    status: 200,
    description: 'Course selling statistics retrieved successfully',
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
    description: 'Total earnings retrieved successfully',
    type: TotalEarningsDto,
  })
  async getTotalEarnings(): Promise<TotalEarningsDto> {
    return this.reportingService.getTotalEarnings();
  }

  @Get('registrations-per-month')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get registrations per month for last 10 months' })
  @ApiResponse({
    status: 200,
    description: 'Monthly registrations retrieved successfully',
    type: [MonthlyRegistrationDto],
  })
  async getRegistrationsPerMonth(): Promise<MonthlyRegistrationDto[]> {
    return this.reportingService.getRegistrationsPerMonth();
  }

  @Get('course-analytics')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get course analytics and insights' })
  @ApiResponse({
    status: 200,
    description: 'Course analytics retrieved successfully',
    type: CourseAnalyticsDto,
  })
  async getCourseAnalytics(): Promise<CourseAnalyticsDto> {
    return this.reportingService.getCourseAnalytics();
  }

  @Get('user-growth-trend')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user growth trend for last 12 months' })
  @ApiResponse({
    status: 200,
    description: 'User growth trend retrieved successfully',
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
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.reportingService.getDashboardStats();
  }
}
