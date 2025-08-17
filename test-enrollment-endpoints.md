# Enrollment Endpoints Testing Guide

## Overview
This guide covers testing the updated enrollment endpoints that now support optional userId parameter and role-based permissions.

## 🔄 Updated Endpoints

### 1. **Regular Enrollment** - `POST /enrollment/enroll`
- **Purpose**: Enroll user in a course
- **Authentication**: JWT required
- **Role Requirements**: Any authenticated user
- **userId**: Optional (defaults to authenticated user)

### 2. **Admin Enrollment** - `POST /enrollment/admin/enroll`
- **Purpose**: Admin/Instructor can enroll any user
- **Authentication**: JWT required
- **Role Requirements**: ADMIN or INSTRUCTOR only
- **userId**: Required

## 🧪 Test Scenarios

### **Scenario 1: Self-Enrollment (No userId provided)**

```bash
POST /enrollment/enroll
Authorization: Bearer {student-jwt-token}
Content-Type: application/json

{
  "courseId": "course-uuid-123",
  "country": "US",
  "paymentMethodId": "pm_1234567890"
}
```

**Expected Response:**
```json
{
  "message": "Enrollment completed successfully",
  "orderId": "order-uuid-123",
  "courseId": "course-uuid-123",
  "price": 99.99,
  "currency": "USD",
  "stripePaymentIntentId": "pi_1234567890"
}
```

**Test Cases:**
- ✅ Student enrolls themselves (no userId in body)
- ✅ Uses authenticated user's ID automatically
- ✅ Creates order and enrollment

### **Scenario 2: Self-Enrollment with Explicit userId**

```bash
POST /enrollment/enroll
Authorization: Bearer {student-jwt-token}
Content-Type: application/json

{
  "userId": "student-uuid-123", // Same as authenticated user
  "courseId": "course-uuid-123",
  "country": "US"
}
```

**Expected Response:** Same as above
**Test Cases:**
- ✅ Student provides their own userId
- ✅ Enrollment succeeds
- ✅ No permission issues (FIXED: Users can now provide their own ID)
- ✅ Works for all roles (STUDENT, INSTRUCTOR, ADMIN)

### **Scenario 2.5: Self-Enrollment with Own userId (All Roles)**

```bash
# Student providing their own userId
POST /enrollment/enroll
Authorization: Bearer {student-jwt-token}
Content-Type: application/json

{
  "userId": "student-uuid-123", // Same as authenticated user
  "courseId": "course-uuid-123",
  "country": "US"
}

# Instructor providing their own userId
POST /enrollment/enroll
Authorization: Bearer {instructor-jwt-token}
Content-Type: application/json

{
  "userId": "instructor-uuid-456", // Same as authenticated user
  "courseId": "course-uuid-123",
  "country": "US"
}

# Admin providing their own userId
POST /enrollment/enroll
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json

{
  "userId": "admin-uuid-789", // Same as authenticated user
  "courseId": "course-uuid-123",
  "country": "US"
}
```

**Expected Response:** All succeed with same response format
**Test Cases:**
- ✅ All roles can provide their own userId
- ✅ No permission errors when userId matches authenticated user
- ✅ Enrollment succeeds for all roles

### **Scenario 3: Admin Enrolling Another User**

```bash
POST /enrollment/enroll
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json

{
  "userId": "student-uuid-456", // Different user
  "courseId": "course-uuid-123",
  "country": "US"
}
```

**Expected Response:** Same as above
**Test Cases:**
- ✅ Admin can enroll other users
- ✅ Uses provided userId, not admin's ID
- ✅ Creates enrollment for target user

### **Scenario 4: Admin Enrollment Endpoint**

```bash
POST /enrollment/admin/enroll
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json

{
  "userId": "student-uuid-789",
  "courseId": "course-uuid-123",
  "country": "US"
}
```

**Expected Response:** Same as above
**Test Cases:**
- ✅ Admin endpoint works
- ✅ Requires userId (no defaults)
- ✅ More explicit for admin operations

### **Scenario 5: Student Trying to Enroll Another User (Should Fail)**

```bash
POST /enrollment/enroll
Authorization: Bearer {student-jwt-token}
Content-Type: application/json

{
  "userId": "other-student-uuid", // Different user
  "courseId": "course-uuid-123",
  "country": "US"
}
```

**Expected Response:**
```json
{
  "message": "Insufficient permissions to enroll other users",
  "error": "Forbidden",
  "statusCode": 403
}
```

