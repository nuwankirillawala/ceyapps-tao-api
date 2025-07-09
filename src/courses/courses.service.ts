import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudflareService } from '../cloudflare/cloudflare.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private cloudflareService: CloudflareService,
  ) {}

  async createCourse(data: {
    title: string;
    description?: string;
    instructorId?: string;
    instructorName?: string;
    demoVideoId?: string;
  }) {
    // Validate instructorId if provided
    if (data.instructorId) {
      const instructor = await this.prisma.user.findUnique({
        where: { id: data.instructorId },
      });

      if (!instructor) {
        throw new NotFoundException(`User with ID ${data.instructorId} not found`);
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

    return this.prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        instructorId: data.instructorId,
        instructorName: data.instructorName,
        demoVideoId: data.demoVideoId,
        demoVideoUrl,
        demoVideoThumbnail,
        demoVideoDuration,
      },
      include: {
        lessons: true,
        materials: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getCourses() {
    return this.prisma.course.findMany({
      include: {
        lessons: true,
        materials: true,
      },
    });
  }

  async getCourseById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        lessons: true,
        materials: true,
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

    return this.prisma.lesson.create({
      data: {
        ...data,
        courseId,
        videoUrl,
        videoThumbnail,
        videoDuration,
      },
    });
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

  async updateCourse(id: string, data: Prisma.CourseUpdateInput) {
    return this.prisma.course.update({
      where: { id },
      data,
      include: {
        lessons: true,
        materials: true,
      },
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
} 