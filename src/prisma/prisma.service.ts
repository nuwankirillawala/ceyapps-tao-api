// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
      log: ['warn', 'error'],
      errorFormat: 'pretty',
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

  // Check connection status
  isDatabaseConnected(): boolean {
    return this.isConnected;
  }
}
