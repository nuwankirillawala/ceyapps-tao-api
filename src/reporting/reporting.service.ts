import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OverallUsersDto,
  RegistrationStatsDto,
  CourseSellingStatsDto,
  TotalEarningsDto,
  MonthlyRegistrationDto,
  TopCourseDto,
  CategoryCountDto,
  CourseAnalyticsDto,
  UserGrowthTrendDto,
  DashboardStatsDto,
  SalesReportResponseDto,
  UserReportResponseDto,
  SalesReportDto,
  UserReportDto,
} from './dto/reporting.dto';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Sales Reports
  async generateSalesReport(reportDto: SalesReportDto): Promise<SalesReportResponseDto> {
    const { startDate, endDate, includeInstructorBreakdown, includeCountryBreakdown, includeCourseBreakdown } = reportDto;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Get orders and subscriptions in date range
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'completed',
      },
      include: {
        user: true,
        orderItems: {
          include: {
            course: {
              include: {
                instructor: true,
              },
            },
          },
        },
      },
    });

    const subscriptions = await this.prisma.subscriptionPayment.findMany({
      where: {
        paidAt: {
          gte: start,
          lte: end,
        },
        status: 'succeeded',
      },
      include: {
        subscription: {
          include: {
            user: true,
            subscriptionPlan: true,
          },
        },
      },
    });

    // Calculate summary statistics
    const totalOrders = orders.length;
    const totalSubscriptions = subscriptions.length;
    const totalSales = totalOrders + totalSubscriptions;
    
    const orderRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const subscriptionRevenue = subscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0);
    const totalRevenue = orderRevenue + subscriptionRevenue;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Generate daily breakdown
    const dailyBreakdown = this.generateDailySalesBreakdown(start, end, orders, subscriptions);

    // Build response
    const response: SalesReportResponseDto = {
      period: {
        startDate: startDate,
        endDate: endDate,
        totalDays,
      },
      summary: {
        totalSales,
        totalOrders,
        totalSubscriptions,
        averageOrderValue,
        totalRevenue,
      },
      dailyBreakdown,
    };

    // Add optional breakdowns
    if (includeInstructorBreakdown) {
      response.instructorBreakdown = this.generateInstructorBreakdown(orders, subscriptions);
    }

    if (includeCountryBreakdown) {
      response.countryBreakdown = this.generateCountryBreakdown(orders, subscriptions);
    }

    if (includeCourseBreakdown) {
      response.courseBreakdown = this.generateCourseBreakdown(orders);
    }

    return response;
  }

  private generateDailySalesBreakdown(start: Date, end: Date, orders: any[], subscriptions: any[]) {
    const breakdown = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      
      const dayOrders = orders.filter(order => 
        order.createdAt.toISOString().split('T')[0] === dateStr
      );
      
      const daySubscriptions = subscriptions.filter(sub => 
        sub.paidAt.toISOString().split('T')[0] === dateStr
      );

      const dayRevenue = 
        dayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0) +
        daySubscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0);

      breakdown.push({
        date: dateStr,
        sales: dayOrders.length + daySubscriptions.length,
        orders: dayOrders.length,
        subscriptions: daySubscriptions.length,
        revenue: dayRevenue,
      });

      current.setDate(current.getDate() + 1);
    }

    return breakdown;
  }

  private generateInstructorBreakdown(orders: any[], subscriptions: any[]) {
    const instructorMap = new Map();

    // Process orders
    orders.forEach(order => {
      if (order.course?.instructor) {
        const instructorId = order.course.instructor.id;
        const instructorName = order.course.instructor.name || order.course.instructor.email;
        
        if (!instructorMap.has(instructorId)) {
          instructorMap.set(instructorId, {
            instructorId,
            instructorName,
            totalSales: 0,
            totalRevenue: 0,
            courseCount: new Set(),
          });
        }

        const instructor = instructorMap.get(instructorId);
        instructor.totalSales += 1;
        instructor.totalRevenue += Number(order.totalAmount);
        instructor.courseCount.add(order.course.id);
      }
    });

    // Process subscriptions (these don't have instructors, but we can track them)
    subscriptions.forEach(sub => {
      // For subscriptions, we might want to track them separately or assign to a general category
      if (!instructorMap.has('subscriptions')) {
        instructorMap.set('subscriptions', {
          instructorId: 'subscriptions',
          instructorName: 'Subscription Revenue',
          totalSales: 0,
          totalRevenue: 0,
          courseCount: new Set(),
        });
      }

      const instructor = instructorMap.get('subscriptions');
      instructor.totalSales += 1;
      instructor.totalRevenue += Number(sub.amount);
    });

    return Array.from(instructorMap.values()).map(instructor => ({
      ...instructor,
      courseCount: instructor.courseCount.size,
    }));
  }

  private generateCountryBreakdown(orders: any[], subscriptions: any[]) {
    const countryMap = new Map();

    // Process orders
    orders.forEach(order => {
      const country = order.user?.country || 'Unknown';
      
      if (!countryMap.has(country)) {
        countryMap.set(country, {
          country,
          totalSales: 0,
          totalRevenue: 0,
          orderCount: 0,
        });
      }

      const countryData = countryMap.get(country);
      countryData.totalSales += 1;
      countryData.totalRevenue += Number(order.totalAmount);
      countryData.orderCount += 1;
    });

    // Process subscriptions
    subscriptions.forEach(sub => {
      const country = sub.user?.country || 'Unknown';
      
      if (!countryMap.has(country)) {
        countryMap.set(country, {
          country,
          totalSales: 0,
          totalRevenue: 0,
          orderCount: 0,
        });
      }

      const countryData = countryMap.get(country);
      countryData.totalSales += 1;
      countryData.totalRevenue += Number(sub.amount);
    });

    return Array.from(countryMap.values());
  }

  private generateCourseBreakdown(orders: any[]) {
    const courseMap = new Map();

    orders.forEach(order => {
      if (order.course) {
        const courseId = order.course.id;
        
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            courseId,
            courseName: order.course.title,
            totalSales: 0,
            totalRevenue: 0,
            instructorName: order.course.instructor?.name || order.course.instructor?.email || 'Unknown',
          });
        }

        const course = courseMap.get(courseId);
        course.totalSales += 1;
        course.totalRevenue += Number(order.totalAmount);
      }
    });

    return Array.from(courseMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  // User Reports
  async generateUserReport(reportDto: UserReportDto): Promise<UserReportResponseDto> {
    const { startDate, endDate, includeEnrollmentBreakdown, includeCountryBreakdown, includeRoleBreakdown } = reportDto;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Get new users in date range
    const newUsers = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get enrollments in date range
    const enrollments = await this.prisma.userEnrollment.findMany({
      where: {
        enrolledAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        user: true,
        course: {
          include: {
            instructor: true,
          },
        },
      },
    });

    // Get active users (users who have logged in or made purchases in the period)
    const activeUsers = await this.prisma.user.count({
      where: {
        OR: [
          {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          {
            orders: {
              some: {
                createdAt: {
                  gte: start,
                  lte: end,
                },
              },
            },
          },
          {
            userSubscriptions: {
              some: {
                subscriptionPayments: {
                  some: {
                    paidAt: {
                      gte: start,
                      lte: end,
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    // Calculate summary statistics
    const totalNewUsers = newUsers.length;
    const totalEnrollments = enrollments.length;
    const conversionRate = totalNewUsers > 0 ? (totalEnrollments / totalNewUsers) * 100 : 0;

    // Generate daily breakdown
    const dailyBreakdown = this.generateDailyUserBreakdown(start, end, newUsers, enrollments);

    // Build response
    const response: UserReportResponseDto = {
      period: {
        startDate: startDate,
        endDate: endDate,
        totalDays,
      },
      summary: {
        totalNewUsers,
        totalEnrollments,
        activeUsers,
        conversionRate,
      },
      dailyBreakdown,
    };

    // Add optional breakdowns
    if (includeEnrollmentBreakdown) {
      response.enrollmentBreakdown = this.generateEnrollmentBreakdown(enrollments);
    }

    if (includeCountryBreakdown) {
      response.countryBreakdown = this.generateUserCountryBreakdown(newUsers, enrollments);
    }

    if (includeRoleBreakdown) {
      response.roleBreakdown = this.generateRoleBreakdown(newUsers);
    }

    return response;
  }

  private generateDailyUserBreakdown(start: Date, end: Date, users: any[], enrollments: any[]) {
    const breakdown = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      
      const dayUsers = users.filter(user => 
        user.createdAt.toISOString().split('T')[0] === dateStr
      );
      
      const dayEnrollments = enrollments.filter(enrollment => 
        enrollment.enrolledAt.toISOString().split('T')[0] === dateStr
      );

      // Calculate active users for this day (simplified - could be enhanced)
      const dayActiveUsers = dayUsers.length + dayEnrollments.length;

      breakdown.push({
        date: dateStr,
        newUsers: dayUsers.length,
        enrollments: dayEnrollments.length,
        activeUsers: dayActiveUsers,
      });

      current.setDate(current.getDate() + 1);
    }

    return breakdown;
  }

  private generateEnrollmentBreakdown(enrollments: any[]) {
    const courseMap = new Map();

    enrollments.forEach(enrollment => {
      if (enrollment.course) {
        const courseId = enrollment.course.id;
        
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            courseId,
            courseName: enrollment.course.title,
            enrollments: 0,
            instructorName: enrollment.course.instructor?.name || enrollment.course.instructor?.email || 'Unknown',
          });
        }

        const course = courseMap.get(courseId);
        course.enrollments += 1;
      }
    });

    return Array.from(courseMap.values()).sort((a, b) => b.enrollments - a.enrollments);
  }

  private generateUserCountryBreakdown(users: any[], enrollments: any[]) {
    const countryMap = new Map();

    // Process new users
    users.forEach(user => {
      const country = user.country || 'Unknown';
      
      if (!countryMap.has(country)) {
        countryMap.set(country, {
          country,
          newUsers: 0,
          enrollments: 0,
        });
      }

      const countryData = countryMap.get(country);
      countryData.newUsers += 1;
    });

    // Process enrollments
    enrollments.forEach(enrollment => {
      const country = enrollment.user?.country || 'Unknown';
      
      if (!countryMap.has(country)) {
        countryMap.set(country, {
          country,
          newUsers: 0,
          enrollments: 0,
        });
      }

      const countryData = countryMap.get(country);
      countryData.enrollments += 1;
    });

    return Array.from(countryMap.values());
  }

  private generateRoleBreakdown(users: any[]) {
    const roleMap = new Map();
    const totalUsers = users.length;

    users.forEach(user => {
      const role = user.role?.name || 'Unknown';
      
      if (!roleMap.has(role)) {
        roleMap.set(role, {
          role,
          newUsers: 0,
          percentage: 0,
        });
      }

      const roleData = roleMap.get(role);
      roleData.newUsers += 1;
    });

    // Calculate percentages
    roleMap.forEach(roleData => {
      roleData.percentage = totalUsers > 0 ? (roleData.newUsers / totalUsers) * 100 : 0;
    });

    return Array.from(roleMap.values());
  }

  // Dashboard methods (original functionality)
  async getOverallUsers(): Promise<OverallUsersDto> {
    const totalUsers = await this.prisma.user.count();
    return { totalUsers };
  }

  async getRegistrationStats(): Promise<RegistrationStatsDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Get registrations for current month
    const monthlyRegistrations = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: now,
        },
      },
    });

    // Get registrations for today
    const todayRegistrations = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // Calculate percentage of today's registrations compared to monthly
    const todayPercentage = monthlyRegistrations > 0 
      ? ((todayRegistrations / monthlyRegistrations) * 100).toFixed(2)
      : '0.00';

    return {
      monthlyRegistrations,
      todayRegistrations,
      todayPercentage: parseFloat(todayPercentage),
    };
  }

  async getCourseSellingStats(): Promise<CourseSellingStatsDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Get course sales for current month (enrollments)
    const monthlyCourseSales = await this.prisma.userEnrollment.count({
      where: {
        enrolledAt: {
          gte: startOfMonth,
          lte: now,
        },
      },
    });

    // Get course sales for today
    const todayCourseSales = await this.prisma.userEnrollment.count({
      where: {
        enrolledAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // Calculate percentage of today's sales compared to monthly
    const todayPercentage = monthlyCourseSales > 0 
      ? ((todayCourseSales / monthlyCourseSales) * 100).toFixed(2)
      : '0.00';

    return {
      monthlyCourseSales,
      todayCourseSales,
      todayPercentage: parseFloat(todayPercentage),
    };
  }

  async getTotalEarnings(): Promise<TotalEarningsDto> {
    // Calculate total earnings from subscription payments
    const subscriptionEarnings = await this.prisma.subscriptionPayment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'succeeded',
        paidAt: {
          not: null,
        },
      },
    });

    // Calculate total earnings from course orders
    const orderEarnings = await this.prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: 'completed',
      },
    });

    const totalSubscriptionEarnings = subscriptionEarnings._sum.amount || 0;
    const totalOrderEarnings = orderEarnings._sum.totalAmount || 0;
    const totalEarnings = totalSubscriptionEarnings + totalOrderEarnings;

    return {
      totalEarnings,
      subscriptionEarnings: totalSubscriptionEarnings,
      orderEarnings: totalOrderEarnings,
    };
  }

  async getRegistrationsPerMonth(): Promise<MonthlyRegistrationDto[]> {
    const months = [];
    const now = new Date();

    // Generate last 10 months
    for (let i = 9; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'long' });
      const year = monthDate.getFullYear();
      
      const startOfMonth = new Date(year, monthDate.getMonth(), 1);
      const endOfMonth = new Date(year, monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      months.push({
        month: monthName,
        year,
        count,
        period: `${monthName} ${year}`,
      });
    }

    return months;
  }

  async getCourseAnalytics(): Promise<CourseAnalyticsDto> {
    const totalCourses = await this.prisma.course.count();
    const publishedCourses = totalCourses; // Since there's no status field, all courses are considered published
    const draftCourses = 0; // No draft status in schema

    // Get top courses by enrollment count
    const topCoursesByEnrollment = await this.prisma.userEnrollment.groupBy({
      by: ['courseId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topCoursesWithDetails = await Promise.all(
      topCoursesByEnrollment.map(async (course) => {
        const courseDetails = await this.prisma.course.findUnique({
          where: { id: course.courseId },
          include: { instructor: true },
        });
        return {
          courseId: course.courseId,
          courseName: courseDetails?.title || 'Unknown Course',
          salesCount: course._count.id,
          revenue: 0, // We'll calculate this separately if needed
        };
      })
    );

    const coursesByCategory = await this.prisma.course.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      topCourses: topCoursesWithDetails,
      coursesByCategory: coursesByCategory.map(cat => ({
        category: cat.category || 'Uncategorized',
        count: cat._count.id,
      })),
    };
  }

  async getUserGrowthTrend(): Promise<UserGrowthTrendDto[]> {
    const months = [];
    const now = new Date();
    let cumulativeUsers = 0;
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      
      const newUsers = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(date.getFullYear(), date.getMonth(), 1),
            lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
          },
        },
      });
      
      cumulativeUsers += newUsers;
      const growthPercentage = cumulativeUsers > 0 ? (newUsers / cumulativeUsers) * 100 : 0;
      
      months.push({
        month: monthName,
        year,
        newUsers,
        totalUsers: cumulativeUsers,
        growthPercentage,
        period: `${monthName} ${year}`,
      });
    }
    
    return months;
  }

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [
      overallUsers,
      registrationStats,
      courseSellingStats,
      totalEarnings,
      registrationsPerMonth,
      courseAnalytics,
      userGrowthTrend,
    ] = await Promise.all([
      this.getOverallUsers(),
      this.getRegistrationStats(),
      this.getCourseSellingStats(),
      this.getTotalEarnings(),
      this.getRegistrationsPerMonth(),
      this.getCourseAnalytics(),
      this.getUserGrowthTrend(),
    ]);

    return {
      users: overallUsers,
      registrations: registrationStats,
      courseSales: courseSellingStats,
      earnings: totalEarnings,
      monthlyRegistrations: registrationsPerMonth,
      courseAnalytics,
      userGrowthTrend,
    };
  }

  // Helper methods
  private async getDailyRegistrations(start: Date, end: Date) {
    const registrations = await this.prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: start, lte: end },
      },
      _count: { id: true },
    });

    return registrations.map(reg => ({
      date: reg.createdAt.toISOString().split('T')[0],
      registrations: reg._count.id,
    }));
  }

  private async getDailySales(start: Date, end: Date) {
    const sales = await this.prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: start, lte: end },
        status: 'completed',
      },
      _count: { id: true },
    });

    return sales.map(sale => ({
      date: sale.createdAt.toISOString().split('T')[0],
      sales: sale._count.id,
    }));
  }
}
