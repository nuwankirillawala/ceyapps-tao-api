import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
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
}
