import { Controller, Post, Get, Delete, Param, UseGuards, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CloudflareService } from './cloudflare.service';

@ApiTags('cloudflare')
@Controller('cloudflare')
export class CloudflareController {
  constructor(private readonly cloudflareService: CloudflareService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @UseInterceptors(FileInterceptor('video'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload video to Cloudflare Stream' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description: 'Video file to upload',
        },
        metadata: {
          type: 'string',
          description: 'Optional metadata for the video',
          example: '{"title": "Course Introduction", "description": "Welcome to the course"}',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Video uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        uid: { type: 'string', example: 'video-uuid-123' },
        preview: { type: 'string', example: 'https://videodelivery.net/video-uuid-123/manifest/video.m3u8' },
        thumbnail: { type: 'string', example: 'https://videodelivery.net/video-uuid-123/thumbnails/thumbnail.jpg' },
        duration: { type: 'number', example: 120 },
        status: {
          type: 'object',
          properties: {
            state: { type: 'string', example: 'ready' },
          },
        },
      },
    },
  })
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('metadata') metadata?: string,
  ) {
    const parsedMetadata = metadata ? JSON.parse(metadata) : undefined;
    return this.cloudflareService.uploadVideo(file, parsedMetadata);
  }

  @Get('video/:videoId')
  @ApiOperation({ summary: 'Get video details' })
  @ApiResponse({
    status: 200,
    description: 'Video details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        uid: { type: 'string', example: 'video-uuid-123' },
        preview: { type: 'string', example: 'https://videodelivery.net/video-uuid-123/manifest/video.m3u8' },
        thumbnail: { type: 'string', example: 'https://videodelivery.net/video-uuid-123/thumbnails/thumbnail.jpg' },
        duration: { type: 'number', example: 120 },
        status: {
          type: 'object',
          properties: {
            state: { type: 'string', example: 'ready' },
          },
        },
      },
    },
  })
  async getVideoDetails(@Param('videoId') videoId: string) {
    return this.cloudflareService.getVideoDetails(videoId);
  }

  @Get('video/:videoId/stream')
  @ApiOperation({ summary: 'Get signed streaming URL for video' })
  @ApiResponse({
    status: 200,
    description: 'Signed streaming URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        signedUrl: { type: 'string', example: 'https://videodelivery.net/video-uuid-123/manifest/video.m3u8?token=...' },
        expiresIn: { type: 'number', example: 3600 },
      },
    },
  })
  async getSignedStreamUrl(
    @Param('videoId') videoId: string,
    @Body('expiresIn') expiresIn: number = 3600,
  ) {
    const signedUrl = await this.cloudflareService.generateSignedUrl(videoId, expiresIn);
    return { signedUrl, expiresIn };
  }

  @Delete('video/:videoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete video from Cloudflare Stream' })
  @ApiResponse({
    status: 200,
    description: 'Video deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Video deleted successfully' },
      },
    },
  })
  async deleteVideo(@Param('videoId') videoId: string) {
    await this.cloudflareService.deleteVideo(videoId);
    return { message: 'Video deleted successfully' };
  }
} 