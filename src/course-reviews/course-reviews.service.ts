import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class CourseReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(createReviewDto: CreateReviewDto, userId: string) {
    const { courseId, rating, title, content } = createReviewDto;

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if user has already reviewed this course
    const existingReview = await this.prisma.courseReview.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this course');
    }

    // Create the review
    const review = await this.prisma.courseReview.create({
      data: {
        courseId,
        userId,
        rating,
        title,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return review;
  }

  async getCourseReviews(courseId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      this.prisma.courseReview.findMany({
        where: { courseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.courseReview.count({
        where: { courseId },
      }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCourseReviewStats(courseId: string) {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get review statistics
    const stats = await this.prisma.courseReview.aggregate({
      where: { courseId },
      _count: { id: true },
      _avg: { rating: true },
    });

    // Get rating distribution
    const ratingDistribution = await this.prisma.courseReview.groupBy({
      by: ['rating'],
      where: { courseId },
      _count: { rating: true },
    });

    // Format rating distribution
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingDistribution.forEach((item) => {
      distribution[item.rating as keyof typeof distribution] = item._count.rating;
    });

    return {
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count.id,
      ratingDistribution: distribution,
    };
  }

  async updateReview(reviewId: string, updateReviewDto: UpdateReviewDto, userId: string) {
    // Check if review exists and belongs to user
    const review = await this.prisma.courseReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Update the review
    const updatedReview = await this.prisma.courseReview.update({
      where: { id: reviewId },
      data: updateReviewDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return updatedReview;
  }

  async deleteReview(reviewId: string, userId: string) {
    // Check if review exists and belongs to user
    const review = await this.prisma.courseReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    // Delete the review
    await this.prisma.courseReview.delete({
      where: { id: reviewId },
    });

    return { message: 'Review deleted successfully' };
  }

  async getUserReview(courseId: string, userId: string) {
    const review = await this.prisma.courseReview.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return review;
  }

  async getAllReviews(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.courseReview.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.courseReview.count(),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllReviewsStats() {
    // Get overall statistics
    const stats = await this.prisma.courseReview.aggregate({
      _count: { id: true },
      _avg: { rating: true },
    });

    // Get recent reviews
    const recentReviews = await this.prisma.courseReview.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Get top rated courses
    const topRatedCourses = await this.prisma.courseReview.groupBy({
      by: ['courseId'],
      _avg: { rating: true },
      _count: { rating: true },
      orderBy: { _avg: { rating: 'desc' } },
      take: 5,
    });

    // Get course details for top rated courses
    const courseIds = topRatedCourses.map(item => item.courseId);
    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true },
    });

    const topRatedCoursesWithDetails = topRatedCourses.map(item => {
      const course = courses.find(c => c.id === item.courseId);
      return {
        courseId: item.courseId,
        courseTitle: course?.title || 'Unknown Course',
        averageRating: item._avg.rating || 0,
        totalReviews: item._count.rating,
      };
    });

    return {
      totalReviews: stats._count.id,
      averageRating: stats._avg.rating || 0,
      totalCourses: await this.prisma.course.count(),
      recentReviews,
      topRatedCourses: topRatedCoursesWithDetails,
    };
  }
}
