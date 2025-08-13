# Settings Feature Testing Guide

## 🧪 **Testing the Settings Module**

This guide provides comprehensive testing scenarios for all settings functionality.

## 📋 **Prerequisites**

1. **Database Setup**: Ensure database is running and migrations are applied
2. **Authentication**: Have a valid JWT token for authenticated requests
3. **Environment**: Set up required environment variables

## 🔧 **Setup Commands**

```bash
# Generate Prisma client with new models
npx prisma generate

# Apply database migrations
npx prisma migrate dev --name add_settings_models

# Start the application
yarn start:dev
```

## 🧪 **Test Scenarios**

### **1. Profile Management Tests**

#### **1.1 Get User Profile**
```bash
curl -X GET http://localhost:3000/settings/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "id": "user-uuid-123",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+1234567890",
  "profileImage": "https://example.com/profile.jpg",
  "role": "STUDENT",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### **1.2 Update Profile**
```bash
curl -X PUT http://localhost:3000/settings/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "John Smith",
    "email": "john.smith@example.com",
    "phoneNumber": "+1987654321",
    "bio": "Professional bartender with 5 years experience",
    "location": "Los Angeles, CA",
    "website": "https://johnsmith.com"
  }'
```

#### **1.3 Upload Profile Image**
```bash
curl -X POST http://localhost:3000/settings/profile/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/profile-image.jpg"
```

### **2. Security Tests**

#### **2.1 Change Password**
```bash
curl -X POST http://localhost:3000/settings/security/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newSecurePassword123",
    "confirmPassword": "newSecurePassword123"
  }'
```

**Expected Response:**
```json
{
  "message": "Password changed successfully"
}
```

#### **2.2 Request Password Reset**
```bash
curl -X POST http://localhost:3000/settings/security/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Expected Response:**
```json
{
  "message": "If an account with this email exists, a password reset link has been sent"
}
```

#### **2.3 Reset Password**
```bash
curl -X POST http://localhost:3000/settings/security/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "valid-reset-token",
    "newPassword": "newPassword123"
  }'
```

### **3. Billing Tests**

#### **3.1 Get Payment Methods**
```bash
curl -X GET http://localhost:3000/settings/billing/payment-methods \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "paymentMethods": [
    {
      "id": "pm_1234567890",
      "type": "card",
      "last4": "4242",
      "brand": "visa",
      "expMonth": 12,
      "expYear": 2025,
      "isDefault": true,
      "nickname": "My Credit Card"
    }
  ],
  "defaultPaymentMethod": "pm_1234567890"
}
```

#### **3.2 Add Payment Method**
```bash
curl -X POST http://localhost:3000/settings/billing/payment-methods \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "card",
    "paymentMethodId": "pm_newpaymentmethod",
    "setAsDefault": false
  }'
```

#### **3.3 Update Payment Method**
```bash
curl -X PUT http://localhost:3000/settings/billing/payment-methods/pm_1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "Updated Credit Card",
    "setAsDefault": true
  }'
```

#### **3.4 Set Default Payment Method**
```bash
curl -X POST http://localhost:3000/settings/billing/payment-methods/default \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethodId": "pm_1234567890"
  }'
```

#### **3.5 Remove Payment Method**
```bash
curl -X DELETE http://localhost:3000/settings/billing/payment-methods/pm_1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **3.6 Get Purchase History**
```bash
curl -X GET http://localhost:3000/settings/billing/purchase-history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": "order-uuid-123",
    "status": "PAID",
    "totalAmount": 99.99,
    "currency": "USD",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "orderItems": [
      {
        "id": "order-item-uuid-123",
        "price": 99.99,
        "course": {
          "id": "course-uuid-123",
          "title": "Advanced Bartending Course"
        }
      }
    ]
  }
]
```

### **4. Help & Support Tests**

#### **4.1 Get FAQ**
```bash
curl -X GET "http://localhost:3000/settings/help/faq?query=password&category=ACCOUNT" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "faqs": [
    {
      "id": 1,
      "question": "How do I change my password?",
      "answer": "Go to Settings > Security > Change Password to update your password.",
      "category": "ACCOUNT",
      "tags": ["password", "security"]
    }
  ],
  "total": 1
}
```

#### **4.2 Contact Support**
```bash
curl -X POST http://localhost:3000/settings/help/contact \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Payment Issue",
    "message": "I am having trouble with my payment method. The transaction keeps failing.",
    "category": "BILLING",
    "email": "user@example.com",
    "contactInfo": "+1234567890"
  }'
