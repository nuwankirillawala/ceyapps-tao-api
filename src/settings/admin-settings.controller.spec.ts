import { Test, TestingModule } from '@nestjs/testing';
import { AdminSettingsController } from './admin-settings.controller';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ContactType } from './dto/contact-details.dto';

describe('AdminSettingsController', () => {
  let controller: AdminSettingsController;
  let service: SettingsService;
  let prismaService: PrismaService;

  const mockSettingsService = {
    createFaq: jest.fn(),
    updateFaq: jest.fn(),
    deleteFaq: jest.fn(),
    getAllFaqs: jest.fn(),
    createContactDetail: jest.fn(),
    updateContactDetail: jest.fn(),
    deleteContactDetail: jest.fn(),
    getAllContactDetails: jest.fn(),
    createCountry: jest.fn(),
    updateCountry: jest.fn(),
    deleteCountry: jest.fn(),
    getAllCountries: jest.fn(),
    createTrendingCourse: jest.fn(),
    updateTrendingCourse: jest.fn(),
    deleteTrendingCourse: jest.fn(),
    getAllTrendingCourses: jest.fn(),
  };

  const mockPrismaService = {
    fAQ: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    contactDetails: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    availableCountry: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    trendingCourse: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminSettingsController],
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

    controller = module.get<AdminSettingsController>(AdminSettingsController);
    service = module.get<SettingsService>(SettingsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('FAQ Management', () => {
    it('should create FAQ successfully', async () => {
      const mockFAQ = {
        id: 'faq-1',
        title: 'How to get started?',
        question: 'What do I need to begin?',
        answer: 'You need to create an account and browse courses.',
        index: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSettingsService.createFaq.mockResolvedValue(mockFAQ);

      const result = await controller.createFaq({
        title: 'How to get started?',
        question: 'What do I need to begin?',
        answer: 'You need to create an account and browse courses.',
        index: 1,
      });
      
      expect(result).toEqual(mockFAQ);
      expect(service.createFaq).toHaveBeenCalledWith({
        title: 'How to get started?',
        question: 'What do I need to begin?',
        answer: 'You need to create an account and browse courses.',
        index: 1,
      });
    });

    it('should get all FAQs', async () => {
      const mockFAQs = [
        {
          id: 'faq-1',
          title: 'Getting Started',
          question: 'How to begin?',
          answer: 'Create an account',
          index: 1,
          isActive: true,
        },
        {
          id: 'faq-2',
          title: 'Payment',
          question: 'How to pay?',
          answer: 'Use credit card',
          index: 2,
          isActive: true,
        },
      ];

      mockSettingsService.getAllFaqs.mockResolvedValue(mockFAQs);

      const result = await controller.getAllFaqs();
      
      expect(result).toEqual(mockFAQs);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Getting Started');
    });
  });

  describe('Contact Details Management', () => {
    it('should create contact detail successfully', async () => {
      const mockContact = {
        id: 'contact-1',
        type: 'EMAIL',
        label: 'Support Email',
        value: 'support@example.com',
        icon: 'envelope',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSettingsService.createContactDetail.mockResolvedValue(mockContact);

      const result = await controller.createContactDetail({
        type: ContactType.EMAIL,
        label: 'Support Email',
        value: 'support@example.com',
        icon: 'envelope',
        order: 1,
      });
      
      expect(result).toEqual(mockContact);
      expect(result.type).toBe('EMAIL');
      expect(result.label).toBe('Support Email');
    });

    it('should get all contact details', async () => {
      const mockContacts = [
        {
          id: 'contact-1',
          type: 'EMAIL',
          label: 'Support Email',
          value: 'support@example.com',
          icon: 'envelope',
          isActive: true,
          order: 1,
        },
        {
          id: 'contact-2',
          type: 'PHONE',
          label: 'Main Office',
          value: '+1234567890',
          icon: 'phone',
          isActive: true,
          order: 2,
        },
      ];

      mockSettingsService.getAllContactDetails.mockResolvedValue(mockContacts);

      const result = await controller.getAllContactDetails();
      
      expect(result).toEqual(mockContacts);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe(ContactType.EMAIL);
      expect(result[1].type).toBe(ContactType.PHONE);
    });
  });

  describe('Available Countries Management', () => {
    it('should create available country successfully', async () => {
      const mockCountry = {
        id: 'country-1',
        name: 'United States',
        code: 'US',
        flag: '🇺🇸',
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSettingsService.createCountry.mockResolvedValue(mockCountry);

      const result = await controller.createCountry({
        name: 'United States',
        code: 'US',
        flag: '🇺🇸',
        order: 1,
      });
      
      expect(result).toEqual(mockCountry);
      expect(result.name).toBe('United States');
      expect(result.code).toBe('US');
      expect(result.flag).toBe('🇺🇸');
    });

    it('should get all available countries', async () => {
      const mockCountries = [
        {
          id: 'country-1',
          name: 'United States',
          code: 'US',
          flag: '🇺🇸',
          isActive: true,
          order: 1,
        },
        {
          id: 'country-2',
          name: 'United Kingdom',
          code: 'UK',
          flag: '🇬🇧',
          isActive: true,
          order: 2,
        },
      ];

      mockSettingsService.getAllCountries.mockResolvedValue(mockCountries);

      const result = await controller.getAllCountries();
      
      expect(result).toEqual(mockCountries);
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('US');
      expect(result[1].code).toBe('UK');
    });
  });

  describe('Trending Courses Management', () => {
    it('should create trending course successfully', async () => {
      const mockTrendingCourse = {
        id: 'trending-1',
        courseId: 'course-1',
        course: {
          id: 'course-1',
          title: 'Bartending Basics',
          description: 'Learn bartending fundamentals',
        },
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSettingsService.createTrendingCourse.mockResolvedValue(mockTrendingCourse);

      const result = await controller.createTrendingCourse({
        courseId: 'course-1',
        order: 1,
      });
      
      expect(result).toEqual(mockTrendingCourse);
      expect(result.course.title).toBe('Bartending Basics');
      expect(result.order).toBe(1);
    });

    it('should get all trending courses', async () => {
      const mockTrendingCourses = [
        {
          id: 'trending-1',
          courseId: 'course-1',
          course: {
            id: 'course-1',
            title: 'Bartending Basics',
            description: 'Learn bartending fundamentals',
          },
          order: 1,
          isActive: true,
        },
        {
          id: 'trending-2',
          courseId: 'course-2',
          course: {
            id: 'course-2',
            title: 'Advanced Mixology',
            description: 'Master advanced techniques',
          },
          order: 2,
          isActive: true,
        },
      ];

      mockSettingsService.getAllTrendingCourses.mockResolvedValue(mockTrendingCourses);

      const result = await controller.getAllTrendingCourses();
      
      expect(result).toEqual(mockTrendingCourses);
      expect(result).toHaveLength(2);
      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2);
    });
  });
});
