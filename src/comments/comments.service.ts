import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(createCommentDto: CreateCommentDto & { userId: string }) {
    const { lessonId, userId, content } = createCommentDto;

    // Verify lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check if user is enrolled in the course
    const enrollment = await this.prisma.userEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course to comment');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        lessonId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return comment;
  }

  async createReply(createReplyDto: CreateReplyDto & { userId: string, email: string | undefined }) {
    const { commentId, userId, content, email } = createReplyDto;
    const user = await this.prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,    
        name: true,
        profileImage: true,
        role: true,
      },
    });


    // Verify comment exists and get lesson info
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        lesson: {
          include: { course: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user is enrolled in the course
    const enrollment = await this.prisma.userEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: comment.lesson.courseId,
        },
      },
    });

    if (!enrollment  && user.role === "STUDENT") {
      throw new ForbiddenException('You must be enrolled in this course to reply to this comment');
    }

    const reply = await this.prisma.reply.create({
      data: {
        content,
        commentId,
        userId: user.id,
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

    return reply;
  }

  async getCommentsByLesson(lessonId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const comments = await this.prisma.comment.findMany({
      where: {
        lessonId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        replies: {
          where: {
            isActive: true,
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.comment.count({
      where: {
        lessonId,
        isActive: true,
      },
    });

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCommentById(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        replies: {
          where: {
            isActive: true,
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async updateComment(id: string, updateCommentDto: UpdateCommentDto, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: {
        content: updateCommentDto.content,
        isActive: updateCommentDto.isActive === 'true' ? true : updateCommentDto.isActive === 'false' ? false : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        replies: {
          where: {
            isActive: true,
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return updatedComment;
  }

  async updateReply(id: string, updateReplyDto: UpdateReplyDto, userId: string) {
    const reply = await this.prisma.reply.findUnique({
      where: { id },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    if (reply.userId !== userId) {
      throw new ForbiddenException('You can only update your own replies');
    }

    const updatedReply = await this.prisma.reply.update({
      where: { id },
      data: {
        content: updateReplyDto.content,
        isActive: updateReplyDto.isActive === 'true' ? true : updateReplyDto.isActive === 'false' ? false : undefined,
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

    return updatedReply;
  }

  async deleteComment(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Soft delete by setting isActive to false
    await this.prisma.comment.update({
      where: { id },
      data: { isActive: false },
    });

    // Also soft delete all replies to this comment
    await this.prisma.reply.updateMany({
      where: { commentId: id },
      data: { isActive: false },
    });

    return { message: 'Comment deleted successfully' };
  }

  async deleteReply(id: string, userId: string) {
    const reply = await this.prisma.reply.findUnique({
      where: { id },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    if (reply.userId !== userId) {
      throw new ForbiddenException('You can only delete your own replies');
    }

    // Soft delete by setting isActive to false
    await this.prisma.reply.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Reply deleted successfully' };
  }

  async getCommentStats(lessonId: string) {
    const [commentCount, replyCount] = await Promise.all([
      this.prisma.comment.count({
        where: {
          lessonId,
          isActive: true,
        },
      }),
      this.prisma.reply.count({
        where: {
          comment: {
            lessonId,
            isActive: true,
          },
          isActive: true,
        },
      }),
    ]);

    return {
      commentCount,
      replyCount,
      totalCount: commentCount + replyCount,
    };
  }
}
