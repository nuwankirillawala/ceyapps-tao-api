export const databaseConfig = {
  // Connection pool settings
  connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '5'),
  poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '20'),
  acquireTimeout: parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT || '60'),
  
  // Retry settings
  maxRetries: parseInt(process.env.DATABASE_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '1000'),
  
  // PostgreSQL specific settings
  postgresql: {
    // Disable prepared statements to avoid conflicts
    disablePreparedStatements: process.env.DISABLE_PREPARED_STATEMENTS === 'true',
    // Connection timeout
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
    // Statement timeout
    statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '30000'),
  },
  
  // Supabase specific settings
  supabase: {
    isPoolerMode: process.env.SUPABASE_POOL_MODE === 'true',
    connectionLimit: parseInt(process.env.SUPABASE_CONNECTION_LIMIT || '10'),
    idleTimeout: parseInt(process.env.SUPABASE_IDLE_TIMEOUT || '30000'),
  },
  
  // Logging
  enableQueryLogging: process.env.ENABLE_QUERY_LOGGING === 'true',
  enableErrorLogging: process.env.ENABLE_ERROR_LOGGING !== 'false',
};
