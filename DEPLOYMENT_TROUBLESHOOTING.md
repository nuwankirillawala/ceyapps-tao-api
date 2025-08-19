# Deployment Troubleshooting Guide

## Prepared Statement Errors (PostgreSQL Error 42P05)

### Problem Description
The error "prepared statement 's1' already exists" occurs when PostgreSQL tries to create prepared statements that already exist. This is a common issue in production deployments with Prisma, especially when using connection pooling.

### Root Causes
1. **Connection Pooling Issues**: Multiple connections trying to create the same prepared statements
2. **Prisma Client Reuse**: The same Prisma client instance being used across multiple requests
3. **Database Connection Management**: Improper connection lifecycle management
4. **Environment Configuration**: Missing or incorrect database configuration

### Solutions Implemented

#### 1. Enhanced Prisma Service
- Added retry logic for prepared statement errors
- Implemented connection error handling
- Added `executeWithRetry` method for automatic retry on failures

#### 2. Database Configuration Updates
- Increased connection limit from 1 to 5
- Added PostgreSQL-specific timeout settings
- Implemented retry mechanisms

#### 3. Environment Variables
Set these environment variables in your production environment:

```bash
# Database Connection Settings
DATABASE_CONNECTION_LIMIT=5
DATABASE_POOL_TIMEOUT=20
DATABASE_ACQUIRE_TIMEOUT=60
DATABASE_CONNECTION_TIMEOUT=30000
DATABASE_STATEMENT_TIMEOUT=30000

# PostgreSQL Settings
DISABLE_PREPARED_STATEMENTS=true

# Retry Settings
DATABASE_MAX_RETRIES=3
DATABASE_RETRY_DELAY=1000

# Logging
ENABLE_QUERY_LOGGING=false
ENABLE_ERROR_LOGGING=true
```

### Deployment Steps

#### Step 1: Update Environment Variables
Add the environment variables above to your production environment (Render, Heroku, etc.)

#### Step 2: Regenerate Prisma Client
```bash
yarn prisma generate
```

#### Step 3: Restart Application
Restart your application to ensure the new configuration takes effect.

#### Step 4: Monitor Logs
Watch for any remaining prepared statement errors. The new retry logic should handle them automatically.

### Alternative Solutions

#### Option 1: Disable Prepared Statements (Recommended for Production)
Add this to your DATABASE_URL:
```
?prepared_statements=false
```

#### Option 2: Use Connection Pooling
If you're using a service like Supabase, ensure you're using their connection pooling:
```
postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

#### Option 3: Database-Level Fix
If you have database access, you can run:
```sql
DEALLOCATE ALL;
```

### Monitoring and Maintenance

#### Health Checks
The updated Prisma service includes:
- Connection status monitoring
- Automatic reconnection on failures
- Retry logic for transient errors

#### Logging
Enable error logging to monitor connection issues:
```bash
ENABLE_ERROR_LOGGING=true
```

### Common Issues and Solutions

#### Issue: Still getting prepared statement errors
**Solution**: Ensure `DISABLE_PREPARED_STATEMENTS=true` is set in your environment

#### Issue: Connection timeouts
**Solution**: Increase `DATABASE_CONNECTION_TIMEOUT` and `DATABASE_STATEMENT_TIMEOUT`

#### Issue: High memory usage
**Solution**: Reduce `DATABASE_CONNECTION_LIMIT` to 3-5

### Performance Considerations

- **Connection Limit**: 5 connections is optimal for most applications
- **Timeout Settings**: 30 seconds is reasonable for production
- **Retry Logic**: 3 retries with 1-second delays balances reliability and performance

### Testing in Production

1. Deploy with the new configuration
2. Monitor application logs for connection errors
3. Test authentication endpoints (login/register)
4. Monitor database connection metrics
5. Verify retry logic is working

### Rollback Plan

If issues persist:
1. Revert to previous Prisma service version
2. Set `DISABLE_PREPARED_STATEMENTS=true` in environment
3. Restart application
4. Monitor for errors

### Support

If you continue to experience issues:
1. Check application logs for specific error messages
2. Verify environment variables are correctly set
3. Ensure database is accessible from your deployment environment
4. Consider upgrading to the latest Prisma version
