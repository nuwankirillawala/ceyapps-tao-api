import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudflareService } from '../cloudflare/cloudflare.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AddPaymentMethodDto, UpdatePaymentMethodDto, SetDefaultPaymentMethodDto } from './dto/payment-method.dto';
import { ContactSupportDto, FaqQueryDto, HelpCategory } from './dto/help.dto';
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
}
