# Course Routes - Resolved Structure

## Overview
This document outlines the resolved route structure for the Tao backend course management system after eliminating duplicate routes and implementing clear separation of concerns.

## Route Structure

### 1. Course Management (`/courses`)
**Controller**: `CoursesController`

| Method | Endpoint | Description | Access | Auth Required |
|--------|----------|-------------|---------|---------------|
| POST | `/courses` | Create a new course | ADMIN, INSTRUCTOR | ✅ |
| GET | `/courses` | Get all courses | Public | ❌ |
| GET | `/courses/:id` | Get course by ID | Public | ❌ |
| PUT | `/courses/:id` | Update course | ADMIN, INSTRUCTOR | ✅ |
| DELETE | `/courses/:id` | Delete course | ADMIN only | ✅ |

### 2. Course Content Management (`/courses/:id/*`)
**Controller**: `CoursesController`

| Method | Endpoint | Description | Access | Auth Required |
|--------|----------|-------------|---------|---------------|
| GET | `/courses/:id/lessons` | Get lessons by course ID | Public | ❌ |
| GET | `/courses/:id/materials` | Get materials by course ID | Public | ❌ |
| POST | `/courses/:id/lessons` | Add lesson to course | ADMIN, INSTRUCTOR | ✅ |
| POST | `/courses/:id/materials` | Add material to course | ADMIN, INSTRUCTOR | ✅ |

### 3. Course Pricing Management (`/courses/:id/pricing`)
**Controller**: `CoursesController`

| Method | Endpoint | Description | Access | Auth Required |
|--------|----------|-------------|---------|---------------|
| GET | `/courses/:id/pricing` | Get course pricing | Public | ❌ |
| POST | `/courses/:id/pricing` | Add pricing to course | ADMIN, INSTRUCTOR | ✅ |
| DELETE | `/courses/:courseId/pricing/:pricingId` | Remove pricing from course | ADMIN, INSTRUCTOR | ✅ |

### 4. Lesson Management (`/lessons`)
**Controller**: `LessonsController`

| Method | Endpoint | Description | Access | Auth Required |
|--------|----------|-------------|---------|---------------|
| GET | `/lessons/:id` | Get lesson by ID | Public | ❌ |
| PATCH | `/lessons/:id` | Update lesson | ADMIN, INSTRUCTOR | ✅ |
| DELETE | `/lessons/:id` | Delete lesson | ADMIN, INSTRUCTOR | ✅ |

### 5. Lesson-Material Management (`/lessons/:id/materials`)
**Controller**: `LessonsController`

| Method | Endpoint | Description | Access | Auth Required |
|--------|----------|-------------|---------|---------------|
| POST | `/lessons/:id/materials` | Add material to lesson | ADMIN, INSTRUCTOR | ✅ |

### 6. Material Management (`/materials`)
**Controller**: `MaterialsController`

| Method | Endpoint | Description | Access | Auth Required |
|--------|----------|-------------|---------|---------------|
| GET | `/materials/lesson/:lessonId` | Get materials by lesson ID | Public | ❌ |
| GET | `/materials/:id` | Get material by ID | Public | ❌ |
| PUT | `/materials/:id` | Update material | ADMIN, INSTRUCTOR | ✅ |
| DELETE | `/materials/:id` | Delete material | ADMIN, INSTRUCTOR | ✅ |

## Key Changes Made

### ✅ Eliminated Duplicates
1. **Lesson Operations**: Removed duplicate lesson management from `CoursesController`
2. **Material Operations**: Removed duplicate material management from `CoursesController`
3. **Route Consistency**: Standardized parameter naming (`:id` instead of `:lessonId`, `:materialId`)

### ✅ Clear Separation of Concerns
1. **CoursesController**: Handles course-level operations and course content management
2. **LessonsController**: Handles lesson-specific operations and lesson-material relationships
3. **MaterialsController**: Handles material-specific operations and material queries