```

**Expected Response:**
```json
{
  "ticketId": "ticket-uuid-123",
  "message": "Support ticket created successfully. We will get back to you soon."
}
```

#### **4.3 Get Support Tickets**
```bash
curl -X GET http://localhost:3000/settings/help/support-tickets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": "ticket-uuid-123",
    "subject": "Payment Issue",
    "message": "I am having trouble with my payment method...",
    "category": "BILLING",
    "status": "OPEN",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### **4.4 Get Specific Support Ticket**
```bash
curl -X GET http://localhost:3000/settings/help/support-tickets/ticket-uuid-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚨 **Error Testing**

### **1. Authentication Errors**
```bash
# Test without authentication
curl -X GET http://localhost:3000/settings/profile
```

**Expected Response:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### **2. Validation Errors**
```bash
# Test invalid email format
curl -X PUT http://localhost:3000/settings/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": ["email must be an email"]
}
```

### **3. Password Change Errors**
```bash
# Test incorrect current password
curl -X POST http://localhost:3000/settings/security/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "wrongPassword",
    "newPassword": "newPassword123",
    "confirmPassword": "newPassword123"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 401,
  "message": "Current password is incorrect"
}
```

### **4. Password Mismatch Error**
```bash
# Test password confirmation mismatch
curl -X POST http://localhost:3000/settings/security/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword123",
    "confirmPassword": "differentPassword"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "New password and confirmation do not match"
}
```

## 📊 **Performance Testing**

### **1. Load Testing**
```bash
# Test multiple concurrent requests
for i in {1..10}; do
  curl -X GET http://localhost:3000/settings/profile \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" &
done
wait
```

### **2. File Upload Testing**
```bash
# Test large file upload
curl -X POST http://localhost:3000/settings/profile/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/large-image.jpg"
```

## 🔍 **Database Verification**

### **1. Check User Updates**
```sql
-- Verify profile updates
SELECT id, name, email, phoneNumber, profileImage 
FROM "User" 
WHERE id = 'user-uuid-123';
```

### **2. Check Support Tickets**
```sql
-- Verify support ticket creation
SELECT id, subject, category, status, createdAt 
FROM "SupportTicket" 
WHERE userId = 'user-uuid-123';
```

### **3. Check Password Resets**
```sql
-- Verify password reset tokens
SELECT id, userId, token, expiresAt, isUsed 
FROM "PasswordReset" 
WHERE userId = 'user-uuid-123';
```

## 📝 **Test Checklist**

- [ ] **Profile Management**
  - [ ] Get user profile
  - [ ] Update profile information
  - [ ] Upload profile image
  - [ ] Handle invalid file uploads

- [ ] **Security Features**
  - [ ] Change password with correct current password
  - [ ] Reject password change with wrong current password
  - [ ] Reject password change with mismatched confirmation
  - [ ] Request password reset
  - [ ] Reset password with valid token
  - [ ] Reject password reset with invalid token

- [ ] **Billing Management**
  - [ ] Get payment methods
  - [ ] Add payment method
  - [ ] Update payment method
  - [ ] Set default payment method
  - [ ] Remove payment method
  - [ ] Get purchase history

- [ ] **Help & Support**
  - [ ] Get FAQ with filters
  - [ ] Search FAQ by query
  - [ ] Filter FAQ by category
  - [ ] Contact support
  - [ ] Get support tickets
  - [ ] Get specific support ticket

- [ ] **Error Handling**
  - [ ] Authentication errors
  - [ ] Validation errors
  - [ ] Not found errors
  - [ ] Database errors

## 🎯 **Success Criteria**

1. **All endpoints return correct HTTP status codes**
2. **Data validation works correctly**
3. **Authentication and authorization work properly**
4. **Database operations are successful**
5. **Error messages are clear and helpful**
6. **File uploads work with Cloudflare integration**
7. **Swagger documentation is accurate and complete**

## 📚 **Additional Resources**

- [Settings Feature Documentation](./SETTINGS_FEATURE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Database Schema](./prisma/schema.prisma)
