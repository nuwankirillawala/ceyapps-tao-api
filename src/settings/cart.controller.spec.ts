import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('CartController', () => {
  let controller: CartController;
  let service: SettingsService;
  let prismaService: PrismaService;

  const mockSettingsService = {
    getOrCreateCart: jest.fn(),
    addToCart: jest.fn(),
    clearCart: jest.fn(),
    getCartSummary: jest.fn(),
    checkout: jest.fn(),
  };

  const mockPrismaService = {
    cart: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    cartItem: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
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

    controller = module.get<CartController>(CartController);
    service = module.get<SettingsService>(SettingsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserCart', () => {
    it('should get user cart successfully', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSettingsService.getOrCreateCart.mockResolvedValue(mockCart);

      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.getUserCart(mockReq);
      
      expect(result).toEqual(mockCart);
      expect(service.getOrCreateCart).toHaveBeenCalledWith('user-1');
    });
  });

  describe('addToCart', () => {
    it('should add item to cart successfully', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSettingsService.addToCart.mockResolvedValue(mockCart);

      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.addToCart(mockReq, { courseId: 'course-1' });
      
      expect(result).toEqual(mockCart);
      expect(service.addToCart).toHaveBeenCalledWith('user-1', { courseId: 'course-1' });
    });

    it('should handle errors when adding to cart', async () => {
      mockSettingsService.addToCart.mockRejectedValue(new Error('Course not found'));

      const mockReq = { user: { userId: 'user-1' } };
      await expect(controller.addToCart(mockReq, { courseId: 'invalid-course' }))
        .rejects.toThrow('Course not found');
    });
  });

  describe('clearCart', () => {
    it('should clear user cart successfully', async () => {
      mockSettingsService.clearCart.mockResolvedValue({ message: 'Cart cleared successfully' });

      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.clearCart(mockReq);
      
      expect(result).toEqual({ message: 'Cart cleared successfully' });
      expect(service.clearCart).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getCartSummary', () => {
    it('should return cart summary successfully', async () => {
      const mockSummary = {
        totalCourses: 2,
        estimatedPrice: 199.98,
        currency: 'USD',
      };

      mockSettingsService.getCartSummary.mockResolvedValue(mockSummary);

      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.getCartSummary(mockReq, 'US');
      
      expect(result).toEqual(mockSummary);
      expect(service.getCartSummary).toHaveBeenCalledWith('user-1', 'US');
    });
  });

  describe('checkout', () => {
    it('should process checkout successfully', async () => {
      const mockCheckout = {
        orderId: 'order-1',
        paymentIntent: 'pi_test_123',
        status: 'pending',
      };

      mockSettingsService.checkout.mockResolvedValue(mockCheckout);

      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.checkout(mockReq, { 
        courseIds: ['course-1', 'course-2'],
        country: 'US',
        paymentMethodId: 'pm_test_123'
      });
      
      expect(result).toEqual(mockCheckout);
      expect(service.checkout).toHaveBeenCalledWith('user-1', { 
        courseIds: ['course-1', 'course-2'],
        country: 'US',
        paymentMethodId: 'pm_test_123'
      });
    });
  });
});
