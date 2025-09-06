// src/prisma/prisma.service.ts
import { Injectable, INestApplication, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { databaseConfig } from '../config/database.config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Fix connection pooling issues
      log: databaseConfig.enableQueryLogging ? ['query', 'warn', 'error'] : ['warn', 'error'],
      errorFormat: 'pretty',
      // Supabase connection pooling optimizations
      ...(databaseConfig.supabase.isPoolerMode && {
        __internal: {
          engine: {
            enableEngineDebugMode: false,
          },
        },
      }),
      // Disable prepared statements for Supabase pooler
      ...(process.env.DATABASE_URL?.includes('pooler.supabase.com') && {
        __internal: {
          engine: {
            enableEngineDebugMode: false,
            disablePreparedStatements: true,
          },
        },
      }),
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error.message);
      this.logger.error('Please check your DATABASE_URL environment variable');
      this.logger.error('For Supabase, ensure the connection string is correct and the database is accessible');
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log('Disconnected from database');
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error.message);
    }
  }

  // Add method to handle connection issues
  async handleConnectionError() {
    try {
      this.logger.log('Attempting to reconnect to database...');
      await this.$disconnect();
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Successfully reconnected to database');
    } catch (error) {
      this.logger.error('Failed to reconnect to database:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  // Handle prepared statement errors specifically
  async handlePreparedStatementError() {
    try {
      this.logger.log('Handling prepared statement error...');
      // Force a new connection to clear prepared statements
      await this.$disconnect();
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Successfully reconnected after prepared statement error');
    } catch (error) {
      this.logger.error('Failed to handle prepared statement error:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  // Execute query with retry logic for prepared statement errors
  async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a prepared statement error (PostgreSQL error code 26000)
        if (error?.code === '26000' || 
            error?.code === '42P05' || 
            (error?.message && error.message.includes('prepared statement')) ||
            (error?.message && error.message.includes('does not exist'))) {
          this.logger.warn(`Prepared statement error on attempt ${attempt}, retrying...`);
          
          if (attempt < maxRetries) {
            // Add exponential backoff
            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, delay));
            await this.handlePreparedStatementError();
            continue;
          }
        }
        
        // If it's not a prepared statement error or we've exhausted retries, throw
        throw error;
      }
    }
    
    throw lastError;
  }

  // Check connection status
  isDatabaseConnected(): boolean {
    return this.isConnected;
  }
}
