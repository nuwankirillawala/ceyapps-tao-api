import { Test, TestingModule } from '@nestjs/testing';
import { ReportingService } from './reporting.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportingService', () => {
  let service: ReportingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
    },
    userEnrollment: {
      count: jest.fn(),
    },
    subscriptionPayment: {
      aggregate: jest.fn(),
    },
    order: {
      aggregate: jest.fn(),
    },
    course: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverallUsers', () => {
    it('should return total users count', async () => {
      const mockCount = 1250;
      mockPrismaService.user.count.mockResolvedValue(mockCount);

      const result = await service.getOverallUsers();

      expect(result).toEqual({ totalUsers: mockCount });
      expect(mockPrismaService.user.count).toHaveBeenCalledWith();
    });
  });

  describe('getRegistrationStats', () => {
    it('should return registration statistics', async () => {
      const mockMonthlyCount = 45;
      const mockTodayCount = 3;
      
      mockPrismaService.user.count
        .mockResolvedValueOnce(mockMonthlyCount)
        .mockResolvedValueOnce(mockTodayCount);

      const result = await service.getRegistrationStats();

      expect(result).toEqual({
        monthlyRegistrations: mockMonthlyCount,
        todayRegistrations: mockTodayCount,
        todayPercentage: 6.67,
      });
      expect(mockPrismaService.user.count).toHaveBeenCalledTimes(2);
    });

    it('should handle zero monthly registrations', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(5);

      const result = await service.getRegistrationStats();

      expect(result.todayPercentage).toBe(0.00);
    });
  });

  describe('getCourseSellingStats', () => {
    it('should return course selling statistics', async () => {
      const mockMonthlySales = 120;
      const mockTodaySales = 8;
      
      mockPrismaService.userEnrollment.count
        .mockResolvedValueOnce(mockMonthlySales)
        .mockResolvedValueOnce(mockTodaySales);

      const result = await service.getCourseSellingStats();

      expect(result).toEqual({
        monthlyCourseSales: mockMonthlySales,
        todayCourseSales: mockTodaySales,
        todayPercentage: 6.67,
      });
    });
  });

  describe('getTotalEarnings', () => {
    it('should return total earnings breakdown', async () => {
      const mockSubscriptionEarnings = { _sum: { amount: 8900.00 } };
      const mockOrderEarnings = { _sum: { totalAmount: 6520.50 } };
      
      mockPrismaService.subscriptionPayment.aggregate.mockResolvedValue(mockSubscriptionEarnings);
      mockPrismaService.order.aggregate.mockResolvedValue(mockOrderEarnings);

      const result = await service.getTotalEarnings();

      expect(result).toEqual({
        totalEarnings: 15420.50,
        subscriptionEarnings: 8900.00,
        orderEarnings: 6520.50,
      });
    });

    it('should handle null earnings', async () => {
      const mockSubscriptionEarnings = { _sum: { amount: null } };
      const mockOrderEarnings = { _sum: { totalAmount: null } };
      
      mockPrismaService.subscriptionPayment.aggregate.mockResolvedValue(mockSubscriptionEarnings);
      mockPrismaService.order.aggregate.mockResolvedValue(mockOrderEarnings);

      const result = await service.getTotalEarnings();

      expect(result).toEqual({
        totalEarnings: 0,
        subscriptionEarnings: 0,
        orderEarnings: 0,
      });
    });
  });

  describe('getRegistrationsPerMonth', () => {
    it('should return registrations for last 10 months', async () => {
      const mockCount = 45;
      mockPrismaService.user.count.mockResolvedValue(mockCount);

      const result = await service.getRegistrationsPerMonth();

      expect(result).toHaveLength(10);
      expect(result[0]).toEqual({
        month: expect.any(String),
        year: expect.any(Number),
        count: mockCount,
        period: expect.any(String),
      });
      expect(mockPrismaService.user.count).toHaveBeenCalledTimes(10);
    });
  });

  describe('getCourseAnalytics', () => {
    it('should return course analytics', async () => {
      const mockTotalCourses = 25;
      const mockTotalEnrollments = 450;
      const mockTopCourses = [
        {
          id: 'course-1',
          title: 'Test Course',
          instructorName: 'John Doe',
          category: 'BARTENDING',
          _count: { enrollments: 45 },
        },
      ];
      const mockCategories = [
        { category: 'BARTENDING', _count: { id: 10 } },
        { category: 'MIXOLOGY', _count: { id: 8 } },
      ];

      mockPrismaService.course.count.mockResolvedValue(mockTotalCourses);
      mockPrismaService.userEnrollment.count.mockResolvedValue(mockTotalEnrollments);
      mockPrismaService.course.findMany.mockResolvedValue(mockTopCourses);
      mockPrismaService.course.groupBy.mockResolvedValue(mockCategories);

      const result = await service.getCourseAnalytics();

      expect(result).toEqual({
        totalCourses: mockTotalCourses,
        totalEnrollments: mockTotalEnrollments,
        averageEnrollmentsPerCourse: 18.0,
        topCourses: [
          {
            id: 'course-1',
            title: 'Test Course',
            instructorName: 'John Doe',
            category: 'BARTENDING',
            enrollmentCount: 45,
          },
        ],
        coursesByCategory: [
          { category: 'BARTENDING', count: 10 },
          { category: 'MIXOLOGY', count: 8 },
        ],
      });
    });
  });

  describe('getUserGrowthTrend', () => {
    it('should return user growth trend for last 12 months', async () => {
      const mockNewUsers = 45;
      const mockCumulativeUsers = 1250;
      
      mockPrismaService.user.count
        .mockResolvedValueOnce(mockNewUsers)
        .mockResolvedValueOnce(mockCumulativeUsers);

      const result = await service.getUserGrowthTrend();

      expect(result).toHaveLength(12);
      expect(result[0]).toEqual({
        month: expect.any(String),
        year: expect.any(Number),
        newUsers: mockNewUsers,
        cumulativeUsers: mockCumulativeUsers,
        period: expect.any(String),
      });
    });
  });

  describe('getDashboardStats', () => {
    it('should return comprehensive dashboard statistics', async () => {
      const mockData = {
        overallUsers: { totalUsers: 1250 },
        registrationStats: { monthlyRegistrations: 45, todayRegistrations: 3, todayPercentage: 6.67 },
        courseSellingStats: { monthlyCourseSales: 120, todayCourseSales: 8, todayPercentage: 6.67 },
        totalEarnings: { totalEarnings: 15420.50, subscriptionEarnings: 8900.00, orderEarnings: 6520.50 },
        registrationsPerMonth: [],
        courseAnalytics: {},
        userGrowthTrend: [],
      };

      jest.spyOn(service, 'getOverallUsers').mockResolvedValue(mockData.overallUsers);
      jest.spyOn(service, 'getRegistrationStats').mockResolvedValue(mockData.registrationStats);
      jest.spyOn(service, 'getCourseSellingStats').mockResolvedValue(mockData.courseSellingStats);
      jest.spyOn(service, 'getTotalEarnings').mockResolvedValue(mockData.totalEarnings);
      jest.spyOn(service, 'getRegistrationsPerMonth').mockResolvedValue(mockData.registrationsPerMonth);
      jest.spyOn(service, 'getCourseAnalytics').mockResolvedValue(mockData.courseAnalytics);
      jest.spyOn(service, 'getUserGrowthTrend').mockResolvedValue(mockData.userGrowthTrend);

      const result = await service.getDashboardStats();

      expect(result).toEqual(mockData);
    });
  });
});
