import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Course, CourseStatus, Role } from '.prisma/client';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  // Create a new course
  async createCourse(
    instructorId: string,
    data: {
      title: string;
      description?: string;
      code: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Course> {
    // Verify instructor exists and has correct role
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    if (instructor.role !== Role.INSTRUCTOR && instructor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only instructors can create courses');
    }

    return this.prisma.course.create({
      data: {
        ...data,
        instructorId,
      },
    });
  }

  // Get all courses
  async getAllCourses(status?: CourseStatus): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: status ? { status } : undefined,
      include: {
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

  // Get course by ID
  async getCourseById(courseId: string): Promise<Course> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        students: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  // Update course
  async updateCourse(
    courseId: string,
    instructorId: string,
    data: {
      title?: string;
      description?: string;
      code?: string;
      status?: CourseStatus;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Course> {
    const course = await this.getCourseById(courseId);

    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('Only the course instructor can update the course');
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data,
    });
  }

  // Enroll student in course
  async enrollStudent(courseId: string, studentId: string): Promise<Course> {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can enroll in courses');
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        students: {
          connect: { id: studentId },
        },
      },
    });
  }

  // Unenroll student from course
  async unenrollStudent(courseId: string, studentId: string): Promise<Course> {
    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        students: {
          disconnect: { id: studentId },
        },
      },
    });
  }
} 