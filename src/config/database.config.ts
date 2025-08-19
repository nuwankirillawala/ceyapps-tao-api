export const databaseConfig = {
  // Connection pool settings
  connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '1'),
  poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '20'),
  acquireTimeout: parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT || '60'),
  
  // Retry settings
  maxRetries: parseInt(process.env.DATABASE_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '1000'),
  
  // Logging
  enableQueryLogging: process.env.ENABLE_QUERY_LOGGING === 'true',
  enableErrorLogging: process.env.ENABLE_ERROR_LOGGING !== 'false',
};
