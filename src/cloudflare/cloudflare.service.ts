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

@Injectable()
export class CloudflareService {
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly streamUrl: string;

  constructor(private configService: ConfigService) {
    this.accountId = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');
    this.apiToken = this.configService.get<string>('CLOUDFLARE_API_TOKEN');
    this.streamUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`;
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
} 