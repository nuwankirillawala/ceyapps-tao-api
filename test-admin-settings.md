# Testing Admin Settings Module

This guide provides step-by-step instructions for testing the new admin settings functionality.

## Prerequisites

1. **Database Migration Applied**: Ensure the migration `20250813191324_add_admin_settings_models` has been applied
2. **Application Running**: Start the application with `yarn start:dev`
3. **Admin User**: Have an admin user account with valid JWT token
4. **Swagger UI**: Access the API documentation at `/api` endpoint

## Test Scenarios

### 1. FAQ Management Testing

#### Create FAQ
```bash
POST /admin/settings/faqs
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "title": "How to reset password?",
  "question": "I forgot my password, how can I reset it?",
  "answer": "You can reset your password by clicking on the 'Forgot Password' link on the login page.",
  "index": 1,
  "isActive": true
}
```

#### Get All FAQs
```bash
GET /admin/settings/faqs?page=1&limit=10
Authorization: Bearer <admin-jwt-token>
```

#### Update FAQ
```bash
PUT /admin/settings/faqs/{faq-id}
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "answer": "Updated answer text here",
  "index": 2
}
```

#### Toggle FAQ Status
```bash
PUT /admin/settings/faqs/{faq-id}/toggle-status
Authorization: Bearer <admin-jwt-token>
```

#### Delete FAQ
```bash
DELETE /admin/settings/faqs/{faq-id}
Authorization: Bearer <admin-jwt-token>
```

### 2. Contact Details Testing

#### Create Contact Detail
```bash
POST /admin/settings/contact-details
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "type": "EMAIL",
  "label": "Support Email",
  "value": "support@example.com",
  "icon": "fas fa-envelope",
  "order": 1,
  "isActive": true
}
```

#### Get Contact Details by Type
```bash
GET /admin/settings/contact-details?type=EMAIL&page=1&limit=10
Authorization: Bearer <admin-jwt-token>
```

#### Update Contact Detail
```bash
PUT /admin/settings/contact-details/{contact-id}
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "value": "new-support@example.com",
  "order": 2
}
```

### 3. Available Countries Testing

#### Create Country
```bash
POST /admin/settings/countries
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "United States",
  "code": "US",
  "flag": "🇺🇸",
  "order": 1,
  "isActive": true
}
```

#### Get Countries with Filtering
```bash
GET /admin/settings/countries?isActive=true&page=1&limit=20
Authorization: Bearer <admin-jwt-token>
```

#### Update Country
```bash
PUT /admin/settings/countries/{country-id}
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "flag": "🇺🇸",
  "order": 2
}
```

### 4. Trending Courses Testing

#### Create Trending Course
```bash
POST /admin/settings/trending-courses
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "courseId": "existing-course-uuid",
  "order": 1,
  "isActive": true
}
```

**Note**: Ensure the `courseId` references an existing course in your database.

#### Get Trending Courses with Course Details
```bash
GET /admin/settings/trending-courses?isActive=true&page=1&limit=10
Authorization: Bearer <admin-jwt-token>
```

#### Update Trending Course Order
```bash
PUT /admin/settings/trending-courses/{trending-id}
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "order": 3
}
```

## Public Endpoints Testing

### 1. Get Active FAQs
```bash
GET /public/settings/faqs?limit=5
```

### 2. Get Contact Details by Type
```bash
GET /public/settings/contact-details?type=EMAIL
```

### 3. Get Active Countries
```bash
GET /public/settings/countries
```

### 4. Get Trending Courses
```bash
GET /public/settings/trending-courses?limit=10
```

## Error Testing

### 1. Duplicate Index/Order
```bash
POST /admin/settings/faqs
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "title": "Another FAQ",
  "question": "Another question?",
  "answer": "Another answer",
  "index": 1,  # This should fail if index 1 already exists
  "isActive": true
}
```

### 2. Invalid Course ID
```bash
POST /admin/settings/trending-courses
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "courseId": "non-existent-course-uuid",
  "order": 1,
  "isActive": true
}
```

### 3. Duplicate Country Code
```bash
POST /admin/settings/countries
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "Another Country",
  "code": "US",  # This should fail if US code already exists
  "order": 2,
  "isActive": true
}
```

## Validation Testing

### 1. Required Fields
```bash
POST /admin/settings/faqs
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "title": "",  # Empty title should fail validation
  "question": "Question?",
  "answer": "Answer"
}
```

### 2. Invalid Country Code Length
```bash
POST /admin/settings/countries
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "Test Country",
  "code": "USA",  # Should fail - must be exactly 2 characters
  "order": 1,
  "isActive": true
}
```

## Performance Testing

### 1. Pagination
```bash
GET /admin/settings/faqs?page=1&limit=100
GET /admin/settings/faqs?page=2&limit=100
```

### 2. Large Dataset
Create multiple entries and test:
- Response time for large datasets
- Memory usage
- Database query performance

## Security Testing

### 1. Unauthorized Access
```bash
GET /admin/settings/faqs
# Without Authorization header - should return 401
```

### 2. Non-Admin User
```bash
GET /admin/settings/faqs
Authorization: Bearer <non-admin-jwt-token>
# Should return 403 Forbidden
```

### 3. Public Endpoints
```bash
GET /public/settings/faqs
# Should work without authentication
```

## Expected Results

### Success Responses
- **201 Created** for successful creation
- **200 OK** for successful updates and retrievals
- **200 OK** with message for successful deletions

### Error Responses
- **400 Bad Request** for validation errors
- **401 Unauthorized** for missing/invalid JWT
- **403 Forbidden** for insufficient permissions
- **404 Not Found** for non-existent resources

### Data Validation
- Unique constraints enforced
- Required fields validated
- Data types validated
- Business logic enforced

## Cleanup

After testing, you may want to clean up test data:

```bash
# Delete test FAQs
DELETE /admin/settings/faqs/{test-faq-id}

# Delete test contact details
DELETE /admin/settings/contact-details/{test-contact-id}

# Delete test countries
DELETE /admin/settings/countries/{test-country-id}

# Delete test trending courses
DELETE /admin/settings/trending-courses/{test-trending-id}
```

## Notes

1. **Database State**: Ensure your database is in a clean state before testing
2. **JWT Tokens**: Use valid admin JWT tokens for protected endpoints
3. **Course IDs**: For trending courses testing, use actual course UUIDs from your database
4. **Unique Constraints**: Test the unique constraints thoroughly
5. **Error Handling**: Verify that all error scenarios return appropriate HTTP status codes
6. **Swagger Documentation**: All endpoints should be properly documented in Swagger UI
