import { Test, TestingModule } from '@nestjs/testing';
import { WishlistController } from './wishlist.controller';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('WishlistController', () => {
  let controller: WishlistController;
  let service: SettingsService;
  let prismaService: PrismaService;

  const mockSettingsService = {
    addToWishlist: jest.fn(),
    removeFromWishlist: jest.fn(),
    getUserWishlist: jest.fn(),
    checkWishlistStatus: jest.fn(),
  };

  const mockPrismaService = {
    wishlist: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistController],
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

    controller = module.get<WishlistController>(WishlistController);
    service = module.get<SettingsService>(SettingsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addToWishlist', () => {
    it('should add course to wishlist successfully', async () => {
      const mockWishlistItem = {
        id: 'wishlist-1',
        userId: 'user-1',
        courseId: 'course-1',
        course: { title: 'Test Course' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSettingsService.addToWishlist.mockResolvedValue(mockWishlistItem);

      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.addToWishlist(mockReq, { courseId: 'course-1' });
      
      expect(result).toEqual(mockWishlistItem);
      expect(service.addToWishlist).toHaveBeenCalledWith('user-1', { courseId: 'course-1' });
    });

    it('should handle duplicate wishlist entries', async () => {
      mockSettingsService.addToWishlist.mockRejectedValue(new Error('Course already in wishlist'));

      const mockReq = { user: { userId: 'user-1' } };
      await expect(controller.addToWishlist(mockReq, { courseId: 'course-1' }))
        .rejects.toThrow('Course already in wishlist');
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove course from wishlist successfully', async () => {
      mockSettingsService.removeFromWishlist.mockResolvedValue({ message: 'Removed from wishlist' });

      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.removeFromWishlist(mockReq, { courseId: 'course-1' });
      
      expect(result).toEqual({ message: 'Removed from wishlist' });
      expect(service.removeFromWishlist).toHaveBeenCalledWith('user-1', { courseId: 'course-1' });
    });

    it('should handle non-existent wishlist item', async () => {
      mockSettingsService.removeFromWishlist.mockRejectedValue(new Error('Wishlist item not found'));

      const mockReq = { user: { userId: 'user-1' } };
      await expect(controller.removeFromWishlist(mockReq, { courseId: 'invalid-course' }))
        .rejects.toThrow('Wishlist item not found');
    });
  });

  describe('getUserWishlist', () => {
    it('should return user wishlist with courses', async () => {
      const mockWishlist = [
        {
          id: 'wishlist-1',
          userId: 'user-1',
          courseId: 'course-1',
          course: { 
            id: 'course-1',
            title: 'Test Course 1',
            description: 'Test Description 1',
            instructorName: 'Test Instructor',
            level: 'BEGINNER',
            category: 'BARTENDING',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'wishlist-2',
          userId: 'user-1',
          courseId: 'course-2',
          course: { 
            id: 'course-2',
            title: 'Test Course 2',
            description: 'Test Description 2',
            instructorName: 'Test Instructor 2',
            level: 'INTERMEDIATE',
            category: 'COOKING',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockSettingsService.getUserWishlist.mockResolvedValue(mockWishlist);

      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.getUserWishlist(mockReq, 1, 10);
      
      expect(result).toEqual(mockWishlist);
      expect(service.getUserWishlist).toHaveBeenCalledWith('user-1', 1, 10);
      expect(result).toHaveLength(2);
      expect(result[0].course.title).toBe('Test Course 1');
      expect(result[1].course.title).toBe('Test Course 2');
    });

    it('should return empty array for user with no wishlist', async () => {
      mockSettingsService.getUserWishlist.mockResolvedValue([]);

      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.getUserWishlist(mockReq);
      
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('checkWishlistStatus', () => {
    it('should check if course is in wishlist', async () => {
      const mockStatus = {
        isInWishlist: true,
        addedAt: new Date(),
      };

      mockSettingsService.checkWishlistStatus.mockResolvedValue(mockStatus);

      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.checkWishlistStatus(mockReq, 'course-1');
      
      expect(result).toEqual(mockStatus);
      expect(service.checkWishlistStatus).toHaveBeenCalledWith('user-1', 'course-1');
      expect(result.isInWishlist).toBe(true);
    });
  });
});
