import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CloudflareVideoUploadResponse {
  uid: string;
  preview: string;
  thumbnail: string;
  duration: number;
  status: {
    state: string;
    errorReasonCode: string;
    errorReasonMessage: string;
  };
}

export interface CloudflareStreamResponse {
  uid: string;
  preview: string;
  thumbnail: string;
  duration: number;
  status: {
    state: string;
  };
}

export interface CloudflareImageUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploaded: string;
  metadata?: any;
}

export interface CloudflareFileUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploaded: string;
  metadata?: any;
}

@Injectable()
export class CloudflareService {
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly streamUrl: string;
  private readonly r2Url: string;
  private readonly r2BucketName: string;
  private readonly imagesUrl: string;

  constructor(private configService: ConfigService) {
    this.accountId = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');
    this.apiToken = this.configService.get<string>('CLOUDFLARE_API_TOKEN');
    this.r2BucketName = this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME');
    this.streamUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`;
    this.r2Url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/buckets/${this.r2BucketName}/objects`;
    this.imagesUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v2/direct_upload`;
  }

  /**
   * Test Cloudflare API connection and permissions
   */
  async testConnection(): Promise<any> {
    try {
      // Test 1: Check account access
      const accountResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!accountResponse.ok) {
        const errorText = await accountResponse.text();
        console.error('Account access error:', errorText);
        throw new Error(`Account access failed: ${errorText}`);
      }

      const accountResult = await accountResponse.json();

      // Test 2: Check Images API access
      const imagesResponse = await fetch(`${this.imagesUrl}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!imagesResponse.ok) {
        const errorText = await imagesResponse.text();
        console.error('Images API access error:', errorText);
        throw new Error(`Images API access failed: ${errorText}`);
      }

      const imagesResult = await imagesResponse.json();

      return {
        account: accountResult.result,
        images: imagesResult.result,
        status: 'success',
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
  }

  /**
   * Upload video to Cloudflare Stream
   */
  async uploadVideo(file: Express.Multer.File, metadata?: any): Promise<CloudflareVideoUploadResponse> {
    if (!file) {
      throw new BadRequestException('No video file provided');
    }

    const formData = new FormData();
    formData.append('file', new Blob([file.buffer]), file.originalname);

    if (metadata) {
      formData.append('meta', JSON.stringify(metadata));
    }

    const response = await fetch(this.streamUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Cloudflare upload failed: ${error}`);
    }

    const result = await response.json();
    return result.result;
  }

  /**
   * Get video details from Cloudflare Stream
   */
  async getVideoDetails(videoId: string): Promise<CloudflareStreamResponse> {
    const response = await fetch(`${this.streamUrl}/${videoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException(`Failed to get video details: ${response.statusText}`);
    }

    const result = await response.json();
    return result.result;
  }

  /**
   * Delete video from Cloudflare Stream
   */
  async deleteVideo(videoId: string): Promise<void> {
    const response = await fetch(`${this.streamUrl}/${videoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException(`Failed to delete video: ${response.statusText}`);
    }
  }

  /**
   * Generate signed URL for video streaming
   */
  async generateSignedUrl(videoId: string, expiresIn: number = 3600): Promise<string> {
    const response = await fetch(`${this.streamUrl}/${videoId}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + expiresIn,
        downloadable: false,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(`Failed to generate signed URL: ${response.statusText}`);
    }

    const result = await response.json();
    return result.result.token;
  }

  /**
   * Get video thumbnail URL
   */
  getThumbnailUrl(videoId: string): string {
    return `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg`;
  }

  /**
   * Get video preview URL
   */
  getPreviewUrl(videoId: string): string {
    return `https://videodelivery.net/${videoId}/manifest/video.m3u8`;
  }

  /**
   * Get video download URL (if downloadable)
   */
  getDownloadUrl(videoId: string): string {
    return `https://videodelivery.net/${videoId}/downloads/default.mp4`;
  }

  /**
   * Upload image to Cloudflare Images
   */
  async uploadImage(file: Express.Multer.File, metadata?: any): Promise<CloudflareImageUploadResponse> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    if (!this.accountId || !this.apiToken) {
      throw new BadRequestException('Cloudflare configuration is missing');
    }

    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid image file type. Allowed types: JPEG, PNG, GIF, WebP, SVG');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('Image file size too large. Maximum size: 10MB');
    }

