# Enrollment Viewing Endpoints Testing Guide

## Overview
This guide covers testing all the new enrollment viewing endpoints that provide comprehensive access to enrollment data with proper role-based permissions.

## 🔄 New Enrollment Viewing Endpoints

### 1. **Get All Enrollments** - `GET /enrollment`
- **Purpose**: Retrieve all course enrollments with pagination and filtering
- **Authentication**: JWT required
- **Role Requirements**: ADMIN or INSTRUCTOR only
- **Features**: Pagination, filtering by status, courseId, userId

### 2. **Get User Enrollments** - `GET /enrollment/user/:userId`
- **Purpose**: Get enrollments for a specific user
- **Authentication**: JWT required
- **Role Requirements**: Users can view their own enrollments, ADMIN/INSTRUCTOR can view any user's
- **Features**: Pagination, filtering by status

### 3. **Get Course Enrollments** - `GET /enrollment/course/:courseId`
- **Purpose**: Get all enrollments for a specific course
- **Authentication**: JWT required
- **Role Requirements**: ADMIN/INSTRUCTOR or users enrolled in the course
- **Features**: Pagination, filtering by status

### 4. **Get My Enrollments** - `GET /enrollment/my-enrollments`
- **Purpose**: Get current user's own enrollments
- **Authentication**: JWT required
- **Role Requirements**: Any authenticated user
- **Features**: Pagination, filtering by status

### 5. **Get Specific Enrollment** - `GET /enrollment/:enrollmentId`
- **Purpose**: Get details of a specific enrollment
- **Authentication**: JWT required
- **Role Requirements**: Users can view their own enrollments, ADMIN/INSTRUCTOR can view any
- **Features**: Full enrollment details with user and course information

## 🧪 Test Scenarios

### **Scenario 1: Admin Getting All Enrollments**

```bash
GET /enrollment?page=1&limit=10&status=ACTIVE
Authorization: Bearer {admin-jwt-token}
```

