import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentController } from './enrollment.controller';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('EnrollmentController', () => {
  let controller: EnrollmentController;
  let service: SettingsService;
  let prismaService: PrismaService;

  const mockSettingsService = {
    enrollCourse: jest.fn(),
  };

  const mockPrismaService = {
    userEnrollment: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentController],
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

    controller = module.get<EnrollmentController>(EnrollmentController);
    service = module.get<SettingsService>(SettingsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('enrollCourse', () => {
    it('should enroll user in course successfully', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        courseId: 'course-1',
        orderId: 'order-1',
        enrolledAt: new Date(),
        status: 'ACTIVE',
        progress: 0,
        lastAccessedAt: new Date(),
      };

      mockSettingsService.enrollCourse.mockResolvedValue(mockEnrollment);

      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.enrollCourse(mockReq, { 
        courseId: 'course-1',
        country: 'US',
        paymentMethodId: 'pm_test_123'
      });
      
      expect(result).toEqual(mockEnrollment);
      expect(service.enrollCourse).toHaveBeenCalledWith('user-1', { 
        courseId: 'course-1',
        country: 'US',
        paymentMethodId: 'pm_test_123'
      });
    });

    it('should handle enrollment without payment method', async () => {
      const mockEnrollment = {
        id: 'enrollment-1',
        userId: 'user-1',
        courseId: 'course-1',
        orderId: null,
        enrolledAt: new Date(),
        status: 'ACTIVE',
        progress: 0,
        lastAccessedAt: new Date(),
      };

      mockSettingsService.enrollCourse.mockResolvedValue(mockEnrollment);

      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.enrollCourse(mockReq, { 
        courseId: 'course-1',
        country: 'US'
      });
      
      expect(result).toEqual(mockEnrollment);
      expect(result.orderId).toBeNull();
    });

    it('should handle duplicate enrollment attempts', async () => {
      mockSettingsService.enrollCourse.mockRejectedValue(new Error('User already enrolled in this course'));

      const mockReq = { user: { userId: 'user-1' } };
      await expect(controller.enrollCourse(mockReq, { 
        courseId: 'course-1',
        country: 'US'
      }))
        .rejects.toThrow('User already enrolled in this course');
    });

    it('should handle invalid course ID', async () => {
      mockSettingsService.enrollCourse.mockRejectedValue(new Error('Course not found'));

      const mockReq = { user: { userId: 'user-1' } };
      await expect(controller.enrollCourse(mockReq, { 
        courseId: 'invalid-course-id',
        country: 'US'
      }))
        .rejects.toThrow('Course not found');
    });
  });
});
