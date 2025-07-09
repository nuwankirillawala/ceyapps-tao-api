# Tao Backend API Documentation

## 📋 Overview

This is a comprehensive Learning Management System (LMS) API built with NestJS and Prisma. The API provides authentication, user management, course management, and lesson/material management capabilities.

## 🔗 Base URL
```
http://localhost:3000
```

## 📚 Swagger Documentation
Access the interactive API documentation at:
```
http://localhost:3000/api
```

## 🎥 Cloudflare Video Integration

The API includes comprehensive Cloudflare video streaming integration for course content management. See `CLOUDFLARE_SETUP.md` for detailed setup instructions.

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📖 API Endpoints

### 🔑 Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "STUDENT"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 👤 User Management

#### Get Current User Profile
```http
GET /user/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "userId": "a1c8add5-4cec-4d31-b9db-a1469cfc521d",
  "email": "user@example.com",
  "role": "ADMIN"
}
```

#### Update User Profile
```http
PATCH /user/profile
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

#### Logout User
```http
POST /user/logout
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Request Password Reset
```http
POST /user/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /user/reset-password
Content-Type: application/json

{
  "token": "reset_token_123456",
  "newPassword": "newpassword123"
}
```

### 👥 Admin User Management

#### Get All Users (Admin Only)
```http
GET /user
Authorization: Bearer YOUR_ADMIN_TOKEN
```

#### Get User by ID (Admin Only)
```http
GET /user/:userId
Authorization: Bearer YOUR_ADMIN_TOKEN
```

#### Assign Role to User (Admin Only)
```http
PATCH /user/:userId/assign-role
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "role": "INSTRUCTOR"
}
```

### 📚 Course Management

#### Create Course
```http
POST /courses
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Web Development Fundamentals",
  "description": "Learn the basics of web development including HTML, CSS, and JavaScript",
  "instructorName": "John Doe",
  "demoVideoId": "video-uuid-123"
}
```

**Alternative with instructor ID:**
```json
{
  "title": "Advanced JavaScript",
  "description": "Deep dive into JavaScript concepts",
  "instructorId": "a1c8add5-4cec-4d31-b9db-a1469cfc521d"
}
```

#### Get All Courses
```http
GET /courses
```

#### Get Course by ID
```http
GET /courses/:courseId
```

#### Update Course
```http
PUT /courses/:courseId
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Updated Course Title",
  "description": "Updated course description"
}
```

#### Delete Course (Admin Only)
```http
DELETE /courses/:courseId
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### 📖 Lesson Management

#### Course-Specific Lesson Endpoints

##### Get All Lessons for a Course
```http
GET /courses/:courseId/lessons
```

##### Add Lesson to Course
```http
POST /courses/:courseId/lessons
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Introduction to HTML",
  "content": "HTML is the standard markup language for creating web pages...",
  "videoId": "video-uuid-123"
}
```

#### Standalone Lesson Endpoints

##### Get Lesson by ID
```http
GET /lessons/:lessonId
```

##### Update Lesson
```http
PATCH /lessons/:lessonId
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Advanced HTML Concepts",
  "content": "Advanced HTML features including semantic elements..."
}
```

##### Delete Lesson
```http
DELETE /lessons/:lessonId
Authorization: Bearer YOUR_JWT_TOKEN
```

### 🎥 Video Management

#### Upload Video to Cloudflare Stream
```http
POST /cloudflare/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
- video: [video file]
- metadata: {"title": "Course Introduction", "description": "Welcome to the course"}
```

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

### 📁 Material Management

#### Add Material to Course
```http
POST /courses/:courseId/materials
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "HTML Cheat Sheet",
  "fileUrl": "https://example.com/html-cheatsheet.pdf"
}
```

#### Get All Materials for a Course
```http
GET /courses/:courseId/materials
```

#### Get Material by ID
```http
GET /courses/materials/:materialId
```

#### Update Material
```http
PUT /courses/materials/:materialId
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Updated Material Title",
  "fileUrl": "https://example.com/updated-material.pdf"
}
```

#### Delete Material
```http
DELETE /courses/materials/:materialId
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🔐 Role-Based Access Control

### Roles
- **ADMIN**: Full access to all endpoints
- **INSTRUCTOR**: Can create and manage courses, lessons, and materials
- **STUDENT**: Can view courses, lessons, and materials

### Protected Endpoints
- Course creation, update, deletion
- Lesson creation, update, deletion
- Material creation, update, deletion
- User management (admin only)

## 📝 Request/Response Examples

### Creating a Course with Custom Instructor Name
```bash
curl -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "React Fundamentals",
    "description": "Learn React from scratch",
    "instructorName": "Jane Smith"
  }'
```

### Adding a Lesson to a Course
```bash
curl -X POST http://localhost:3000/courses/COURSE_ID/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "React Components",
    "content": "Components are the building blocks of React applications..."
  }'
```

### Updating a Lesson
```bash
curl -X PATCH http://localhost:3000/lessons/LESSON_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Advanced React Components",
    "content": "Advanced component patterns and best practices..."
  }'
```

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Set up environment variables:**
   Create a `.env` file with:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/tao_db"
   JWT_SECRET="your-secret-key"
   PORT=3000
   ```

3. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

4. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

5. **Start the development server:**
   ```bash
   yarn start:dev
   ```

6. **Access Swagger documentation:**
   Open `http://localhost:3000/api` in your browser

## 🔧 Development

### Available Scripts
- `yarn start:dev` - Start development server with hot reload
- `yarn build` - Build the application
- `yarn start:prod` - Start production server
- `yarn test` - Run tests
- `yarn test:e2e` - Run end-to-end tests

### Database Management
- `npx prisma studio` - Open Prisma Studio for database management
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma generate` - Generate Prisma client

## 📊 Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (email already registered)
- `500` - Internal Server Error

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation with class-validator
- CORS protection
- Rate limiting (can be added)

## 📈 Performance

- Database connection pooling
- Efficient Prisma queries
- Response caching (can be added)
- Compression middleware (can be added)

---

For more information, visit the Swagger documentation at `http://localhost:3000/api` 