**Expected Response:**
```json
{
  "enrollments": [
    {
      "id": "enrollment-uuid-123",
      "userId": "user-uuid-123",
      "courseId": "course-uuid-123",
      "status": "ACTIVE",
      "progress": 0.5,
      "enrolledAt": "2024-01-15T10:30:00Z",
      "lastAccessedAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": "user-uuid-123",
        "email": "student@example.com",
        "name": "John Doe"
      },
      "course": {
        "id": "course-uuid-123",
        "title": "Advanced JavaScript",
        "description": "Learn advanced JavaScript concepts"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Test Cases:**
- ✅ Admin can view all enrollments
- ✅ Pagination works correctly
- ✅ Filtering by status works
- ✅ User and course details included

### **Scenario 2: Student Getting Their Own Enrollments**

```bash
GET /enrollment/user/student-uuid-123
Authorization: Bearer {student-jwt-token}
```

**Expected Response:**
```json
{
  "enrollments": [
    {
      "id": "enrollment-uuid-123",
      "courseId": "course-uuid-123",
      "status": "ACTIVE",
      "progress": 0.5,
      "enrolledAt": "2024-01-15T10:30:00Z",
      "lastAccessedAt": "2024-01-15T10:30:00Z",
      "course": {
        "id": "course-uuid-123",
        "title": "Advanced JavaScript",
        "description": "Learn advanced JavaScript concepts",
        "instructorName": "Jane Smith"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

**Test Cases:**
- ✅ Student can view their own enrollments
- ✅ Course details included (no user details for privacy)
- ✅ Pagination works correctly

### **Scenario 3: Student Getting Another User's Enrollments (Should Fail)**

```bash
GET /enrollment/user/other-student-uuid-456
Authorization: Bearer {student-jwt-token}
```

**Expected Response:**
```json
{
  "message": "Insufficient permissions to view other users' enrollments",
  "error": "Forbidden",
  "statusCode": 403
}
```

**Test Cases:**
- ❌ Student cannot view other users' enrollments
- ❌ Returns 403 Forbidden
- ❌ Clear error message

### **Scenario 4: Instructor Getting Course Enrollments**

```bash
GET /enrollment/course/course-uuid-123?page=1&limit=10
Authorization: Bearer {instructor-jwt-token}
```

**Expected Response:**
```json
{
  "enrollments": [
    {
      "id": "enrollment-uuid-123",
      "userId": "user-uuid-123",
      "status": "ACTIVE",
      "progress": 0.5,
      "enrolledAt": "2024-01-15T10:30:00Z",
      "lastAccessedAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": "user-uuid-123",
        "email": "student@example.com",
        "name": "John Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

**Test Cases:**
- ✅ Instructor can view course enrollments
- ✅ User details included
- ✅ Pagination works correctly

### **Scenario 5: Student Getting Course Enrollments (Enrolled User)**

```bash
GET /enrollment/course/course-uuid-123
Authorization: Bearer {student-jwt-token}
```

**Expected Response:** Same as above (if student is enrolled in the course)
**Test Cases:**
- ✅ Enrolled students can view course enrollments
- ✅ Returns same data as instructor view

### **Scenario 6: Student Getting Course Enrollments (Not Enrolled - Should Fail)**

```bash
GET /enrollment/course/course-uuid-456
Authorization: Bearer {student-jwt-token}
```

**Expected Response:**
```json
{
  "message": "Insufficient permissions to view course enrollments",
  "error": "Forbidden",
  "statusCode": 403
}
```

**Test Cases:**
- ❌ Non-enrolled students cannot view course enrollments
- ❌ Returns 403 Forbidden

### **Scenario 7: Get My Enrollments (Current User)**

```bash
GET /enrollment/my-enrollments?status=ACTIVE
Authorization: Bearer {student-jwt-token}
```

**Expected Response:**
```json
{
  "enrollments": [
    {
      "id": "enrollment-uuid-123",
      "courseId": "course-uuid-123",
      "status": "ACTIVE",
      "progress": 0.5,
      "enrolledAt": "2024-01-15T10:30:00Z",
      "lastAccessedAt": "2024-01-15T10:30:00Z",
      "course": {
        "id": "course-uuid-123",
        "title": "Advanced JavaScript",
        "description": "Learn advanced JavaScript concepts",
        "instructorName": "Jane Smith"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

**Test Cases:**
- ✅ Users can view their own enrollments
- ✅ Filtering by status works
- ✅ Convenient endpoint for current user

### **Scenario 8: Get Specific Enrollment Details**

```bash
GET /enrollment/enrollment-uuid-123
Authorization: Bearer {student-jwt-token}
```

**Expected Response:**
```json
{
  "id": "enrollment-uuid-123",
  "userId": "user-uuid-123",
  "courseId": "course-uuid-123",
  "status": "ACTIVE",
  "progress": 0.5,
  "enrolledAt": "2024-01-15T10:30:00Z",
  "lastAccessedAt": "2024-01-15T10:30:00Z",
  "orderId": "order-uuid-123",
  "user": {
    "id": "user-uuid-123",
    "email": "student@example.com",
    "name": "John Doe"
  },
  "course": {
    "id": "course-uuid-123",
    "title": "Advanced JavaScript",
    "description": "Learn advanced JavaScript concepts",
    "instructorName": "Jane Smith"
  }
}
```

**Test Cases:**
- ✅ Users can view their own enrollment details
- ✅ Full enrollment information included
- ✅ User and course details included

## 🔐 Role-Based Testing Matrix

| Endpoint | STUDENT | INSTRUCTOR | ADMIN |
|----------|---------|------------|-------|
| `GET /enrollment` | ❌ 403 | ✅ Yes | ✅ Yes |
| `GET /enrollment/user/:userId` | ✅ Own only | ✅ Any user | ✅ Any user |
| `GET /enrollment/course/:courseId` | ✅ If enrolled | ✅ Yes | ✅ Yes |
| `GET /enrollment/my-enrollments` | ✅ Yes | ✅ Yes | ✅ Yes |
| `GET /enrollment/:enrollmentId` | ✅ Own only | ✅ Any | ✅ Any |

## 📋 Test Checklist

### **Authentication Tests**
- [ ] No token returns 401
- [ ] Invalid token returns 401
- [ ] Valid token works

### **Permission Tests**
- [ ] Students can't access admin endpoints
- [ ] Students can view their own enrollments
- [ ] Students can't view other users' enrollments
- [ ] Instructors can view course enrollments
- [ ] Admins can view all enrollments

### **Pagination Tests**
- [ ] Page parameter works
- [ ] Limit parameter works (max 100)
- [ ] Total count is accurate
- [ ] Total pages calculation is correct

### **Filtering Tests**
- [ ] Status filtering works
- [ ] CourseId filtering works
- [ ] UserId filtering works

### **Data Integrity Tests**
- [ ] Enrollment data is accurate
- [ ] User details are included where appropriate
- [ ] Course details are included where appropriate
- [ ] Progress and dates are correct

## 🚀 Testing Commands

### **Start the Application**
```bash
yarn start:dev
```

### **Test with cURL**

#### **Get All Enrollments (Admin)**
```bash
curl -X GET "http://localhost:3000/enrollment?page=1&limit=10&status=ACTIVE" \
  -H "Authorization: Bearer {admin-jwt-token}"
```

#### **Get User Enrollments**
```bash
curl -X GET "http://localhost:3000/enrollment/user/{userId}?page=1&limit=10" \
  -H "Authorization: Bearer {jwt-token}"
```

#### **Get Course Enrollments**
```bash
curl -X GET "http://localhost:3000/enrollment/course/{courseId}?page=1&limit=10" \
  -H "Authorization: Bearer {jwt-token}"
```

#### **Get My Enrollments**
```bash
curl -X GET "http://localhost:3000/enrollment/my-enrollments?status=ACTIVE" \
  -H "Authorization: Bearer {jwt-token}"
```

#### **Get Specific Enrollment**
```bash
curl -X GET "http://localhost:3000/enrollment/{enrollmentId}" \
  -H "Authorization: Bearer {jwt-token}"
```

### **Test with Swagger**
1. Open `http://localhost:3000/api`
2. Navigate to enrollment endpoints
3. Click "Try it out"
4. Add your JWT token
5. Test different parameters and permissions

## 🔍 Debugging Tips

### **Check JWT Token**
```bash
# Decode JWT to see user info and role
echo "your.jwt.token" | cut -d. -f2 | base64 -d | jq
```

### **Check Database**
```sql
-- Check enrollments
SELECT * FROM "UserEnrollment" LIMIT 5;

-- Check specific user enrollments
SELECT * FROM "UserEnrollment" WHERE "userId" = 'user-uuid-123';

-- Check course enrollments
SELECT * FROM "UserEnrollment" WHERE "courseId" = 'course-uuid-123';
```

### **Check Logs**
```bash
# Monitor application logs
tail -f logs/app.log
```

## 📝 Expected Database Queries

The endpoints will generate these types of Prisma queries:

```typescript
// Get all enrollments with filters
prisma.userEnrollment.findMany({
  where: { status: 'ACTIVE', courseId: 'course-uuid' },
  include: { user: true, course: true },
  orderBy: { enrolledAt: 'desc' },
  skip: 0,
  take: 10
})

// Get user enrollments
prisma.userEnrollment.findMany({
  where: { userId: 'user-uuid', status: 'ACTIVE' },
  include: { course: true },
  orderBy: { enrolledAt: 'desc' }
})
```

## 🚨 Common Issues & Solutions

### **Issue 1: 403 Forbidden on Course Enrollments**
**Cause**: User not enrolled in course
**Solution**: Check if user is enrolled or has ADMIN/INSTRUCTOR role

### **Issue 2: Empty Results**
**Cause**: No enrollments match filters
**Solution**: Check database for enrollment data

### **Issue 3: Pagination Not Working**
**Cause**: Invalid page/limit parameters
**Solution**: Ensure page ≥ 1, limit ≤ 100

### **Issue 4: Missing User/Course Details**
**Cause**: Database relationship issues
**Solution**: Check Prisma schema and relationships

---

**Note**: These endpoints provide comprehensive enrollment viewing capabilities with proper role-based access control. Test thoroughly to ensure data security and proper permissions.
