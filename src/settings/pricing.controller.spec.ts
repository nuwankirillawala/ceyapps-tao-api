import { Test, TestingModule } from '@nestjs/testing';
import { PricingController } from './pricing.controller';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/enums/role.enum';
import {
  CreatePricingDto,
  UpdatePricingDto,
  CreateCoursePricingDto,
  UpdateCoursePricingDto,
  PricingQueryDto,
  BulkPricingUpdateDto,
  PricingTier,
  ChangeReason,
} from './dto/pricing.dto';

describe('PricingController', () => {
  let controller: PricingController;
  let service: SettingsService;
  let prismaService: PrismaService;

  const mockSettingsService = {
    createPricing: jest.fn(),
    getAllPricing: jest.fn(),
    getPricingById: jest.fn(),
    updatePricing: jest.fn(),
    deletePricing: jest.fn(),
    createCoursePricing: jest.fn(),
    getCoursePricing: jest.fn(),
    updateCoursePricing: jest.fn(),
    deleteCoursePricing: jest.fn(),
    bulkUpdatePricing: jest.fn(),
    getPricingHistory: jest.fn(),
    getPricingAnalytics: jest.fn(),
    validatePricing: jest.fn(),
  };

  const mockPrismaService = {
    pricing: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    coursePricing: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    pricingHistory: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricingController],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PricingController>(PricingController);
    service = module.get<SettingsService>(SettingsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Pricing Management', () => {
    it('should create pricing successfully', async () => {
      const mockPricing = {
        id: 'pricing-1',
        price: 99.99,
        currency: 'USD',
        country: 'US',
        region: 'North America',
        isActive: true,
        validFrom: new Date(),
        validTo: null,
        discount: null,
        originalPrice: 99.99,
        pricingTier: 'BASIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createPricingDto: CreatePricingDto = {
        price: 99.99,
        country: 'US',
      };

      mockSettingsService.createPricing.mockResolvedValue(mockPricing);

      const result = await controller.createPricing(createPricingDto);

      expect(result).toEqual(mockPricing);
      expect(service.createPricing).toHaveBeenCalledWith(createPricingDto);
    });

    it('should get all pricing with filters', async () => {
      const mockPricings = [
        {
          id: 'pricing-1',
          price: 99.99,
          country: 'US',
        },
        {
          id: 'pricing-2',
          price: 79.99,
          country: 'UK',
        },
      ];

      const query: PricingQueryDto = {
        country: 'US',
        currency: 'USD',
        isActive: true,
      };

      mockSettingsService.getAllPricing.mockResolvedValue(mockPricings);

      const result = await controller.getAllPricing(query);

      expect(result).toEqual(mockPricings);
      expect(service.getAllPricing).toHaveBeenCalledWith(query);
    });

    it('should get pricing by ID', async () => {
      const mockPricing = {
        id: 'pricing-1',
        price: 99.99,
        country: 'US',
      };

      mockSettingsService.getPricingById.mockResolvedValue(mockPricing);

      const result = await controller.getPricingById('pricing-1');

      expect(result).toEqual(mockPricing);
      expect(service.getPricingById).toHaveBeenCalledWith('pricing-1');
    });

    it('should update pricing successfully', async () => {
      const mockPricing = {
        id: 'pricing-1',
        price: 89.99,
        country: 'US',
      };

      const updatePricingDto: UpdatePricingDto = {
        price: 89.99,
      };

      mockSettingsService.updatePricing.mockResolvedValue(mockPricing);

      const result = await controller.updatePricing('pricing-1', updatePricingDto);

      expect(result).toEqual(mockPricing);
      expect(service.updatePricing).toHaveBeenCalledWith('pricing-1', updatePricingDto);
    });

    it('should delete pricing successfully', async () => {
      mockSettingsService.deletePricing.mockResolvedValue(undefined);

      await controller.deletePricing('pricing-1');

      expect(service.deletePricing).toHaveBeenCalledWith('pricing-1');
    });
  });

  describe('Course Pricing Management', () => {
    it('should create course pricing successfully', async () => {
      const mockCoursePricing = {
        id: 'course-pricing-1',
        courseId: 'course-1',
        pricingId: 'pricing-1',
        isActive: true,
        course: {
          id: 'course-1',
          title: 'Bartending Basics',
          description: 'Learn bartending fundamentals',
          instructorName: 'John Doe',
          level: 'BEGINNER',
          category: 'BARTENDING',
        },
        pricing: {
          id: 'pricing-1',
          price: 99.99,
          currency: 'USD',
          country: 'US',
        },
      };

      const createCoursePricingDto: CreateCoursePricingDto = {
        courseId: 'course-1',
        pricingId: 'pricing-1',
      };

      mockSettingsService.createCoursePricing.mockResolvedValue(mockCoursePricing);

      const result = await controller.createCoursePricing(createCoursePricingDto);

      expect(result).toEqual(mockCoursePricing);
      expect(service.createCoursePricing).toHaveBeenCalledWith(createCoursePricingDto);
    });

    it('should get course pricing', async () => {
      const mockCoursePricings = [
        {
          id: 'course-pricing-1',
          courseId: 'course-1',
          pricing: {
            id: 'pricing-1',
            price: 99.99,
            currency: 'USD',
            country: 'US',
          },
        },
      ];

      mockSettingsService.getCoursePricing.mockResolvedValue(mockCoursePricings);

      const result = await controller.getCoursePricing('course-1', 'US', 'North America');

      expect(result).toEqual(mockCoursePricings);
      expect(service.getCoursePricing).toHaveBeenCalledWith('course-1', 'US', 'North America');
    });

    it('should update course pricing', async () => {
      const mockCoursePricing = {
        id: 'course-pricing-1',
        isActive: false,
      };

      const updateCoursePricingDto: UpdateCoursePricingDto = {
        courseId: 'course-1',
        pricingId: 'pricing-1',
      };

      mockSettingsService.updateCoursePricing.mockResolvedValue(mockCoursePricing);

      const result = await controller.updateCoursePricing('course-pricing-1', updateCoursePricingDto);

      expect(result).toEqual(mockCoursePricing);
      expect(service.updateCoursePricing).toHaveBeenCalledWith('course-pricing-1', updateCoursePricingDto);
    });

    it('should delete course pricing', async () => {
      mockSettingsService.deleteCoursePricing.mockResolvedValue(undefined);

      await controller.deleteCoursePricing('course-pricing-1');

      expect(service.deleteCoursePricing).toHaveBeenCalledWith('course-pricing-1');
    });
  });

  describe('Bulk Operations', () => {
    it('should perform bulk pricing update', async () => {
      const mockResults = [
        {
          id: 'course-pricing-1',
          courseId: 'course-1',
          pricing: { price: 99.99, country: 'US' },
        },
      ];

      const bulkPricingUpdateDto: BulkPricingUpdateDto = {
        courseIds: ['course-1', 'course-2'],
        pricing: {
          price: 99.99,
          country: 'US',
        },
        changeReason: 'PRICE_UPDATE',
      };

      const mockReq = { user: { userId: 'admin-1' } };

      mockSettingsService.bulkUpdatePricing.mockResolvedValue(mockResults);

      const result = await controller.bulkUpdatePricing(bulkPricingUpdateDto, mockReq);

      expect(result).toEqual(mockResults);
      expect(service.bulkUpdatePricing).toHaveBeenCalledWith(bulkPricingUpdateDto, 'admin-1');
    });
  });

  describe('Pricing History', () => {
    it('should get pricing history', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          courseId: 'course-1',
          oldPrice: 99.99,
          newPrice: 89.99,
          currency: 'USD',
          country: 'US',
          changeReason: ChangeReason.DISCOUNT,
          changedAt: new Date(),
        },
      ];

      mockSettingsService.getPricingHistory.mockResolvedValue(mockHistory);

      const result = await controller.getPricingHistory('course-1', 'US', 'North America', 10);

      expect(result).toEqual(mockHistory);
      expect(service.getPricingHistory).toHaveBeenCalledWith('course-1', 'US', 'North America', 10);
    });
  });

  describe('Pricing Analytics', () => {
    it('should get pricing analytics', async () => {
      const mockAnalytics = {
        totalCourses: 10,
        averagePrice: 99.99,
        priceRange: { min: 49.99, max: 199.99 },
        currencyDistribution: { USD: 5, EUR: 3, GBP: 2 },
        regionalPricing: [
          { country: 'US', averagePrice: 99.99, courseCount: 5 },
        ],
      };

      mockSettingsService.getPricingAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getPricingAnalytics('US', 'North America', '2024-01-01', '2024-12-31');

      expect(result).toEqual(mockAnalytics);
      expect(service.getPricingAnalytics).toHaveBeenCalledWith('US', 'North America', '2024-01-01', '2024-12-31');
    });
  });

  describe('Pricing Validation', () => {
    it('should validate pricing configuration', async () => {
      const mockValidation = {
        isValid: true,
        issues: [],
        warnings: ['Pricing already exists for this country/region combination'],
      };

      const pricingData: CreatePricingDto = {
        price: 99.99,
        country: 'US',
      };

      mockSettingsService.validatePricing.mockResolvedValue(mockValidation);

      const result = await controller.validatePricing(pricingData);

      expect(result).toEqual(mockValidation);
      expect(service.validatePricing).toHaveBeenCalledWith(pricingData);
    });
  });
});
