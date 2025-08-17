import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudflareService } from '../cloudflare/cloudflare.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AddPaymentMethodDto, UpdatePaymentMethodDto, SetDefaultPaymentMethodDto } from './dto/payment-method.dto';
import { ContactSupportDto, FaqQueryDto, HelpCategory } from './dto/help.dto';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { CreateContactDetailsDto, UpdateContactDetailsDto } from './dto/contact-details.dto';
import { CreateAvailableCountryDto, UpdateAvailableCountryDto } from './dto/available-country.dto';
import { CreateTrendingCourseDto, UpdateTrendingCourseDto } from './dto/trending-course.dto';
import { AddToWishlistDto, RemoveFromWishlistDto } from './dto/wishlist.dto';
import { AddToCartDto, CheckoutDto, EnrollCourseDto, UpdateCartItemDto, RemoveFromCartDto } from './dto/cart.dto';
import {
  CreatePricingDto,
  UpdatePricingDto,
  CreateCoursePricingDto,
  UpdateCoursePricingDto,
  PricingQueryDto,
  BulkPricingUpdateDto,
} from './dto/pricing.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private cloudflareService: CloudflareService,
  ) {}

  // ===== PROFILE SECTION =====

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being updated and if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateProfileDto.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: updateProfileDto.displayName || user.name,
        email: updateProfileDto.email || user.email,
        phoneNumber: updateProfileDto.phoneNumber || user.phoneNumber,
        // Add additional profile fields if they exist in your schema
        // bio: updateProfileDto.bio,
        // location: updateProfileDto.location,
        // website: updateProfileDto.website,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        profileImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upload image to Cloudflare
    const uploadResult = await this.cloudflareService.uploadImage(file, {
      userId,
      type: 'profile',
    });

    // Update user profile with new image URL
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: uploadResult.url,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        profileImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        profileImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ===== SECURITY SECTION =====

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password matches confirmation
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    return { message: 'Password changed successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If an account with this email exists, a password reset link has been sent' };
    }

    // Generate reset token (you might want to use a proper JWT or crypto library)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store reset token with expiration (you'll need to add this to your schema)
    // await this.prisma.passwordReset.create({
    //   data: {
    //     userId: user.id,
    //     token: resetToken,
    //     expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    //   },
    // });

    // Send email with reset link (implement your email service)
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'Password reset link sent to your email' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Verify token and get user
    // const passwordReset = await this.prisma.passwordReset.findUnique({
    //   where: { token },
    //   include: { user: true },
    // });

    // if (!passwordReset || passwordReset.expiresAt < new Date()) {
    //   throw new BadRequestException('Invalid or expired reset token');
    // }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    // await this.prisma.user.update({
    //   where: { id: passwordReset.userId },
    //   data: { password: hashedPassword },
    // });

    // Delete used reset token
    // await this.prisma.passwordReset.delete({
    //   where: { id: passwordReset.id },
    // });

    return { message: 'Password reset successfully' };
  }

  // ===== BILLING SECTION =====

  async getPaymentMethods(userId: string) {
    // This would integrate with Stripe to get user's payment methods
    // For now, returning mock data
    return {
      paymentMethods: [
        {
          id: 'pm_1234567890',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          expMonth: 12,
          expYear: 2025,
          isDefault: true,
          nickname: 'My Credit Card',
        },
      ],
      defaultPaymentMethod: 'pm_1234567890',
    };
  }

  async addPaymentMethod(userId: string, addPaymentMethodDto: AddPaymentMethodDto) {
    // This would integrate with Stripe to add payment method
    // For now, returning mock response
    return {
      id: 'pm_newpaymentmethod',
      type: addPaymentMethodDto.type,
      isDefault: addPaymentMethodDto.setAsDefault || false,
      message: 'Payment method added successfully',
    };
  }

  async updatePaymentMethod(userId: string, paymentMethodId: string, updatePaymentMethodDto: UpdatePaymentMethodDto) {
    // This would integrate with Stripe to update payment method
    return {
      id: paymentMethodId,
      nickname: updatePaymentMethodDto.nickname,
      isDefault: updatePaymentMethodDto.setAsDefault || false,
      message: 'Payment method updated successfully',
    };
  }

  async setDefaultPaymentMethod(userId: string, setDefaultPaymentMethodDto: SetDefaultPaymentMethodDto) {
    // This would integrate with Stripe to set default payment method
    return {
      message: 'Default payment method updated successfully',
      defaultPaymentMethodId: setDefaultPaymentMethodDto.paymentMethodId,
    };
  }

  async removePaymentMethod(userId: string, paymentMethodId: string) {
    // This would integrate with Stripe to remove payment method
    return {
      message: 'Payment method removed successfully',
    };
  }

  async getPurchaseHistory(userId: string) {
    // This would get from your orders table
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  // ===== HELP SECTION =====

  async contactSupport(userId: string, contactSupportDto: ContactSupportDto) {
    // Create support ticket
    const supportTicket = await this.prisma.supportTicket.create({
      data: {
        userId,
        subject: contactSupportDto.subject,
        message: contactSupportDto.message,
        category: contactSupportDto.category,
        email: contactSupportDto.email,
        contactInfo: contactSupportDto.contactInfo,
        status: 'OPEN',
      },
    });

    // Send notification to support team (implement your notification service)
    // await this.notificationService.notifySupport(supportTicket);

    return {
      ticketId: supportTicket.id,
      message: 'Support ticket created successfully. We will get back to you soon.',
    };
  }

  async getFaq(faqQueryDto: FaqQueryDto) {
    // This would typically come from a database
    const faqs = [
      {
        id: 1,
        question: 'How do I change my password?',
        answer: 'Go to Settings > Security > Change Password to update your password.',
        category: HelpCategory.ACCOUNT,
        tags: ['password', 'security'],
      },
      {
        id: 2,
        question: 'How do I add a payment method?',
        answer: 'Navigate to Settings > Billing > Payment Methods to add a new payment method.',
        category: HelpCategory.PAYMENT,
        tags: ['payment', 'billing'],
      },
      {
        id: 3,
        question: 'How do I access my purchased courses?',
        answer: 'Go to My Courses in your dashboard to access all your purchased courses.',
        category: HelpCategory.COURSE_ACCESS,
        tags: ['courses', 'access'],
      },
      {
        id: 4,
        question: 'How do I update my profile picture?',
        answer: 'Go to Settings > Profile and click on your profile picture to upload a new one.',
        category: HelpCategory.ACCOUNT,
        tags: ['profile', 'picture'],
      },
      {
        id: 5,
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, PayPal, and bank transfers.',
        category: HelpCategory.PAYMENT,
        tags: ['payment', 'methods'],
      },
    ];

    // Filter by category if provided
    let filteredFaqs = faqs;
    if (faqQueryDto.category) {
      filteredFaqs = faqs.filter(faq => faq.category === faqQueryDto.category);
    }

    // Filter by query if provided
    if (faqQueryDto.query) {
      const query = faqQueryDto.query.toLowerCase();
      filteredFaqs = filteredFaqs.filter(
        faq => 
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query) ||
          faq.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return {
      faqs: filteredFaqs,
      total: filteredFaqs.length,
    };
  }

  async getSupportTickets(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return tickets;
  }

  async getSupportTicket(userId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { 
        id: ticketId,
        userId, // Ensure user can only see their own tickets
      },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return ticket;
  }

  // ===== ADMIN SETTINGS METHODS =====

  // FAQ Management
  async getAllFaqs(page: number = 1, limit: number = 10, isActive?: boolean) {
    const skip = (page - 1) * limit;
    
    const where = isActive !== undefined ? { isActive } : {};
    
    const [faqs, total] = await Promise.all([
      this.prisma.fAQ.findMany({
        where,
        orderBy: { index: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.fAQ.count({ where }),
    ]);

    return {
      faqs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFaqById(id: string) {
    const faq = await this.prisma.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    return faq;
  }

  async createFaq(createFaqDto: CreateFaqDto) {
    // Check if index is already taken
    const existingFaq = await this.prisma.fAQ.findUnique({
      where: { index: createFaqDto.index },
    });

    if (existingFaq) {
      throw new BadRequestException(`FAQ with index ${createFaqDto.index} already exists`);
    }

    return this.prisma.fAQ.create({
      data: createFaqDto,
    });
  }

  async updateFaq(id: string, updateFaqDto: UpdateFaqDto) {
    const faq = await this.prisma.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    // If updating index, check if it's already taken by another FAQ
    if (updateFaqDto.index && updateFaqDto.index !== faq.index) {
      const existingFaq = await this.prisma.fAQ.findUnique({
        where: { index: updateFaqDto.index },
      });

      if (existingFaq) {
        throw new BadRequestException(`FAQ with index ${updateFaqDto.index} already exists`);
      }
    }

    return this.prisma.fAQ.update({
      where: { id },
      data: updateFaqDto,
    });
  }

  async deleteFaq(id: string) {
    const faq = await this.prisma.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    await this.prisma.fAQ.delete({
      where: { id },
    });

    return { message: 'FAQ deleted successfully' };
  }

  async toggleFaqStatus(id: string) {
    const faq = await this.prisma.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    return this.prisma.fAQ.update({
      where: { id },
      data: { isActive: !faq.isActive },
    });
  }

  // Contact Details Management
  async getAllContactDetails(page: number = 1, limit: number = 10, type?: string, isActive?: boolean) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (type) where.type = type;
    
    const [contactDetails, total] = await Promise.all([
      this.prisma.contactDetails.findMany({
        where,
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.contactDetails.count({ where }),
    ]);

    return {
      contactDetails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getContactDetailById(id: string) {
    const contactDetail = await this.prisma.contactDetails.findUnique({
      where: { id },
    });

    if (!contactDetail) {
      throw new NotFoundException('Contact detail not found');
    }

    return contactDetail;
  }

  async createContactDetail(createContactDetailsDto: CreateContactDetailsDto) {
    // Check if type and label combination already exists
    const existingContact = await this.prisma.contactDetails.findFirst({
      where: {
        type: createContactDetailsDto.type,
        label: createContactDetailsDto.label,
      },
    });

    if (existingContact) {
      throw new BadRequestException(`Contact detail with type ${createContactDetailsDto.type} and label ${createContactDetailsDto.label} already exists`);
    }

    return this.prisma.contactDetails.create({
      data: createContactDetailsDto,
    });
  }

  async updateContactDetail(id: string, updateContactDetailsDto: UpdateContactDetailsDto) {
    const contactDetail = await this.prisma.contactDetails.findUnique({
      where: { id },
    });

    if (!contactDetail) {
      throw new NotFoundException('Contact detail not found');
    }

    // If updating type and label, check if combination already exists
    if (updateContactDetailsDto.type && updateContactDetailsDto.label) {
      const existingContact = await this.prisma.contactDetails.findFirst({
        where: {
          type: updateContactDetailsDto.type,
          label: updateContactDetailsDto.label,
          id: { not: id }, // Exclude current record
        },
      });

      if (existingContact) {
        throw new BadRequestException(`Contact detail with type ${updateContactDetailsDto.type} and label ${updateContactDetailsDto.label} already exists`);
      }
    }

    return this.prisma.contactDetails.update({
      where: { id },
      data: updateContactDetailsDto,
    });
  }

  async deleteContactDetail(id: string) {
    const contactDetail = await this.prisma.contactDetails.findUnique({
      where: { id },
    });

    if (!contactDetail) {
      throw new NotFoundException('Contact detail not found');
    }

    await this.prisma.contactDetails.delete({
      where: { id },
    });

    return { message: 'Contact detail deleted successfully' };
  }

  // Available Countries Management
  async getAllCountries(page: number = 1, limit: number = 10, isActive?: boolean) {
    const skip = (page - 1) * limit;
    
    const where = isActive !== undefined ? { isActive } : {};
    
    const [countries, total] = await Promise.all([
      this.prisma.availableCountry.findMany({
        where,
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.availableCountry.count({ where }),
    ]);

    return {
      countries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCountryById(id: string) {
    const country = await this.prisma.availableCountry.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException('Country not found');
    }

    return country;
  }

  async createCountry(createCountryDto: CreateAvailableCountryDto) {
    // Check if country name or code already exists
    const existingCountry = await this.prisma.availableCountry.findFirst({
      where: {
        OR: [
          { name: createCountryDto.name },
          { code: createCountryDto.code },
        ],
      },
    });

    if (existingCountry) {
      throw new BadRequestException(`Country with name ${createCountryDto.name} or code ${createCountryDto.code} already exists`);
    }

    return this.prisma.availableCountry.create({
      data: createCountryDto,
    });
  }

  async updateCountry(id: string, updateCountryDto: UpdateAvailableCountryDto) {
    const country = await this.prisma.availableCountry.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException('Country not found');
    }

    // If updating name or code, check if they already exist
    if (updateCountryDto.name || updateCountryDto.code) {
      const existingCountry = await this.prisma.availableCountry.findFirst({
        where: {
          OR: [
            ...(updateCountryDto.name ? [{ name: updateCountryDto.name }] : []),
            ...(updateCountryDto.code ? [{ code: updateCountryDto.code }] : []),
          ],
          id: { not: id }, // Exclude current record
        },
      });

      if (existingCountry) {
        throw new BadRequestException(`Country with name ${updateCountryDto.name} or code ${updateCountryDto.code} already exists`);
      }
    }

    return this.prisma.availableCountry.update({
      where: { id },
      data: updateCountryDto,
    });
  }

  async deleteCountry(id: string) {
    const country = await this.prisma.availableCountry.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException('Country not found');
    }

    await this.prisma.availableCountry.delete({
      where: { id },
    });

    return { message: 'Country deleted successfully' };
  }

  // Trending Courses Management
  async getAllTrendingCourses(page: number = 1, limit: number = 10, isActive?: boolean) {
    const skip = (page - 1) * limit;
    
    const where = isActive !== undefined ? { isActive } : {};
    
    const [trendingCourses, total] = await Promise.all([
      this.prisma.trendingCourse.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              instructorName: true,
              level: true,
              category: true,
            },
          },
        },
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.trendingCourse.count({ where }),
    ]);

    return {
      trendingCourses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTrendingCourseById(id: string) {
    const trendingCourse = await this.prisma.trendingCourse.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            instructorName: true,
            level: true,
            category: true,
          },
        },
      },
    });

    if (!trendingCourse) {
      throw new NotFoundException('Trending course not found');
    }

    return trendingCourse;
  }

  async createTrendingCourse(createTrendingCourseDto: CreateTrendingCourseDto) {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: createTrendingCourseDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if course is already in trending list
    const existingTrending = await this.prisma.trendingCourse.findUnique({
      where: { courseId: createTrendingCourseDto.courseId },
    });

    if (existingTrending) {
      throw new BadRequestException('Course is already in trending list');
    }

    // Check if order is already taken
    if (createTrendingCourseDto.order !== undefined) {
      const existingOrder = await this.prisma.trendingCourse.findUnique({
        where: { order: createTrendingCourseDto.order },
      });

      if (existingOrder) {
        throw new BadRequestException(`Trending course with order ${createTrendingCourseDto.order} already exists`);
      }
    }

    return this.prisma.trendingCourse.create({
      data: createTrendingCourseDto,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            instructorName: true,
            level: true,
            category: true,
          },
        },
      },
    });
  }

  async updateTrendingCourse(id: string, updateTrendingCourseDto: UpdateTrendingCourseDto) {
    const trendingCourse = await this.prisma.trendingCourse.findUnique({
      where: { id },
    });

    if (!trendingCourse) {
      throw new NotFoundException('Trending course not found');
    }

    // If updating order, check if it's already taken by another trending course
    if (updateTrendingCourseDto.order && updateTrendingCourseDto.order !== trendingCourse.order) {
      const existingOrder = await this.prisma.trendingCourse.findUnique({
        where: { order: updateTrendingCourseDto.order },
      });

      if (existingOrder) {
        throw new BadRequestException(`Trending course with order ${updateTrendingCourseDto.order} already exists`);
      }
    }

    return this.prisma.trendingCourse.update({
      where: { id },
      data: updateTrendingCourseDto,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            instructorName: true,
            level: true,
            category: true,
          },
        },
      },
    });
  }

  async deleteTrendingCourse(id: string) {
    const trendingCourse = await this.prisma.trendingCourse.findUnique({
      where: { id },
    });

    if (!trendingCourse) {
      throw new NotFoundException('Trending course not found');
    }

    await this.prisma.trendingCourse.delete({
      where: { id },
    });

    return { message: 'Trending course deleted successfully' };
  }

  // ===== PUBLIC ENDPOINTS =====

  async getActiveFaqs(limit?: number) {
    const faqs = await this.prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: { index: 'asc' },
      ...(limit && { take: limit }),
    });

    return faqs;
  }

  async getActiveContactDetails(type?: string) {
    const where: any = { isActive: true };
    if (type) where.type = type;

    const contactDetails = await this.prisma.contactDetails.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return contactDetails;
  }

  async getActiveCountries() {
    const countries = await this.prisma.availableCountry.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return countries;
  }

  async getActiveTrendingCourses(limit?: number) {
    const trendingCourses = await this.prisma.trendingCourse.findMany({
      where: { isActive: true },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            instructorName: true,
            level: true,
            category: true,
          },
        },
      },
      orderBy: { order: 'asc' },
      ...(limit && { take: limit }),
    });

    return trendingCourses;
  }

  // ===== WISHLIST METHODS =====

  async addToWishlist(userId: string, addToWishlistDto: AddToWishlistDto) {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: addToWishlistDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if already in wishlist
    const existingWishlistItem = await this.prisma.wishlist.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: addToWishlistDto.courseId,
        },
      },
    });

    if (existingWishlistItem) {
      throw new BadRequestException('Course is already in your wishlist');
    }

    // Add to wishlist
    const wishlistItem = await this.prisma.wishlist.create({
      data: {
        userId,
        courseId: addToWishlistDto.courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            instructorName: true,
            level: true,
            category: true,
            demoVideoThumbnail: true,
            demoVideoDuration: true,
            courseDuration: true,
          },
        },
      },
    });

    return wishlistItem;
  }

  async removeFromWishlist(userId: string, removeFromWishlistDto: RemoveFromWishlistDto) {
    // Check if wishlist item exists
    const wishlistItem = await this.prisma.wishlist.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: removeFromWishlistDto.courseId,
        },
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Course is not in your wishlist');
    }

    // Remove from wishlist
    await this.prisma.wishlist.delete({
      where: {
        userId_courseId: {
          userId,
          courseId: removeFromWishlistDto.courseId,
        },
      },
    });

    return { message: 'Course removed from wishlist successfully' };
  }

  async getUserWishlist(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [wishlistItems, total] = await Promise.all([
      this.prisma.wishlist.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              instructorName: true,
              level: true,
              category: true,
              demoVideoThumbnail: true,
              demoVideoDuration: true,
              courseDuration: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.wishlist.count({ where: { userId } }),
    ]);

    return {
      items: wishlistItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async checkWishlistStatus(userId: string, courseId: string) {
    const wishlistItem = await this.prisma.wishlist.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    return {
      isInWishlist: !!wishlistItem,
      addedAt: wishlistItem?.createdAt || null,
    };
  }

  // ===== CART METHODS =====

  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                instructorName: true,
                level: true,
                category: true,
                demoVideoThumbnail: true,
                demoVideoDuration: true,
                courseDuration: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  instructorName: true,
                  level: true,
                  category: true,
                  demoVideoThumbnail: true,
                  demoVideoDuration: true,
                  courseDuration: true
                }
              }
            }
          }
        }
      });
    }

    return {
      ...cart,
      totalCourses: cart.items.length
    };
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { courseId } = addToCartDto;

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId }
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId }
      });
    }

    // Check if course is already in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_courseId: {
          cartId: cart.id,
          courseId
        }
      }
    });

    if (existingItem) {
      throw new BadRequestException('Course already in cart');
    }

    // Add course to cart
    await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        courseId
      }
    });

    return { message: 'Course added to cart successfully' };
  }

  async updateCartItem(userId: string, updateCartItemDto: UpdateCartItemDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartItem = cart.items.find(item => item.courseId === updateCartItemDto.courseId);

    if (!cartItem) {
      throw new NotFoundException('Course not found in cart');
    }

    // Since quantity was removed, this method now just returns the cart
    // The cart system is simplified to one course per cart item
    return this.getOrCreateCart(userId);
  }

  async removeFromCart(userId: string, removeFromCartDto: RemoveFromCartDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartItem = cart.items.find(item => item.courseId === removeFromCartDto.courseId);

    if (!cartItem) {
      throw new NotFoundException('Course not found in cart');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItem.id },
    });

    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId }
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Delete all cart items
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return { message: 'Cart cleared successfully' };
  }

  async getCartSummary(userId: string, country: string = 'US') {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            course: true
          }
        }
      }
    });

    if (!cart) {
      return {
        totalCourses: 0,
        estimatedTotal: 0,
        currency: 'USD'
      };
    }

    // For now, return a simplified summary since pricing is not implemented
    // TODO: Implement proper pricing logic when CoursePricing is set up
    return {
      totalCourses: cart.items.length,
      estimatedTotal: 0,
      currency: 'USD'
    };
  }

  async checkout(userId: string, checkoutDto: CheckoutDto) {
    const { courseIds, country, paymentMethodId } = checkoutDto;

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify all courses are in cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: {
            courseId: { in: courseIds }
          }
        }
      }
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.items.length !== courseIds.length) {
      throw new BadRequestException('Some courses are not in cart');
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const courseId of courseIds) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        throw new NotFoundException(`Course ${courseId} not found`);
      }

      // For now, use a default price since pricing system is not fully implemented
      // TODO: Implement proper pricing when CoursePricing is set up
      const price = 99.99; // Default price
      totalAmount += price;

      orderItems.push({
        courseId,
        courseTitle: course.title,
        price
      });
    }

    // TODO: Integrate with Stripe when package is installed
    // For now, create a mock payment intent ID
    const stripePaymentIntentId = `mock_pi_${Date.now()}`;

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId,
        status: 'PENDING',
        totalAmount,
        currency: 'USD',
        country,
        stripePaymentIntentId,
        orderItems: {
          create: orderItems.map(item => ({
            courseId: item.courseId,
            price: item.price
          }))
        },
        enrollments: {
          create: courseIds.map(courseId => ({
            userId,
            courseId,
            status: 'ACTIVE'
          }))
        }
      },
      include: {
        orderItems: true,
        enrollments: true
      }
    });

    // Remove purchased courses from cart
    await this.prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        courseId: { in: courseIds }
      }
    });

    return {
      message: 'Checkout completed successfully',
      orderId: order.id,
      totalAmount,
      currency: 'USD',
      stripePaymentIntentId
    };
  }

  // ===== ENROLLMENT METHODS =====

  async enrollCourse(userId: string, enrollCourseDto: EnrollCourseDto) {
    const { courseId, country, paymentMethodId } = enrollCourseDto;

    // Check if user is already enrolled
    const existingEnrollment = await this.prisma.userEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      throw new ConflictException('User already enrolled in this course');
    }

    // Get course
    const course = await this.prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // For now, use a default price since pricing system is not fully implemented
    // TODO: Implement proper pricing when CoursePricing is set up
    const price = 99.99; // Default price

    // TODO: Integrate with Stripe when package is installed
    // For now, create a mock payment intent ID
    const stripePaymentIntentId = `mock_pi_${Date.now()}`;

    // Create order for single course
    const order = await this.prisma.order.create({
      data: {
        userId,
        status: 'PENDING',
        totalAmount: price,
        currency: 'USD',
        country,
        stripePaymentIntentId,
        orderItems: {
          create: {
            courseId,
            price
          }
        },
        enrollments: {
          create: {
            userId,
            courseId,
            status: 'ACTIVE'
          }
        }
      },
      include: {
        orderItems: true,
        enrollments: true
      }
    });

    return {
      message: 'Enrollment completed successfully',
      orderId: order.id,
      courseId,
      price,
      currency: 'USD',
      stripePaymentIntentId
    };
  }

  /**
   * Get all enrollments with pagination and filtering (Admin/Instructor only)
   */
  async getAllEnrollments(filters: {
    page: number;
    limit: number;
    status?: string;
    courseId?: string;
    userId?: string;
  }) {
    const { page, limit, status, courseId, userId } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (courseId) where.courseId = courseId;
    if (userId) where.userId = userId;

    const [enrollments, total] = await Promise.all([
      this.prisma.userEnrollment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          course: {
            select: {
              id: true,
              title: true,
              description: true
            }
          }
        },
        orderBy: { enrolledAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.userEnrollment.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get enrollments for a specific user
   */
  async getUserEnrollments(userId: string, options: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };
    if (status) where.status = status;

    const [enrollments, total] = await Promise.all([
      this.prisma.userEnrollment.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              instructorName: true
            }
          }
        },
        orderBy: { enrolledAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.userEnrollment.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get enrollments for a specific course
   */
  async getCourseEnrollments(courseId: string, options: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { courseId };
    if (status) where.status = status;

    const [enrollments, total] = await Promise.all([
      this.prisma.userEnrollment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: { enrolledAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.userEnrollment.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Check if a user is enrolled in a specific course
   */
  async isUserEnrolledInCourse(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.prisma.userEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    return !!enrollment && enrollment.status === 'ACTIVE';
  }

  /**
   * Get a specific enrollment by ID
   */
  async getEnrollmentById(enrollmentId: string) {
    const enrollment = await this.prisma.userEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            instructorName: true
          }
        }
      }
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }

  // ===== ORDER METHODS =====

  async getUserOrders(userId: string, page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  instructorName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.order.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      total,
      page,
      limit,
      totalPages
    };
  }

  async getOrderDetails(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId
      },
      include: {
        orderItems: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                instructorName: true,
                level: true,
                category: true
              }
            }
          }
        },
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                instructorName: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // ===== PRICING METHODS =====

  async createPricing(createPricingDto: CreatePricingDto) {
    const data: any = { ...createPricingDto };
    
    // Set default values for enhanced fields
    if (!data.currency) data.currency = 'USD';
    if (!data.isActive) data.isActive = true;
    if (!data.validFrom) data.validFrom = new Date();
    if (!data.originalPrice) data.originalPrice = data.price;
    
    const pricing = await this.prisma.pricing.create({
      data
    });

    return pricing;
  }

  async getAllPricing(query: PricingQueryDto) {
    const where: any = {};

    if (query.country) where.country = query.country;
    if (query.region) where.region = query.region;
    if (query.currency) where.currency = query.currency;
    if (query.pricingTier) where.pricingTier = query.pricingTier;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = query.minPrice;
      if (query.maxPrice) where.price.lte = query.maxPrice;
    }

    return this.prisma.pricing.findMany({
      where
    });
  }

  async getPricingById(id: string) {
    const pricing = await this.prisma.pricing.findUnique({
      where: { id }
    });

    if (!pricing) {
      throw new NotFoundException('Pricing not found');
    }

    return pricing;
  }

  async updatePricing(id: string, updatePricingDto: UpdatePricingDto) {
    const existingPricing = await this.prisma.pricing.findUnique({
      where: { id }
    });

    if (!existingPricing) {
      throw new NotFoundException('Pricing not found');
    }

    const data: any = { ...updatePricingDto };
    
    // Update originalPrice if price is being changed
    if (data.price && data.price !== existingPricing.price) {
      data.originalPrice = existingPricing.price;
    }
    
    // Set updatedAt to current timestamp
    data.updatedAt = new Date();

    const pricing = await this.prisma.pricing.update({
      where: { id },
      data
    });

    return pricing;
  }

  async deletePricing(id: string) {
    const pricing = await this.prisma.pricing.findUnique({
      where: { id }
    });

    if (!pricing) {
      throw new NotFoundException('Pricing not found');
    }

    // Check if pricing is being used by any courses
    const coursePricing = await this.prisma.coursePricing.findFirst({
      where: { pricingId: id }
    });

    if (coursePricing) {
      throw new BadRequestException('Cannot delete pricing that is assigned to courses');
    }

    await this.prisma.pricing.delete({
      where: { id }
    });
  }

  async createCoursePricing(createCoursePricingDto: CreateCoursePricingDto) {
    const { courseId, pricingId } = createCoursePricingDto;

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if pricing exists
    const pricing = await this.prisma.pricing.findUnique({
      where: { id: pricingId }
    });

    if (!pricing) {
      throw new NotFoundException('Pricing not found');
    }

    // Check if course already has this pricing
    const existingCoursePricing = await this.prisma.coursePricing.findUnique({
      where: {
        courseId_pricingId: {
          courseId,
          pricingId
        }
      }
    });

    if (existingCoursePricing) {
      throw new BadRequestException('Course already has this pricing');
    }

    const coursePricing = await this.prisma.coursePricing.create({
      data: createCoursePricingDto,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            instructorName: true,
            level: true,
            category: true
          }
        },
        pricing: true
      }
    });

    return coursePricing;
  }

  async getCoursePricing(courseId: string, country?: string, region?: string) {
    const where: any = {
      courseId,
      isActive: true
    };

    if (country || region) {
      where.pricing = {};
      if (country) where.pricing.country = country;
      if (region) where.pricing.region = region;
    }

    return this.prisma.coursePricing.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            instructorName: true,
            level: true,
            category: true
          }
        },
        pricing: true
      }
    });
  }

  async updateCoursePricing(id: string, updateCoursePricingDto: UpdateCoursePricingDto) {
    const coursePricing = await this.prisma.coursePricing.findUnique({
      where: { id }
    });

    if (!coursePricing) {
      throw new NotFoundException('Pricing not found');
    }

    const updatedCoursePricing = await this.prisma.coursePricing.update({
      where: { id },
      data: updateCoursePricingDto,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            instructorName: true,
            level: true,
            category: true
          }
        },
        pricing: true
      }
    });

    return updatedCoursePricing;
  }

  async deleteCoursePricing(id: string) {
    const coursePricing = await this.prisma.coursePricing.findUnique({
      where: { id }
    });

    if (!coursePricing) {
      throw new NotFoundException('Course pricing not found');
    }

    await this.prisma.coursePricing.delete({
      where: { id }
    });
  }

  async bulkUpdatePricing(bulkPricingUpdateDto: BulkPricingUpdateDto, userId?: string) {
    const { courseIds, pricing, changeReason } = bulkPricingUpdateDto;

    // Create or update pricing record
    let pricingRecord = await this.prisma.pricing.findFirst({
      where: {
        country: pricing.country,
        region: pricing.region || null
      }
    });

    if (!pricingRecord) {
      pricingRecord = await this.createPricing(pricing);
    } else {
      pricingRecord = await this.updatePricing(pricingRecord.id, pricing);
    }

    const results = [];

    for (const courseId of courseIds) {
      try {
        // Check if course pricing exists
        const existingCoursePricing = await this.prisma.coursePricing.findFirst({
          where: {
            courseId,
            pricingId: pricingRecord.id
          }
        });

        if (existingCoursePricing) {
          // Update existing course pricing
          const updated = await this.updateCoursePricing(existingCoursePricing.id, {
            courseId,
            pricingId: pricingRecord.id
          });
          results.push(updated);
        } else {
          // Create new course pricing
          const created = await this.createCoursePricing({
            courseId,
            pricingId: pricingRecord.id
          });
          results.push(created);
        }

        // Record price change if applicable
        if (changeReason) {
          await this.recordPricingChange(
            pricingRecord,
            pricingRecord.price,
            changeReason,
            courseId,
            userId
          );
        }
      } catch (error) {
        console.error(`Failed to update pricing for course ${courseId}:`, error);
        // Continue with other courses
      }
    }

    return results;
  }

  async getPricingHistory(courseId: string, country?: string, region?: string, limit: number = 50) {
    // For now, return empty array since pricingHistory table doesn't exist yet
    // TODO: Implement when pricingHistory table is created
    return [];
  }

  async getPricingAnalytics(country?: string, region?: string, startDate?: string, endDate?: string) {
    const where: any = { isActive: true };

    if (country) where.country = country;
    if (region) where.region = region;

    const coursePricings = await this.prisma.coursePricing.findMany({
      where,
      include: {
        pricing: true
      }
    });

    if (coursePricings.length === 0) {
      return {
        totalCourses: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        currencyDistribution: {},
        regionalPricing: []
      };
    }

    const prices = coursePricings.map(cp => cp.pricing.price);
    const countries = coursePricings.map(cp => cp.pricing.country);

    const currencyDistribution = { USD: coursePricings.length }; // Default to USD for now

    const regionalPricing = countries.reduce((acc, country) => {
      const countryPricings = coursePricings.filter(cp => cp.pricing.country === country);
      const avgPrice = countryPricings.reduce((sum, cp) => sum + cp.pricing.price, 0) / countryPricings.length;
      
      acc.push({
        country,
        averagePrice: Math.round(avgPrice * 100) / 100,
        courseCount: countryPricings.length
      });
      return acc;
    }, []);

    return {
      totalCourses: coursePricings.length,
      averagePrice: Math.round((prices.reduce((sum, price) => sum + price, 0) / prices.length) * 100) / 100,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      currencyDistribution,
      regionalPricing
    };
  }

  async validatePricing(pricingData: CreatePricingDto) {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Validate price
    if (pricingData.price <= 0) {
      issues.push('Price must be greater than 0');
    }

    // Check for duplicate pricing in same country
    const existingPricing = await this.prisma.pricing.findFirst({
      where: {
        country: pricingData.country
      }
    });

    if (existingPricing) {
      warnings.push('Pricing already exists for this country');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  private async recordPricingChange(
    pricing: any,
    newPrice: number,
    changeReason: string,
    courseId?: string,
    userId?: string
  ) {
    // For now, just log the change since pricingHistory table doesn't exist yet
    // TODO: Implement when pricingHistory table is created
    console.log(`Pricing change recorded: Course ${courseId}, Old: ${pricing.price}, New: ${newPrice}, Reason: ${changeReason}`);
  }
}
