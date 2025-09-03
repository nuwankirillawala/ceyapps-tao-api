import { Test, TestingModule } from '@nestjs/testing';
import { ReportingService } from './reporting.service';
import { PrismaService } from '../prisma/prisma.service';
import { SalesReportDto, UserReportDto, ReportType } from './dto/reporting.dto';

describe('ReportingService', () => {
  let service: ReportingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    order: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    userEnrollment: {
      findMany: jest.fn(),
    },
    course: {
      count: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
    },
    subscriptionPayment: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSalesReport', () => {
    const mockSalesReportDto: SalesReportDto = {
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-31T23:59:59.999Z',
      reportType: ReportType.SALES,
      includeInstructorBreakdown: true,
      includeCountryBreakdown: true,
      includeCourseBreakdown: true,
    };

    const mockOrders = [
      {
        id: 'order1',
        createdAt: new Date('2025-01-01'),
        totalAmount: 100,
        status: 'completed',
        user: { country: 'United States' },
        orderItems: [
          {
            course: {
              id: 'course1',
              title: 'Advanced Mixology',
              instructor: { id: 'instructor1', name: 'John Doe' },
            },
          },
        ],
      },
    ];

    const mockSubscriptions = [
      {
        id: 'sub1',
        paidAt: new Date('2025-01-01'),
        amount: 50,
        status: 'succeeded',
        subscription: {
          user: { country: 'Canada' },
          subscriptionPlan: { name: 'Premium' },
        },
      },
    ];

    it('should generate a comprehensive sales report', async () => {
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);
      mockPrismaService.subscriptionPayment.findMany.mockResolvedValue(mockSubscriptions);

      const result = await service.generateSalesReport(mockSalesReportDto);

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('dailyBreakdown');
      expect(result).toHaveProperty('instructorBreakdown');
      expect(result).toHaveProperty('countryBreakdown');
      expect(result).toHaveProperty('courseBreakdown');
      expect(result.summary.totalSales).toBe(2);
      expect(result.summary.totalRevenue).toBe(150);
    });

    it('should handle empty data gracefully', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.subscriptionPayment.findMany.mockResolvedValue([]);

      const result = await service.generateSalesReport(mockSalesReportDto);

      expect(result.summary.totalSales).toBe(0);
      expect(result.summary.totalRevenue).toBe(0);
      expect(result.dailyBreakdown).toHaveLength(31);
    });
  });

  describe('generateUserReport', () => {
    const mockUserReportDto: UserReportDto = {
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-31T23:59:59.999Z',
      reportType: ReportType.USERS,
      includeEnrollmentBreakdown: true,
      includeCountryBreakdown: true,
      includeRoleBreakdown: true,
    };

    const mockUsers = [
      {
        id: 'user1',
        createdAt: new Date('2025-01-01'),
        role: 'STUDENT',
        country: 'United States',
      },
    ];

    const mockEnrollments = [
      {
        id: 'enrollment1',
        enrolledAt: new Date('2025-01-01'),
        user: { country: 'United States' },
        course: {
          id: 'course1',
          title: 'Advanced Mixology',
          instructor: { name: 'John Doe' },
        },
      },
    ];

    it('should generate a comprehensive user report', async () => {
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.userEnrollment.findMany.mockResolvedValue(mockEnrollments);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.generateUserReport(mockUserReportDto);

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('dailyBreakdown');
      expect(result).toHaveProperty('enrollmentBreakdown');
      expect(result).toHaveProperty('countryBreakdown');
      expect(result).toHaveProperty('roleBreakdown');
      expect(result.summary.totalNewUsers).toBe(1);
      expect(result.summary.totalEnrollments).toBe(1);
    });

    it('should handle empty data gracefully', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.userEnrollment.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await service.generateUserReport(mockUserReportDto);

      expect(result.summary.totalNewUsers).toBe(0);
      expect(result.summary.totalEnrollments).toBe(0);
      expect(result.summary.conversionRate).toBe(0);
    });
  });

  describe('getOverallUsers', () => {
    it('should return overall users statistics', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(1250) // totalUsers
        .mockResolvedValueOnce(980); // activeUsers

      mockPrismaService.user.groupBy.mockResolvedValue([
        { role: 'STUDENT', _count: { id: 1100 } },
        { role: 'INSTRUCTOR', _count: { id: 100 } },
        { role: 'ADMIN', _count: { id: 50 } },
      ]);

      const result = await service.getOverallUsers();

      expect(result.totalUsers).toBe(1250);
      expect(result.activeUsers).toBe(980);
      expect(result.inactiveUsers).toBe(270);
      expect(result.usersByRole).toHaveLength(3);
    });
  });

  describe('getRegistrationStats', () => {
    it('should return registration statistics', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(200) // monthlyRegistrations
        .mockResolvedValueOnce(8); // todayRegistrations

      mockPrismaService.user.groupBy.mockResolvedValue([
        { createdAt: new Date('2025-01-01'), _count: { id: 8 } },
      ]);

      const result = await service.getRegistrationStats();

      expect(result.monthlyRegistrations).toBe(200);
      expect(result.todayRegistrations).toBe(8);
      expect(result.todayPercentage).toBe(4);
      expect(result.dailyBreakdown).toBeDefined();
    });
  });

  describe('getCourseSellingStats', () => {
    it('should return course selling statistics', async () => {
      mockPrismaService.order.count
        .mockResolvedValueOnce(150) // monthlySales
        .mockResolvedValueOnce(5); // todaySales

      mockPrismaService.order.groupBy.mockResolvedValue([
        { createdAt: new Date('2025-01-01'), _count: { id: 5 } },
      ]);

      const result = await service.getCourseSellingStats();

      expect(result.monthlySales).toBe(150);
      expect(result.todaySales).toBe(5);
      expect(result.todayPercentage).toBeCloseTo(3.33, 2);
      expect(result.dailyBreakdown).toBeDefined();
    });
  });

  describe('getTotalEarnings', () => {
    it('should return total earnings breakdown', async () => {
      mockPrismaService.subscriptionPayment.aggregate.mockResolvedValue({
        _sum: { amount: 75000 },
      });

      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 50000 },
      });

      const result = await service.getTotalEarnings();

      expect(result.totalEarnings).toBe(125000);
      expect(result.subscriptionEarnings).toBe(75000);
      expect(result.orderEarnings).toBe(50000);
    });
  });

  describe('getRegistrationsPerMonth', () => {
    it('should return monthly registration trend', async () => {
      mockPrismaService.user.count.mockResolvedValue(180);

      const result = await service.getRegistrationsPerMonth();

      expect(result).toHaveLength(10);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('count');
    });
  });

  describe('getCourseAnalytics', () => {
    it('should return course analytics', async () => {
      mockPrismaService.course.count.mockResolvedValue(50);

      mockPrismaService.order.groupBy.mockResolvedValue([
        {
          courseId: 'course1',
          _count: { id: 150 },
          _sum: { totalAmount: 13425 },
        },
      ]);

      mockPrismaService.course.findUnique.mockResolvedValue({
        title: 'Advanced Mixology',
        instructor: { name: 'John Doe' },
      });

      mockPrismaService.course.groupBy.mockResolvedValue([
        { category: 'MIXOLOGY', _count: { id: 20 } },
        { category: 'BARTENDING', _count: { id: 15 } },
      ]);

      const result = await service.getCourseAnalytics();

      expect(result.totalCourses).toBe(50);
      expect(result.publishedCourses).toBe(50);
      expect(result.draftCourses).toBe(0);
      expect(result.topCourses).toBeDefined();
      expect(result.coursesByCategory).toBeDefined();
    });
  });

  describe('getUserGrowthTrend', () => {
    it('should return user growth trend', async () => {
      mockPrismaService.user.count.mockResolvedValue(180);

      const result = await service.getUserGrowthTrend();

      expect(result).toHaveLength(12);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('newUsers');
      expect(result[0]).toHaveProperty('totalUsers');
      expect(result[0]).toHaveProperty('growthPercentage');
    });
  });

  describe('getDashboardStats', () => {
    it('should return comprehensive dashboard statistics', async () => {
      // Mock all the individual methods
      jest.spyOn(service, 'getOverallUsers').mockResolvedValue({
        totalUsers: 1250,
        activeUsers: 980,
        inactiveUsers: 270,
        usersByRole: [],
      });

      jest.spyOn(service, 'getRegistrationStats').mockResolvedValue({
        monthlyRegistrations: 200,
        todayRegistrations: 8,
        todayPercentage: 4,
        dailyBreakdown: [],
      });

      jest.spyOn(service, 'getCourseSellingStats').mockResolvedValue({
        monthlySales: 150,
        todaySales: 5,
        todayPercentage: 3.33,
        dailyBreakdown: [],
      });

      jest.spyOn(service, 'getTotalEarnings').mockResolvedValue({
        totalEarnings: 125000,
        subscriptionEarnings: 75000,
        orderEarnings: 50000,
      });

      jest.spyOn(service, 'getRegistrationsPerMonth').mockResolvedValue([]);
      jest.spyOn(service, 'getCourseAnalytics').mockResolvedValue({
        totalCourses: 50,
        publishedCourses: 45,
        draftCourses: 5,
        topCourses: [],
        coursesByCategory: [],
      });
      jest.spyOn(service, 'getUserGrowthTrend').mockResolvedValue([]);

      const result = await service.getDashboardStats();

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('registrations');
      expect(result).toHaveProperty('courseSales');
      expect(result).toHaveProperty('earnings');
      expect(result).toHaveProperty('monthlyRegistrations');
      expect(result).toHaveProperty('courseAnalytics');
      expect(result).toHaveProperty('userGrowthTrend');
    });
  });

  describe('Helper methods', () => {
    describe('generateDailySalesBreakdown', () => {
      it('should generate daily sales breakdown correctly', () => {
        const start = new Date('2025-01-01');
        const end = new Date('2025-01-03');
        const orders = [
          {
            createdAt: new Date('2025-01-01'),
            totalAmount: 100,
          },
        ];
        const subscriptions = [
          {
            paidAt: new Date('2025-01-02'),
            amount: 50,
          },
        ];

        const result = service['generateDailySalesBreakdown'](start, end, orders, subscriptions);

        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('2025-01-01');
        expect(result[0].sales).toBe(1);
        expect(result[0].revenue).toBe(100);
      });
    });

    describe('generateInstructorBreakdown', () => {
      it('should generate instructor breakdown correctly', () => {
        const orders = [
          {
            orderItems: [
              {
                course: {
                  id: 'course1',
                  instructor: { id: 'instructor1', name: 'John Doe' },
                },
              },
            ],
            totalAmount: 100,
          },
        ];
        const subscriptions = [
          {
            amount: 50,
          },
        ];

        const result = service['generateInstructorBreakdown'](orders, subscriptions);

        expect(result).toHaveLength(2); // instructor + subscriptions
        expect(result[0].instructorName).toBe('John Doe');
        expect(result[0].totalSales).toBe(1);
        expect(result[0].totalRevenue).toBe(100);
      });
    });

    describe('generateCountryBreakdown', () => {
      it('should generate country breakdown correctly', () => {
        const orders = [
          {
            user: { country: 'United States' },
            totalAmount: 100,
          },
        ];
        const subscriptions = [
          {
            subscription: {
              user: { country: 'Canada' },
            },
            amount: 50,
          },
        ];

        const result = service['generateCountryBreakdown'](orders, subscriptions);

        expect(result).toHaveLength(2);
        expect(result[0].country).toBe('United States');
        expect(result[0].totalSales).toBe(1);
        expect(result[0].totalRevenue).toBe(100);
      });
    });
  });
});