**Test Cases:**
- ❌ Student cannot enroll other users
- ❌ Returns 403 Forbidden
- ❌ Clear error message

### **Scenario 6: Missing Required Fields**

```bash
POST /enrollment/enroll
Authorization: Bearer {student-jwt-token}
Content-Type: application/json

{
  "courseId": "course-uuid-123"
  // Missing country
}
```

**Expected Response:**
```json
{
  "message": "country should not be empty",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Test Cases:**
- ❌ Missing country returns 400
- ❌ Missing courseId returns 400
- ❌ Validation errors are clear

### **Scenario 7: Invalid Course ID**

```bash
POST /enrollment/enroll
Authorization: Bearer {student-jwt-token}
Content-Type: application/json

{
  "courseId": "invalid-uuid",
  "country": "US"
}
```

**Expected Response:**
```json
{
  "message": "Course not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**Test Cases:**
- ❌ Invalid courseId returns 404
- ❌ Non-existent course handled properly

### **Scenario 8: Duplicate Enrollment**

```bash
# First enrollment (should succeed)
POST /enrollment/enroll
Authorization: Bearer {student-jwt-token}
Content-Type: application/json

{
  "courseId": "course-uuid-123",
  "country": "US"
}

# Second enrollment with same course (should fail)
POST /enrollment/enroll
Authorization: Bearer {student-jwt-token}
Content-Type: application/json

{
  "courseId": "course-uuid-123",
  "country": "US"
}
```

**Expected Response (Second Request):**
```json
{
  "message": "User already enrolled in this course",
  "error": "Conflict",
  "statusCode": 409
}
```

**Test Cases:**
- ✅ First enrollment succeeds
- ❌ Second enrollment fails with 409
- ❌ Prevents duplicate enrollments

## 🔐 Role-Based Testing

### **Student Role**
- ✅ Can enroll themselves
- ❌ Cannot enroll other users
- ❌ Cannot access admin endpoint

### **Instructor Role**
- ✅ Can enroll themselves
- ✅ Can enroll other users
- ✅ Can access admin endpoint

### **Admin Role**
- ✅ Can enroll themselves
- ✅ Can enroll any user
- ✅ Can access admin endpoint

## 📋 Test Checklist

### **Authentication Tests**
- [ ] No token returns 401
- [ ] Invalid token returns 401
- [ ] Valid token works

### **Permission Tests**
- [ ] Student can't enroll others
- [ ] Instructor can enroll others
- [ ] Admin can enroll others

### **Validation Tests**
- [ ] Required fields validation
- [ ] UUID format validation
- [ ] Course existence validation
- [ ] Duplicate enrollment prevention

### **Business Logic Tests**
- [ ] Order creation
- [ ] Enrollment creation
- [ ] Payment intent handling
- [ ] Status updates

## 🚀 Testing Commands

### **Start the Application**
```bash
yarn start:dev
```

### **Test with cURL**
```bash
# Get JWT token first
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@example.com", "password": "password"}'

# Use token for enrollment
curl -X POST http://localhost:3000/enrollment/enroll \
  -H "Authorization: Bearer {jwt-token}" \
  -H "Content-Type: application/json" \
  -d '{"courseId": "course-uuid-123", "country": "US"}'
```

### **Test with Swagger**
1. Open `http://localhost:3000/api`
2. Navigate to `/enrollment/enroll`
3. Click "Try it out"
4. Add your JWT token
5. Test different payloads

## 🔍 Debugging Tips

### **Check JWT Token**
```bash
# Decode JWT to see user info
echo "your.jwt.token" | cut -d. -f2 | base64 -d | jq
```

### **Check Database**
```sql
-- Check enrollments
SELECT * FROM "UserEnrollment" WHERE "userId" = 'user-uuid';

-- Check orders
SELECT * FROM "Order" WHERE "userId" = 'user-uuid';
```

### **Check Logs**
```bash
# Monitor application logs
tail -f logs/app.log
```

## 📝 Expected Database Changes

After successful enrollment:
1. **Order** record created with status 'PENDING'
2. **OrderItem** record created linking order to course
3. **UserEnrollment** record created with status 'ACTIVE'
4. **Stripe payment intent ID** stored (currently mock)

---

**Note**: The current implementation still uses mock Stripe payment IDs. To complete the integration, you'll need to connect this with the Stripe service we implemented earlier.
