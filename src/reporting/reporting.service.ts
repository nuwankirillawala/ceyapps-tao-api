import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  async getOverallUsers() {
    const totalUsers = await this.prisma.user.count();
    return { totalUsers };
  }

  async getRegistrationStats() {
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

  async getCourseSellingStats() {
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

  async getTotalEarnings() {
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

  async getRegistrationsPerMonth() {
    const now = new Date();
    const months = [];

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

  async getCourseAnalytics() {
    const totalCourses = await this.prisma.course.count();
    const totalEnrollments = await this.prisma.userEnrollment.count();
    const averageEnrollmentsPerCourse = totalCourses > 0 ? (totalEnrollments / totalCourses).toFixed(2) : '0.00';

    // Get top courses by enrollment
    const topCourses = await this.prisma.course.findMany({
      select: {
        id: true,
        title: true,
        instructorName: true,
        category: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        enrollments: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // Get courses by category
    const coursesByCategory = await this.prisma.course.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    return {
      totalCourses,
      totalEnrollments,
      averageEnrollmentsPerCourse: parseFloat(averageEnrollmentsPerCourse),
      topCourses: topCourses.map(course => ({
        id: course.id,
        title: course.title,
        instructorName: course.instructorName,
        category: course.category,
        enrollmentCount: course._count.enrollments,
      })),
      coursesByCategory: coursesByCategory.map(cat => ({
        category: cat.category,
        count: cat._count.id,
      })),
    };
  }

  async getUserGrowthTrend() {
    const now = new Date();
    const months = [];

    // Generate last 12 months for growth trend
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      const year = monthDate.getFullYear();
      
      const startOfMonth = new Date(year, monthDate.getMonth(), 1);
      const endOfMonth = new Date(year, monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const newUsers = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      // Calculate cumulative users up to this month
      const cumulativeUsers = await this.prisma.user.count({
        where: {
          createdAt: {
            lte: endOfMonth,
          },
        },
      });

      months.push({
        month: monthName,
        year,
        newUsers,
        cumulativeUsers,
        period: `${monthName} ${year}`,
      });
    }

    return months;
  }

  async getDashboardStats() {
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
      overallUsers,
      registrationStats,
      courseSellingStats,
      totalEarnings,
      registrationsPerMonth,
      courseAnalytics,
      userGrowthTrend,
    };
  }
}