### ✅ Enhanced Material-Lesson Relationship
1. **Materials can be course-level or lesson-level**: Materials can be associated with either a course or a specific lesson
2. **Add materials to lessons**: New endpoint to add materials directly to lessons
3. **Query materials by lesson**: Get all materials associated with a specific lesson

### ✅ Improved Documentation
1. **Swagger Annotations**: Added comprehensive API documentation for all endpoints
2. **Response Schemas**: Detailed response examples for better API understanding
3. **Parameter Validation**: Clear parameter descriptions and examples

## Benefits of New Structure

1. **No Route Conflicts**: Each endpoint has a unique, logical path
2. **Better Maintainability**: Clear separation makes code easier to maintain
3. **Consistent API Design**: Follows RESTful conventions more closely
4. **Improved Developer Experience**: Better documentation and clear endpoint purposes
5. **Scalability**: Easy to add new features without route conflicts
6. **Flexible Material Management**: Materials can be organized at both course and lesson levels

## Usage Examples

### Creating a Course with Lessons
```bash
# 1. Create course
POST /courses
{
  "title": "Web Development Fundamentals",
  "description": "Learn the basics of web development",
  "level": "BEGINNER",
  "category": "BARTENDING"
}

# 2. Add lesson to course
POST /courses/{courseId}/lessons
{
  "title": "Introduction to HTML",
  "content": "HTML is the standard markup language...",
  "videoId": "video-uuid-123"
}

# 3. Add material to course (course-level material)
POST /courses/{courseId}/materials
{
  "title": "Course Syllabus",
  "fileUrl": "https://example.com/syllabus.pdf"
}
```

### Managing Individual Lessons
```bash
# Get lesson details
GET /lessons/{lessonId}

# Update lesson
PATCH /lessons/{lessonId}
{
  "title": "Advanced HTML Concepts",
  "content": "Advanced HTML features..."
}

# Delete lesson
DELETE /lessons/{lessonId}
```

### Managing Lesson Materials
```bash
# Add material to specific lesson
POST /lessons/{lessonId}/materials
{
  "title": "HTML Cheat Sheet",
  "fileUrl": "https://example.com/html-cheatsheet.pdf"
}

# Get materials for a specific lesson
GET /materials/lesson/{lessonId}

# Get material details
GET /materials/{materialId}

# Update material
PUT /materials/{materialId}
{
  "title": "Updated HTML Cheat Sheet",
  "fileUrl": "https://example.com/updated-cheatsheet.pdf"
}

# Delete material
DELETE /materials/{materialId}
```

## Material Organization

### **Course-Level Materials**
- **Purpose**: General course materials (syllabus, course overview, etc.)
- **Endpoint**: `POST /courses/:id/materials`
- **Use Case**: Materials that apply to the entire course

### **Lesson-Level Materials**
- **Purpose**: Specific lesson materials (worksheets, examples, etc.)
- **Endpoint**: `POST /lessons/:id/materials`
- **Use Case**: Materials that are specific to a particular lesson

### **Querying Materials**
- **By Course**: `GET /courses/:id/materials` - All materials for a course
- **By Lesson**: `GET /materials/lesson/:lessonId` - Materials for a specific lesson
- **By ID**: `GET /materials/:id` - Specific material details

## Security & Access Control

- **Public Endpoints**: Course viewing, lesson viewing, material viewing
- **Protected Endpoints**: All creation, update, and deletion operations
- **Role-Based Access**: ADMIN and INSTRUCTOR roles for content management
- **JWT Authentication**: Required for all protected endpoints

## Future Enhancements

1. **Bulk Operations**: Add endpoints for bulk lesson/material management
2. **Search & Filter**: Implement course search by title, category, level
3. **Pagination**: Add pagination for large datasets
4. **Advanced Queries**: Support for complex filtering and sorting
5. **Webhook Support**: Notifications for course updates
6. **Material Categories**: Organize materials by type (PDF, Video, Link, etc.)
7. **Material Versioning**: Track changes to materials over time
