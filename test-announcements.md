# Announcements Feature Testing Guide

## Issue: Empty Array Response

The empty array response is likely due to:
1. No announcements exist in the database
2. Filtering logic is too restrictive
3. Database connection issues

## Manual Testing Steps

### Step 1: Verify Server is Running
```bash
curl http://localhost:3000
```

### Step 2: Check API Documentation
Visit: http://localhost:3000/api

### Step 3: Create Test Announcements (Admin Only)

First, get an admin token:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "adminpassword"
  }'
```

Then create test announcements:
```bash
curl -X POST http://localhost:3000/announcements/test-data \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Step 4: Test Different Endpoints

#### Get All Announcements (Public)
```bash
curl http://localhost:3000/announcements
```

#### Get User-Specific Announcements (Authenticated)
```bash
curl -H "Authorization: Bearer YOUR_USER_TOKEN" \
  http://localhost:3000/announcements
```

#### Get Admin Filtered Announcements
```bash
# Get all announcements (admin)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/announcements

# Get only active announcements
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/announcements?isActive=true"

# Get only P1 priority announcements
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/announcements?priority=P1"

# Get only ALL_USERS type announcements
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/announcements?type=ALL_USERS"
```

#### View Single Announcement
```bash
curl http://localhost:3000/announcements/view/ANNOUNCEMENT_ID
```

#### Get Announcement Statistics (Admin Only)
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/announcements/stats/overview
```

## Enhanced Features Implemented

### 1. **Admin Filtering Capabilities**
- `isActive`: Filter by active/inactive status
- `priority`: Filter by priority (P1, P2, P3)
- `type`: Filter by announcement type
- `createdBy`: Filter by creator
- `courseId`: Filter by course
- `expiresBefore`/`expiresAfter`: Filter by expiration date

### 2. **User-Specific Filtering**
- Regular users only see announcements relevant to them
- Based on their role, enrolled courses, and specific targeting

### 3. **Single Announcement View**
- `GET /announcements/view/:id` - Public endpoint for viewing announcements
- `GET /announcements/:id` - Admin-only endpoint for detailed view

### 4. **Test Data Creation**
- `POST /announcements/test-data` - Creates sample announcements for testing

### 5. **Statistics Dashboard**
- `GET /announcements/stats/overview` - Admin statistics

## Example API Calls

### Create a Simple Announcement
```bash
curl -X POST http://localhost:3000/announcements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "Welcome Message",
    "content": "Welcome to our platform!",
    "type": "ALL_USERS",
    "priority": "P1"
  }'
```

### Filter Announcements by Multiple Criteria
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/announcements?isActive=true&priority=P1&type=ALL_USERS"
```

## Troubleshooting Empty Array

### 1. Check Database Connection
```bash
# Verify database is accessible
yarn prisma db pull
```

### 2. Check for Existing Announcements
```bash
# Query database directly
yarn prisma studio
```

### 3. Create Test Data
```bash
# Use the test data endpoint
curl -X POST http://localhost:3000/announcements/test-data \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 4. Check Server Logs
Look for any errors in the server console when making requests.

## Expected Responses

### Successful Announcement Creation
```json
{
  "id": "announcement-uuid",
  "title": "Welcome Message",
  "content": "Welcome to our platform!",
  "type": "ALL_USERS",
  "priority": "P1",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Announcements List
```json
[
  {
    "id": "announcement-uuid-1",
    "title": "Welcome Message",
    "content": "Welcome to our platform!",
    "type": "ALL_USERS",
    "priority": "P1",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Statistics Response
```json
{
  "total": 5,
  "active": 4,
  "inactive": 1,
  "byPriority": {
    "P1": 2,
    "P2": 2,
    "P3": 1
  },
  "byType": {
    "ALL_USERS": 3,
    "INSTRUCTORS": 1,
    "SPECIFIC_ROLES": 1
  }
}
```

## Next Steps

1. **Start the server**: `yarn start:dev`
2. **Create test data**: Use the test-data endpoint
3. **Test filtering**: Try different query parameters
4. **Verify user-specific filtering**: Test with different user roles
5. **Check statistics**: Use the stats endpoint to monitor announcements 