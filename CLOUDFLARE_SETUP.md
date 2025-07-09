# Cloudflare Video Streaming Integration Setup

## 📋 Overview

This guide will help you set up Cloudflare video streaming and storage features for your course management system. The integration includes:

- Video upload to Cloudflare Stream
- Video streaming with signed URLs
- Course demo videos
- Lesson videos
- Thumbnail generation
- Video metadata management

## 🔧 Prerequisites

1. **Cloudflare Account**: You need a paid Cloudflare account with Stream enabled
2. **API Token**: Generate a Cloudflare API token with Stream permissions
3. **Account ID**: Your Cloudflare account ID

## 🚀 Setup Steps

### 1. Get Your Cloudflare Account ID

1. Log in to your Cloudflare dashboard
2. Go to the right sidebar and click on your account name
3. Copy your Account ID (it's a 32-character hexadecimal string)

### 2. Create API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Custom token" template
4. Configure the token with these permissions:
   - **Account** → **Cloudflare Stream** → **Edit**
   - **Zone** → **Zone** → **Read** (if needed for additional features)
5. Set the account resources to "Include" → "Specific account" → Select your account
6. Click "Continue to summary" and then "Create Token"
7. Copy the generated token (you won't be able to see it again)

### 3. Environment Variables

Add these variables to your `.env` file:

```env
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here

# Existing variables
DATABASE_URL="postgresql://username:password@localhost:5432/tao_db"
JWT_SECRET="your-secret-key"
PORT=3000
```

### 4. Install Dependencies

The required dependencies are already installed:
- `@nestjs/config` - For environment variable management
- `multer` - For file upload handling
- `@types/multer` - TypeScript types for multer

## 📚 API Endpoints

### Video Upload

#### Upload Video to Cloudflare Stream
```http
POST /cloudflare/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
- video: [video file]
- metadata: {"title": "Course Introduction", "description": "Welcome to the course"}
```

**Response:**
```json
{
  "uid": "video-uuid-123",
  "preview": "https://videodelivery.net/video-uuid-123/manifest/video.m3u8",
  "thumbnail": "https://videodelivery.net/video-uuid-123/thumbnails/thumbnail.jpg",
  "duration": 120,
  "status": {
    "state": "ready"
  }
}
```

### Video Management

#### Get Video Details
```http
GET /cloudflare/video/:videoId
```

#### Get Signed Streaming URL
```http
GET /cloudflare/video/:videoId/stream
```

#### Delete Video
```http
DELETE /cloudflare/video/:videoId
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📖 Course Video Integration

### Creating a Course with Demo Video

1. **Upload the demo video:**
   ```bash
   curl -X POST http://localhost:3000/cloudflare/upload \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "video=@demo-video.mp4" \
     -F "metadata={\"title\":\"Course Demo\",\"description\":\"Course introduction video\"}"
   ```

2. **Create course with demo video:**
   ```bash
   curl -X POST http://localhost:3000/courses \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "title": "Web Development Fundamentals",
       "description": "Learn web development from scratch",
       "instructorName": "John Doe",
       "demoVideoId": "video-uuid-from-step-1"
     }'
   ```

### Adding Videos to Lessons

1. **Upload lesson video:**
   ```bash
   curl -X POST http://localhost:3000/cloudflare/upload \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "video=@lesson-video.mp4" \
     -F "metadata={\"title\":\"HTML Basics\",\"description\":\"Introduction to HTML\"}"
   ```

2. **Add lesson with video:**
   ```bash
   curl -X POST http://localhost:3000/courses/COURSE_ID/lessons \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "title": "Introduction to HTML",
       "content": "HTML is the standard markup language...",
       "videoId": "video-uuid-from-step-1"
     }'
   ```

## 🎥 Video Streaming

### Getting Streaming URLs

#### For Course Demo Videos
```bash
curl -X GET http://localhost:3000/cloudflare/video/DEMO_VIDEO_ID/stream
```

#### For Lesson Videos
```bash
curl -X GET http://localhost:3000/cloudflare/video/LESSON_VIDEO_ID/stream
```

**Response:**
```json
{
  "signedUrl": "https://videodelivery.net/video-uuid-123/manifest/video.m3u8?token=...",
  "expiresIn": 3600
}
```

### Video Player Integration

Use the signed URL in your video player:

```html
<video controls>
  <source src="SIGNED_URL_FROM_API" type="application/x-mpegURL">
  Your browser does not support the video tag.
</video>
```

## 🔒 Security Features

- **Signed URLs**: Videos are streamed using signed URLs that expire
- **Role-based Access**: Only admins and instructors can upload/delete videos
- **Token Expiration**: Streaming URLs expire after a configurable time (default: 1 hour)

## 📊 Video Metadata

The system automatically stores:
- Video ID (Cloudflare Stream UID)
- Streaming URL
- Thumbnail URL
- Video duration
- Upload status

## 🚨 Error Handling

### Common Errors

1. **Invalid Video ID**: When trying to use a non-existent video ID
2. **Upload Failed**: When Cloudflare upload fails
3. **Authentication Error**: When API token is invalid
4. **Permission Error**: When user doesn't have required role

### Error Responses

```json
{
  "message": "Invalid demo video ID: invalid-video-id",
  "error": "Bad Request",
  "statusCode": 400
}
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Yes |
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token | Yes |

### Video Upload Limits

- **File Size**: Depends on your Cloudflare plan
- **Supported Formats**: MP4, MOV, AVI, WebM, and more
- **Processing Time**: Varies based on video size and length

## 📈 Performance Tips

1. **Video Optimization**: Compress videos before upload
2. **Thumbnail Generation**: Cloudflare automatically generates thumbnails
3. **CDN Distribution**: Videos are distributed globally via Cloudflare's CDN
4. **Adaptive Streaming**: Videos are automatically converted to HLS format

## 🧪 Testing

### Test Video Upload
```bash
# Create a test video file (if you don't have one)
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 test-video.mp4

# Upload the test video
curl -X POST http://localhost:3000/cloudflare/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "video=@test-video.mp4" \
  -F "metadata={\"title\":\"Test Video\",\"description\":\"Test upload\"}"
```

### Test Video Streaming
```bash
# Get streaming URL
curl -X GET http://localhost:3000/cloudflare/video/VIDEO_ID/stream

# Test the signed URL in a browser or video player
```

## 🔄 Migration

If you have existing courses without videos, you can add videos later:

```bash
# Update course with demo video
curl -X PUT http://localhost:3000/courses/COURSE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "demoVideoId": "new-video-id"
  }'

# Update lesson with video
curl -X PATCH http://localhost:3000/lessons/LESSON_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "videoId": "new-video-id"
  }'
```

## 📞 Support

For Cloudflare-specific issues:
- [Cloudflare Stream Documentation](https://developers.cloudflare.com/stream/)
- [Cloudflare API Documentation](https://api.cloudflare.com/)

For application-specific issues:
- Check the application logs
- Verify environment variables
- Test API endpoints with Swagger UI at `http://localhost:3000/api`

---

Your Cloudflare video streaming integration is now ready! 🎉 