    try {
      // Step 1: Get direct upload URL
    const formData = new FormData();

    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    formData.append('requireSignedURLs', 'false');

    const directUploadResponse = await fetch(`${this.imagesUrl}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
      body: formData,
    });

      if (!directUploadResponse.ok) {
        const errorText = await directUploadResponse.text();
        console.error('Direct upload error:', errorText);
        throw new BadRequestException(`Failed to get direct upload URL: ${errorText}`);
      }

      const directUploadResult = await directUploadResponse.json();
      const { uploadURL, id } = directUploadResult.result;

      if (!uploadURL || !id) {
        throw new BadRequestException('Invalid response from Cloudflare: missing uploadURL or id');
      }

      // Step 2: Upload the image to the direct upload URL
      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([file.buffer]), file.originalname);

      const uploadResponse = await fetch(uploadURL, {
        method: 'POST',
        body: uploadFormData as any,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Image upload failed:', errorText);
        throw new BadRequestException(`Image upload failed: ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();

      // Build final image URL
      let imageUrl = '';
      if (uploadResult.result?.variants?.length > 0) {
        imageUrl = uploadResult.result.variants[0];
      } else {
        imageUrl = `https://imagedelivery.net/${this.accountId}/${id}/public`;
      }

      return {
        id,
        url: imageUrl,
        filename: file.originalname,
        size: file.size,
        uploaded: new Date().toISOString(),
        metadata: metadata || {},
      };
    } catch (error) {
      console.error('Image upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload file (PDF, documents, etc.) to Cloudflare R2
   */
  async uploadFile(file: Express.Multer.File, metadata?: any): Promise<CloudflareFileUploadResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedFileTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-zip-compressed',
      'application/rar',
      'application/x-rar-compressed',
    ];

    if (!allowedFileTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, ZIP, RAR');
    }

    // Validate file size (max 50MB for files)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size: 50MB');
    }

    const formData = new FormData();
    formData.append('file', new Blob([file.buffer]), file.originalname);

    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(this.r2Url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
      body: formData as any,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Cloudflare R2 upload failed: ${error}`);
    }

    const result = await response.json();
    return {
      id: result.result.id,
      url: result.result.url,
      filename: file.originalname,
      size: file.size,
      uploaded: new Date().toISOString(),
      metadata: metadata || {},
    };
  }

  /**
   * Delete file from Cloudflare R2
   */
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.r2Url}/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException(`Failed to delete file: ${response.statusText}`);
    }
  }

  /**
   * Delete image from Cloudflare Images
   */
  async deleteImage(imageId: string): Promise<void> {
    const response = await fetch(`${this.imagesUrl}/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException(`Failed to delete image: ${response.statusText}`);
    }
  }

  /**
   * Get file details from Cloudflare R2
   */
  async getFileDetails(fileId: string): Promise<any> {
    const response = await fetch(`${this.r2Url}/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException(`Failed to get file details: ${response.statusText}`);
    }

    const result = await response.json();
    return result.result;
  }

  /**
   * Get image details from Cloudflare Images
   */
  async getImageDetails(imageId: string): Promise<any> {
    const response = await fetch(`${this.imagesUrl}/${imageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException(`Failed to get image details: ${response.statusText}`);
    }

    const result = await response.json();
    return result.result;
  }

  /**
   * Generate signed URL for file download
   */
  async generateFileSignedUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    const response = await fetch(`${this.r2Url}/${fileId}/signed-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expiresIn: expiresIn,
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(`Failed to generate signed URL: ${response.statusText}`);
    }

    const result = await response.json();
    return result.result.signedUrl;
  }
} 