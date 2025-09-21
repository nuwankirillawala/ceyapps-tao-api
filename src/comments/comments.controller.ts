import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdateReplyDto } from './dto/update-reply.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  async createComment(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.commentsService.createComment({
      ...createCommentDto,
      userId: req.user.userId,
    });
  }

  @Post('replies')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  async createReply(@Body() createReplyDto: CreateReplyDto, @Request() req) {
    return this.commentsService.createReply({
      ...createReplyDto,
      userId: req.user.userId,
      email: req.user.email,
    });
  }

  @Get('lesson/:lessonId')
  @ApiBearerAuth()
  async getCommentsByLesson(
    @Param('lessonId') lessonId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    
    return this.commentsService.getCommentsByLesson(lessonId, pageNum, limitNum);
  }

  @Get('lesson/:lessonId/stats')
  @ApiBearerAuth()
  async getCommentStats(@Param('lessonId') lessonId: string) {
    return this.commentsService.getCommentStats(lessonId);
  }

  @Get(':id')
  @ApiBearerAuth()
  async getCommentById(@Param('id') id: string) {
    return this.commentsService.getCommentById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  async updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req,
  ) {
    return this.commentsService.updateComment(id, updateCommentDto, req.user.userId);
  }

  @Patch('replies/:id')
  @ApiBearerAuth()
  async updateReply(
    @Param('id') id: string,
    @Body() updateReplyDto: UpdateReplyDto,
    @Request() req,
  ) {
    return this.commentsService.updateReply(id, updateReplyDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  async deleteComment(@Param('id') id: string, @Request() req) {
    return this.commentsService.deleteComment(id, req.user.userId);
  }

  @Delete('replies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  async deleteReply(@Param('id') id: string, @Request() req) {
    return this.commentsService.deleteReply(id, req.user.userId);
  }
}
