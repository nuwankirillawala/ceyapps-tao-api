import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudflareService } from '../cloudflare/cloudflare.service';
import type { Prisma } from '@prisma/client';
import { Level, Category } from './enums/course.enums';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private cloudflareService: CloudflareService,
  ) {}

  async createCourse(data: CreateCourseDto) {
    // Validate instructorId if provided
    if (data.instructorId) {
      const instructor = await this.prisma.user.findUnique({
        where: { id: data.instructorId },
      });

      if (!instructor) {
        throw new NotFoundException(`User with ID ${data.instructorId} not found`);
      }

      // Ensure instructor has appropriate role
      if (instructor.role !== 'ADMIN' && instructor.role !== 'INSTRUCTOR') {
        throw new BadRequestException(`User with ID ${data.instructorId} does not have instructor privileges`);
      }
    }

    // Validate that either instructorId or instructorName is provided
    if (!data.instructorId && !data.instructorName) {
      throw new BadRequestException('Either instructorId or instructorName must be provided');
    }

    // If demoVideoId is provided, get video details from Cloudflare
    let demoVideoUrl: string | undefined;
    let demoVideoThumbnail: string | undefined;
    let demoVideoDuration: number | undefined;

    if (data.demoVideoId) {
      try {
        const videoDetails = await this.cloudflareService.getVideoDetails(data.demoVideoId);
        demoVideoUrl = videoDetails.preview;
        demoVideoThumbnail = videoDetails.thumbnail;
        demoVideoDuration = videoDetails.duration;
      } catch (error) {
        throw new BadRequestException(`Invalid demo video ID: ${data.demoVideoId}`);
      }
    }

    // Use transaction to create course and pricing together
    return this.prisma.$transaction(async (prisma) => {
      // Create the course
      const course = await prisma.course.create({
        data: {
          title: data.title,
          description: data.description,
          instructorId: data.instructorId,
          instructorName: data.instructorName,
          demoVideoId: data.demoVideoId,
          demoVideoUrl,
          demoVideoThumbnail,
          demoVideoDuration,
          courseDuration: data.courseDuration || null,
          level: data.level,
          category: data.category,
        },
      });

      // Create pricing if provided
      if (data.pricing && data.pricing.length > 0) {
        const pricingPromises = data.pricing.map(async (pricingData) => {
          // Create new pricing entry
          const pricing = await prisma.pricing.create({
            data: {
              price: pricingData.price,
              country: pricingData.country,
            },
          });

          // Create course pricing relationship
          return prisma.coursePricing.create({
            data: {
              courseId: course.id,
              pricingId: pricing.id,
            },
          });
        });

        await Promise.all(pricingPromises);
      }

      // Return course with all related data
      return prisma.course.findUnique({
        where: { id: course.id },
        include: {
          lessons: true,
          materials: true,
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          coursePricings: {
            include: {
              pricing: true,
            },
          },
        },
      });
    });
  }

  async getCourses() {
    return this.prisma.course.findMany({
      include: {
        lessons: true,
        materials: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        coursePricings: {
          include: {
            pricing: true,
          },
        },
      },
    });
  }

  async getCourseById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        lessons: true,
        materials: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        coursePricings: {
          include: {
            pricing: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async addLesson(courseId: string, data: Omit<Prisma.LessonUncheckedCreateInput, 'courseId'> & { videoId?: string }) {
    // If videoId is provided, get video details from Cloudflare
    let videoUrl: string | undefined;
    let videoThumbnail: string | undefined;
    let videoDuration: number | undefined;

    if (data.videoId) {
      try {
        const videoDetails = await this.cloudflareService.getVideoDetails(data.videoId);
        videoUrl = videoDetails.preview;
        videoThumbnail = videoDetails.thumbnail;
        videoDuration = videoDetails.duration;
      } catch (error) {
        throw new BadRequestException(`Invalid video ID: ${data.videoId}`);
      }
    }

    try {
      return this.prisma.lesson.create({
        data: {
          ...data,
          courseId,
          videoUrl,
          videoThumbnail,
          videoDuration,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create lesson: ${error.message}`);
    }
  }

  async addMaterial(courseId: string, data: Omit<Prisma.MaterialUncheckedCreateInput, 'courseId'>) {
    return this.prisma.material.create({
      data: {
        ...data,
        courseId
      },
    });
  }

  async updateLesson(lessonId: string, data: Prisma.LessonUpdateInput) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data,
    });
  }

  async updateMaterial(materialId: string, data: Prisma.MaterialUpdateInput) {
    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${materialId} not found`);
    }

    return this.prisma.material.update({
      where: { id: materialId },
      data,
    });
  }

  async deleteLesson(lessonId: string): Promise<void> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    await this.prisma.lesson.delete({
      where: { id: lessonId },
    });
  }

  async deleteMaterial(materialId: string): Promise<void> {
    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${materialId} not found`);
    }

    await this.prisma.material.delete({
      where: { id: materialId },
    });
  }

  async updateCourse(id: string, data: Prisma.CourseUpdateInput & { pricing?: { price: number; country: string }[] }) {
    const { pricing, ...courseData } = data;

    return this.prisma.$transaction(async (prisma) => {
      // Update course data
      const course = await prisma.course.update({
        where: { id },
        data: courseData,
      });

      // Handle pricing update if provided
      if (pricing) {
        // Remove existing pricing relationships
        await prisma.coursePricing.deleteMany({
          where: { courseId: id },
        });

        // Add new pricing if provided
        if (pricing.length > 0) {
          const pricingPromises = pricing.map(async (pricingData) => {
            // Create new pricing entry
            const newPricing = await prisma.pricing.create({
              data: {
                price: pricingData.price,
                country: pricingData.country,
              },
            });

            // Create course pricing relationship
            return prisma.coursePricing.create({
              data: {
                courseId: id,
                pricingId: newPricing.id,
              },
            });
          });

          await Promise.all(pricingPromises);
        }
      }

      // Return updated course with all related data
      return prisma.course.findUnique({
        where: { id },
        include: {
          lessons: true,
          materials: true,
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          coursePricings: {
            include: {
              pricing: true,
            },
          },
        },
      });
    });
  }

  async deleteCourse(id: string): Promise<void> {
    await this.prisma.course.delete({
      where: { id },
    });
  }

  // New methods for lesson and material retrieval

  async getLessonsByCourseId(courseId: string) {
    // First check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getMaterialsByCourseId(courseId: string) {
    // First check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return this.prisma.material.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getLessonById(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return lesson;
  }

  async getMaterialById(materialId: string) {
    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${materialId} not found`);
    }

    return material;
  }

  // Course pricing management methods
  async addCoursePricing(courseId: string, pricingData: { price: number; country: string }) {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return this.prisma.$transaction(async (prisma) => {
      // Create pricing
      const pricing = await prisma.pricing.create({
        data: {
          price: pricingData.price,
          country: pricingData.country,
        },
      });

      // Create course pricing relationship
      return prisma.coursePricing.create({
        data: {
          courseId,
          pricingId: pricing.id,
        },
        include: {
          pricing: true,
        },
      });
    });
  }

  async removeCoursePricing(courseId: string, pricingId: string) {
    const coursePricing = await this.prisma.coursePricing.findFirst({
      where: {
        courseId,
        pricingId,
      },
    });

    if (!coursePricing) {
      throw new NotFoundException(`Course pricing relationship not found`);
    }

    await this.prisma.$transaction(async (prisma) => {
      // Delete the course pricing relationship
      await prisma.coursePricing.delete({
        where: { id: coursePricing.id },
      });

      // Check if pricing is used by other courses
      const otherCoursePricings = await prisma.coursePricing.findMany({
        where: { pricingId },
      });

      // If no other courses use this pricing, delete it
      if (otherCoursePricings.length === 0) {
        await prisma.pricing.delete({
          where: { id: pricingId },
        });
      }
    });
  }

  async getCoursePricing(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return this.prisma.coursePricing.findMany({
      where: { courseId },
      include: {
        pricing: true,
      },
    });
  }
} 