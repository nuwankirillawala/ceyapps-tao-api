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
  private readonly r2Endpoint: string;
  private readonly r2AccessKeyId: string;
  private readonly r2SecretAccessKey: string;
  private readonly imagesUrl: string;

  constructor(private configService: ConfigService) {
    this.accountId = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');
    this.apiToken = this.configService.get<string>('CLOUDFLARE_API_TOKEN');
    this.r2BucketName = this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME');
    this.r2Endpoint = this.configService.get<string>('CLOUDFLARE_R2_ENDPOINT');
    this.r2AccessKeyId = this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
    this.r2SecretAccessKey = this.configService.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    
    // Debug logging to troubleshoot environment variables
    console.log('Cloudflare Service Configuration:');
    console.log('Account ID:', this.accountId);
    console.log('API Token:', this.apiToken ? '***SET***' : 'NOT SET');
    console.log('R2 Bucket Name:', this.r2BucketName);
    console.log('R2 Endpoint:', this.r2Endpoint);
    console.log('R2 Access Key ID:', this.r2AccessKeyId ? '***SET***' : 'NOT SET');
    console.log('R2 Secret Access Key:', this.r2SecretAccessKey ? '***SET***' : 'NOT SET');
    
    this.streamUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`;
    
    // Use corrected R2 URL format
    if (this.r2Endpoint) {
      this.r2Url = `${this.r2Endpoint}/${this.r2BucketName}`;
    } else {
      // Fallback to old format
      this.r2Url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/buckets/${this.r2BucketName}/objects`;
    }
    
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

      // Test 3: Check R2 service availability
      let r2Status = 'NOT_AVAILABLE';
      try {
        const r2Response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (r2Response.ok) {
          r2Status = 'AVAILABLE';
        } else if (r2Response.status === 404) {
          r2Status = 'SERVICE_NOT_ENABLED';
        } else if (r2Response.status === 403) {
          r2Status = 'PERMISSION_DENIED';
        }
      } catch (error) {
        r2Status = 'ERROR';
      }

      return {
        account: accountResult.result,
        images: imagesResult.result,
        r2: { status: r2Status },
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

    // Check if R2 is properly configured
    if (!this.r2Endpoint || !this.r2AccessKeyId || !this.r2SecretAccessKey) {
      throw new BadRequestException('R2 configuration is incomplete. Please check your environment variables.');
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

    try {
      // Try S3-compatible API first (recommended for R2)
      return await this.uploadFileS3Compatible(file, metadata);
    } catch (s3Error) {
      console.error('S3-compatible upload failed, trying R2 API...', s3Error.message);
      
      // Fallback to R2 API if S3-compatible fails
      try {
        return await this.uploadFileR2API(file, metadata);
      } catch (r2Error) {
        throw new BadRequestException(`All upload methods failed. S3: ${s3Error.message}, R2 API: ${r2Error.message}`);
      }
    }
  }

  /**
   * Upload file using R2 S3-compatible API with AWS4 signing
   */
  private async uploadFileS3Compatible(file: Express.Multer.File, metadata?: any): Promise<CloudflareFileUploadResponse> {
    const objectKey = `uploads/${Date.now()}-${file.originalname}`;
    const encodedObjectKey = encodeURIComponent(objectKey);
    const uploadUrl = `${this.r2Endpoint}/${this.r2BucketName}/${encodedObjectKey}`;
    
    console.log('Object Key:', objectKey);
    console.log('Encoded Object Key:', encodedObjectKey);
    console.log('Uploading via S3-compatible API with AWS4 signing:', uploadUrl);
    
    const fileBuffer = file.buffer;
    const now = new Date();
    // Fix: Use consistent date format for both amzDate and date
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = amzDate.substring(0, 8); // Extract YYYYMMDD from amzDate (no hyphens)
    
    // Calculate payload hash
    const payloadHash = this.calculateSHA256(fileBuffer);
    
    console.log('Payload Hash:', payloadHash);
    console.log('AMZ Date:', amzDate);
    console.log('Date:', date);
    
    // Create canonical request - URI must be properly encoded for AWS4 signing
    const canonicalURI = `/${this.r2BucketName}/${objectKey.split('/').map(part => encodeURIComponent(part)).join('/')}`;
    const canonicalRequest = this.createCanonicalRequest('PUT', canonicalURI, '', {
      'content-type': file.mimetype,
      'host': `${this.accountId}.r2.cloudflarestorage.com`,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate
    }, payloadHash);
    
    // Create string to sign
    const stringToSign = this.createStringToSign(amzDate, date, 'auto', 's3', this.calculateSHA256(Buffer.from(canonicalRequest)));
    
    // Generate signature
    const signature = this.generateSignature(stringToSign, this.r2SecretAccessKey, date);
    
    // Create authorization header
    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${this.r2AccessKeyId}/${date}/auto/s3/aws4_request,SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date,Signature=${signature}`;
    
    console.log('Authorization Header:', authorizationHeader);
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.mimetype,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Host': `${this.accountId}.r2.cloudflarestorage.com`,
        'Authorization': authorizationHeader
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`S3-compatible upload failed: ${error}`);
    }

    // Construct the file URL
    const fileUrl = `${this.r2Endpoint}/${this.r2BucketName}/${encodedObjectKey}`;
    
    return {
      id: objectKey,
      url: fileUrl,
      filename: file.originalname,
      size: file.size,
      uploaded: new Date().toISOString(),
      metadata: metadata || {},
    };
  }

  /**
   * Create canonical request for AWS4 signing
   */
  private createCanonicalRequest(method: string, uri: string, queryString: string, headers: Record<string, string>, payloadHash: string): string {
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(key => `${key.toLowerCase()}:${headers[key]}`)
      .join('\n') + '\n';
    
    const signedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase())
      .join(';');
    
    const canonicalRequest = [
      method,
      uri,
      queryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');
    
    console.log('Canonical Request:');
    console.log(canonicalRequest);
    console.log('');
    
    return canonicalRequest;
  }

  /**
   * Create string to sign for AWS4 signing
   */
  private createStringToSign(timestamp: string, date: string, region: string, service: string, canonicalRequestHash: string): string {
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      timestamp,
      `${date}/${region}/${service}/aws4_request`,
      canonicalRequestHash
    ].join('\n');
    
    console.log('String to Sign:');
    console.log(stringToSign);
    console.log('');
    
    return stringToSign;
  }

  /**
   * Generate AWS4 signature
   */
  private generateSignature(stringToSign: string, secretKey: string, date: string): string {
    const crypto = require('crypto');
    
    const dateKey = crypto.createHmac('sha256', `AWS4${secretKey}`).update(date).digest();
    const dateRegionKey = crypto.createHmac('sha256', dateKey).update('auto').digest();
    const dateRegionServiceKey = crypto.createHmac('sha256', dateRegionKey).update('s3').digest();
    const signingKey = crypto.createHmac('sha256', dateRegionServiceKey).update('aws4_request').digest();
    
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    
    console.log('Generated Signature:', signature);
    console.log('');
    
    return signature;
  }

  /**
   * Calculate SHA256 hash of file buffer
   */
  private calculateSHA256(buffer: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Upload file using R2 API (fallback method)
   */
  private async uploadFileR2API(file: Express.Multer.File, metadata?: any): Promise<CloudflareFileUploadResponse> {
    const objectKey = `uploads/${Date.now()}-${file.originalname}`;
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/buckets/${this.r2BucketName}/objects/${encodeURIComponent(objectKey)}`;
    
    console.log('Uploading via R2 API:', uploadUrl);
    
    const formData = new FormData();
    formData.append('file', new Blob([file.buffer]), file.originalname);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
      body: formData as any,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`R2 API upload failed: ${error}`);
    }

    const result = await response.json();
    
    // Construct the file URL using the R2 public URL format
    const fileUrl = `${this.r2Endpoint}/${this.r2BucketName}/${objectKey}`;
    
    return {
      id: result.result?.id || objectKey,
      url: fileUrl,
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
    if (!this.r2Endpoint) {
      throw new BadRequestException('R2 not configured');
    }

    try {
      // Try S3-compatible delete first
      const deleteUrl = `${this.r2Endpoint}/${this.r2BucketName}/${fileId}`;
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Host': `${this.accountId}.r2.cloudflarestorage.com`
        },
      });

      if (!response.ok) {
        throw new BadRequestException(`Failed to delete file: ${response.statusText}`);
      }
    } catch (error) {
      // Fallback to R2 API
      const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/buckets/${this.r2BucketName}/objects/${encodeURIComponent(fileId)}`;
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new BadRequestException(`Failed to delete file: ${response.statusText}`);
      }
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
    if (!this.r2Endpoint) {
      throw new BadRequestException('R2 not configured');
    }

    try {
      // Try S3-compatible HEAD request first
      const fileUrl = `${this.r2Endpoint}/${this.r2BucketName}/${fileId}`;
      const response = await fetch(fileUrl, {
        method: 'HEAD',
        headers: {
          'Host': `${this.accountId}.r2.cloudflarestorage.com`
        },
      });

      if (response.ok) {
        const publicFileUrl = `${this.r2Endpoint}/${this.r2BucketName}/${fileId}`;
        return {
          id: fileId,
          url: publicFileUrl,
          filename: fileId.split('/').pop() || fileId,
          size: parseInt(response.headers.get('content-length') || '0'),
          uploaded: response.headers.get('last-modified') || new Date().toISOString(),
          metadata: {},
        };
      }
    } catch (error) {
      console.log('S3-compatible HEAD failed, trying R2 API...');
    }

    // Fallback to R2 API
    const fileUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/buckets/${this.r2BucketName}/objects/${encodeURIComponent(fileId)}`;
    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException(`Failed to get file details: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Construct the file URL using the R2 public URL format
    const publicFileUrl = `${this.r2Endpoint}/${this.r2BucketName}/${fileId}`;
    
    return {
      id: result.result?.id || fileId,
      url: publicFileUrl,
      filename: fileId.split('/').pop() || fileId,
      size: result.result?.size || 0,
      uploaded: result.result?.uploaded || new Date().toISOString(),
      metadata: result.result?.metadata || {},
    };
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
    // For R2, we need to use the R2 API for signed URLs
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/buckets/${this.r2BucketName}/objects/${fileId}/signed-url`, {
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