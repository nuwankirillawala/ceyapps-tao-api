# User Region Detection Feature

This feature automatically detects the logged user's region using IPinfo when they log in to the application.

## Overview

The region detection feature:
- Automatically detects user's country, region, city, and timezone based on their IP address
- Updates user profile with region information on each login
- Tracks last login time and IP address
- Handles private IPs gracefully (skips detection for localhost/private IPs)
- Works with various proxy configurations (Cloudflare, load balancers, etc.)

## Setup

### 1. Environment Variables

Add the following environment variable to your `.env` file:

```env
IPINFO_API_KEY=your-ipinfo-api-key-here
```

You can get a free API key from [IPinfo.io](https://ipinfo.io/).

### 2. Database Migration

The feature adds new fields to the User model:
- `country` - User's country
- `region` - User's state/region
- `city` - User's city
- `timezone` - User's timezone
- `lastLoginAt` - Timestamp of last login
- `lastLoginIp` - IP address used for last login

Run the database migration:
```bash
npx prisma migrate dev --name add-user-region-fields
```

### 3. API Key Configuration

1. Sign up for a free account at [IPinfo.io](https://ipinfo.io/)
2. Get your API key from the dashboard
3. Add it to your environment variables

## How It Works

### Login Process

When a user logs in:

1. **IP Extraction**: The system extracts the user's IP address from various headers:
   - `cf-connecting-ip` (Cloudflare)
   - `x-real-ip`
   - `x-client-ip`
   - `x-forwarded-for`
   - Fallback to connection remote address

2. **IP Validation**: Private/local IPs are skipped to avoid unnecessary API calls

3. **Region Lookup**: If a valid public IP is found, the system calls IPinfo API to get:
   - Country
   - Region/State
   - City
   - Timezone

4. **User Update**: The user's profile is updated with the region information and login details

### Error Handling

- If region detection fails, the login process continues normally
- Errors are logged but don't affect the user experience
- Private IPs are handled gracefully without API calls

## API Changes

### Login Endpoint

The login endpoint now accepts the request object to extract IP information:

```typescript
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

The response remains the same, but the user's region information is updated in the background.

### User Model

The User model now includes additional fields:

```typescript
{
  id: string;
  email: string;
  name: string;
  // ... other fields
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
}
```

## Usage Examples

### Getting User Region Information

```typescript
// In your service
const user = await this.userService.findById(userId);
console.log(`User is from ${user.city}, ${user.region}, ${user.country}`);
console.log(`Last login: ${user.lastLoginAt} from IP: ${user.lastLoginIp}`);
```

### Filtering Users by Region

```typescript
// Get all users from a specific country
const users = await this.prisma.user.findMany({
  where: {
    country: 'US'
  }
});
```

## Testing

The feature includes unit tests for the RegionService. Run tests with:

```bash
npm test region.service.spec.ts
```

## Security Considerations

- IP addresses are stored for security and analytics purposes
- Private IPs are not sent to external services
- The feature gracefully handles API failures
- No sensitive user data is exposed through the region detection

## Monitoring

Monitor the feature by checking:
- API call success rates to IPinfo
- User region data accuracy
- Login performance impact
- Error logs for region detection failures

## Troubleshooting

### Common Issues

1. **No region data being saved**
   - Check if IPINFO_API_KEY is set correctly
   - Verify the API key is valid and has remaining quota
   - Check logs for API errors

2. **Private IPs being processed**
   - This is expected behavior for local development
   - Private IPs are skipped to avoid unnecessary API calls

3. **Performance concerns**
   - Region detection is asynchronous and doesn't block login
   - Consider implementing caching for frequently seen IPs
   - Monitor API response times

### Debug Mode

Enable debug logging by setting the log level to debug in your NestJS configuration to see detailed region detection logs.

