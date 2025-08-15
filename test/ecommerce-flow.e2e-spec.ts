import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('E-commerce Flow (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Test data
  let testUser: any;
  let testCourse: any;
  let testOrder: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Clean up test data
    await cleanupTestData();
    
    // Create test data
    await createTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  const cleanupTestData = async () => {
    await prismaService.userEnrollment.deleteMany({
      where: { userId: 'test-user-id' }
    });
    await prismaService.cartItem.deleteMany({
      where: { cart: { userId: 'test-user-id' } }
    });
    await prismaService.cart.deleteMany({
      where: { userId: 'test-user-id' }
    });
    await prismaService.wishlist.deleteMany({
      where: { userId: 'test-user-id' }
    });
    await prismaService.orderItem.deleteMany({
      where: { orderId: 'test-order-id' }
    });
    await prismaService.order.deleteMany({
      where: { id: 'test-order-id' }
    });
    await prismaService.course.deleteMany({
      where: { id: 'test-course-id' }
    });
    await prismaService.user.deleteMany({
      where: { id: 'test-user-id' }
    });
  };

  const createTestData = async () => {
    // Create test user
    testUser = await prismaService.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'STUDENT',
      },
    });

    // Create test course
    testCourse = await prismaService.course.create({
      data: {
        id: 'test-course-id',
        title: 'Test Bartending Course',
        description: 'A comprehensive test course for bartending',
        instructorName: 'Test Instructor',
        level: 'BEGINNER',
        category: 'BARTENDING',
      },
    });

    // Create test order
    testOrder = await prismaService.order.create({
      data: {
        id: 'test-order-id',
        userId: testUser.id,
        totalAmount: 99.99,
        currency: 'USD',
        country: 'US',
        status: 'PAID',
      },
    });
  };

  describe('Wishlist Flow', () => {
    it('should add course to wishlist', async () => {
      const response = await request(app.getHttpServer())
        .post(`/settings/wishlist/${testUser.id}`)
        .send({ courseId: testCourse.id })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.courseId).toBe(testCourse.id);
    });

    it('should get user wishlist', async () => {
      const response = await request(app.getHttpServer())
        .get(`/settings/wishlist/${testUser.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].courseId).toBe(testCourse.id);
    });

    it('should prevent duplicate wishlist entries', async () => {
      await request(app.getHttpServer())
        .post(`/settings/wishlist/${testUser.id}`)
        .send({ courseId: testCourse.id })
        .expect(400); // Should return error for duplicate
    });
  });

  describe('Cart Flow', () => {
    it('should add course to cart', async () => {
      const response = await request(app.getHttpServer())
        .post(`/settings/cart/${testUser.id}`)
        .send({ courseId: testCourse.id })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.items).toBeDefined();
    });

    it('should get user cart', async () => {
      const response = await request(app.getHttpServer())
        .get(`/settings/cart/${testUser.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should remove course from cart', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/settings/cart/${testUser.id}/${testCourse.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should clear user cart', async () => {
      // First add item back to cart
      await request(app.getHttpServer())
        .post(`/settings/cart/${testUser.id}`)
        .send({ courseId: testCourse.id });

      // Then clear cart
      const response = await request(app.getHttpServer())
        .delete(`/settings/cart/${testUser.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Enrollment Flow', () => {
    it('should enroll user in course', async () => {
      const response = await request(app.getHttpServer())
        .post(`/settings/enrollment/${testUser.id}`)
        .send({ 
          courseId: testCourse.id,
          orderId: testOrder.id 
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.courseId).toBe(testCourse.id);
      expect(response.body.orderId).toBe(testOrder.id);
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.progress).toBe(0);
    });

    it('should get user enrollments', async () => {
      const response = await request(app.getHttpServer())
        .get(`/settings/enrollment/${testUser.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].courseId).toBe(testCourse.id);
      expect(response.body[0].status).toBe('ACTIVE');
    });

    it('should update enrollment progress', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/settings/enrollment/${testUser.id}/${testCourse.id}`)
        .send({ progress: 50 })
        .expect(200);

      expect(response.body.progress).toBe(50);
      expect(response.body.lastAccessedAt).toBeDefined();
    });

    it('should get enrollment status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/settings/enrollment/${testUser.id}/${testCourse.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.courseId).toBe(testCourse.id);
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.progress).toBe(50);
    });

    it('should prevent duplicate enrollments', async () => {
      await request(app.getHttpServer())
        .post(`/settings/enrollment/${testUser.id}`)
        .send({ courseId: testCourse.id })
        .expect(400); // Should return error for duplicate enrollment
    });
  });

  describe('Admin Settings', () => {
    it('should create FAQ', async () => {
      const faqData = {
        title: 'Test FAQ',
        question: 'What is this test?',
        answer: 'This is a test FAQ entry',
        index: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/admin/settings/faq')
        .send(faqData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(faqData.title);
      expect(response.body.question).toBe(faqData.question);
      expect(response.body.answer).toBe(faqData.answer);
    });

    it('should create contact detail', async () => {
      const contactData = {
        type: 'EMAIL',
        label: 'Test Contact',
        value: 'test@example.com',
        icon: 'envelope',
        order: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/admin/settings/contact')
        .send(contactData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe(contactData.type);
      expect(response.body.label).toBe(contactData.label);
      expect(response.body.value).toBe(contactData.value);
    });

    it('should create available country', async () => {
      const countryData = {
        name: 'Test Country',
        code: 'TC',
        flag: '🏳️',
        order: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/admin/settings/country')
        .send(countryData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(countryData.name);
      expect(response.body.code).toBe(countryData.code);
      expect(response.body.flag).toBe(countryData.flag);
    });

    it('should create trending course', async () => {
      const trendingData = {
        courseId: testCourse.id,
        order: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/admin/settings/trending')
        .send(trendingData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.courseId).toBe(testCourse.id);
      expect(response.body.order).toBe(trendingData.order);
    });
  });

  describe('Data Validation', () => {
    it('should validate course ID format', async () => {
      await request(app.getHttpServer())
        .post(`/settings/wishlist/${testUser.id}`)
        .send({ courseId: 'invalid-uuid' })
        .expect(400);
    });

    it('should validate user ID format', async () => {
      await request(app.getHttpServer())
        .get('/settings/wishlist/invalid-uuid')
        .expect(400);
    });

    it('should validate progress range', async () => {
      await request(app.getHttpServer())
        .patch(`/settings/enrollment/${testUser.id}/${testCourse.id}`)
        .send({ progress: 150 }) // Invalid progress > 100
        .expect(400);
    });
  });
});
