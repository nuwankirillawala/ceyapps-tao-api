import { Controller, Post, Get, Delete, Param, UseGuards, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CloudflareService, CloudflareImageUploadResponse, CloudflareFileUploadResponse } from './cloudflare.service';

@ApiTags('cloudflare')
@Controller('cloudflare')
export class CloudflareController {
  constructor(private readonly cloudflareService: CloudflareService) {}

  @Get('test')
  @ApiOperation({ summary: 'Test Cloudflare API connection' })
  @ApiResponse({
    status: 200,
    description: 'Connection test successful',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        account: { type: 'object' },
        images: { type: 'object' },
      },
    },
  })
  async testConnection() {
    return this.cloudflareService.testConnection();
  }

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

  @Post('upload/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload image to Cloudflare Images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload (JPEG, PNG, GIF, WebP, SVG)',
        },
        metadata: {
          type: 'string',
          description: 'Optional metadata for the image',
          example: '{"title": "Course Banner", "description": "Course banner image", "category": "banner"}',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'image-uuid-123' },
        url: { type: 'string', example: 'https://imagedelivery.net/account-id/image-id/public' },
        filename: { type: 'string', example: 'course-banner.jpg' },
        size: { type: 'number', example: 1024000 },
        uploaded: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        metadata: { type: 'object' },
      },
    },
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('metadata') metadata?: string,
  ): Promise<CloudflareImageUploadResponse> {
    const parsedMetadata = metadata ? JSON.parse(metadata) : undefined;
    return this.cloudflareService.uploadImage(file, parsedMetadata);
  }

  @Post('upload/file')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload course material file to Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Course material file to upload (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, ZIP, RAR)',
        },
        metadata: {
          type: 'string',
          description: 'Optional metadata for the file',
          example: '{"title": "Course Notes", "description": "Week 1 lecture notes", "category": "notes", "courseId": "course-123"}',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'file-uuid-123' },
        url: { type: 'string', example: 'https://your-bucket.r2.cloudflarestorage.com/course-notes.pdf' },
        filename: { type: 'string', example: 'week1-notes.pdf' },
        size: { type: 'number', example: 2048000 },
        uploaded: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        metadata: { type: 'object' },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('metadata') metadata?: string,
  ): Promise<CloudflareFileUploadResponse> {
    const parsedMetadata = metadata ? JSON.parse(metadata) : undefined;
    return this.cloudflareService.uploadFile(file, parsedMetadata);
  }

  @Get('file/:fileId')
  @ApiOperation({ summary: 'Get file details from Cloudflare R2' })
  @ApiResponse({
    status: 200,
    description: 'File details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'file-uuid-123' },
        url: { type: 'string', example: 'https://your-bucket.r2.cloudflarestorage.com/file.pdf' },
        filename: { type: 'string', example: 'course-notes.pdf' },
        size: { type: 'number', example: 2048000 },
        uploaded: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        metadata: { type: 'object' },
      },
    },
  })
  async getFileDetails(@Param('fileId') fileId: string) {
    return this.cloudflareService.getFileDetails(fileId);
  }

  @Get('image/:imageId')
  @ApiOperation({ summary: 'Get image details from Cloudflare Images' })
  @ApiResponse({
    status: 200,
    description: 'Image details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'image-uuid-123' },
        filename: { type: 'string', example: 'course-banner.jpg' },
        size: { type: 'number', example: 1024000 },
        uploaded: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        variants: { type: 'array', items: { type: 'string' } },
        metadata: { type: 'object' },
      },
    },
  })
  async getImageDetails(@Param('imageId') imageId: string) {
    return this.cloudflareService.getImageDetails(imageId);
  }

  @Get('file/:fileId/download')
  @ApiOperation({ summary: 'Get signed download URL for file' })
  @ApiResponse({
    status: 200,
    description: 'Signed download URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        signedUrl: { type: 'string', example: 'https://your-bucket.r2.cloudflarestorage.com/file.pdf?token=...' },
        expiresIn: { type: 'number', example: 3600 },
      },
    },
  })
  async getSignedDownloadUrl(
    @Param('fileId') fileId: string,
    @Body('expiresIn') expiresIn: number = 3600,
  ) {
    const signedUrl = await this.cloudflareService.generateFileSignedUrl(fileId, expiresIn);
    return { signedUrl, expiresIn };
  }

  @Delete('file/:fileId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete file from Cloudflare R2' })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'File deleted successfully' },
      },
    },
  })
  async deleteFile(@Param('fileId') fileId: string) {
    await this.cloudflareService.deleteFile(fileId);
    return { message: 'File deleted successfully' };
  }

  @Delete('image/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete image from Cloudflare Images' })
  @ApiResponse({
    status: 200,
    description: 'Image deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Image deleted successfully' },
      },
    },
  })
  async deleteImage(@Param('imageId') imageId: string) {
    await this.cloudflareService.deleteImage(imageId);
    return { message: 'Image deleted successfully' };
  }
} 