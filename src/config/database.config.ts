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
    disablePreparedStatements: process.env.DISABLE_PREPARED_STATEMENTS === 'true' || process.env.NODE_ENV === 'production',
    // Connection timeout
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
    // Statement timeout
    statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '30000'),
    // Connection pooling settings for production
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
    idleInTransactionSessionTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
  },
  
  // Supabase specific settings
  supabase: {
    isPoolerMode: process.env.SUPABASE_POOL_MODE === 'true',
    connectionLimit: parseInt(process.env.SUPABASE_CONNECTION_LIMIT || '10'),
    idleTimeout: parseInt(process.env.SUPABASE_IDLE_TIMEOUT || '30000'),
    // Disable prepared statements for Supabase pooler
    disablePreparedStatements: process.env.DATABASE_URL?.includes('pooler.supabase.com') || false,
  },
  
  // Render specific settings
  render: {
    // Disable prepared statements on Render to avoid connection issues
    disablePreparedStatements: process.env.RENDER === 'true' || process.env.NODE_ENV === 'production',
    // Connection pooling settings
    connectionLimit: parseInt(process.env.RENDER_CONNECTION_LIMIT || '5'),
    // Retry settings for Render
    maxRetries: parseInt(process.env.RENDER_MAX_RETRIES || '5'),
    retryDelay: parseInt(process.env.RENDER_RETRY_DELAY || '2000'),
  },
  
  // Logging
  enableQueryLogging: process.env.ENABLE_QUERY_LOGGING === 'true',
  enableErrorLogging: process.env.ENABLE_ERROR_LOGGING !== 'false',
};
