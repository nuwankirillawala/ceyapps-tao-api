import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from './prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get('database')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Check database connectivity' })
  @ApiResponse({
    status: 200,
    description: 'Database is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        connected: { type: 'boolean', example: true },
        timestamp: { type: 'string', example: '2025-02-09T14:30:00.000Z' },
        connectionPool: {
          type: 'object',
          properties: {
            activeConnections: { type: 'number' },
            idleConnections: { type: 'number' },
            totalConnections: { type: 'number' },
          },
        },
      },
    },
  })
  async checkDatabaseHealth() {
    try {
      // Test database connection
      await this.prismaService.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        connected: this.prismaService.isDatabaseConnected(),
        timestamp: new Date().toISOString(),
        connectionPool: {
          activeConnections: 0, // This would need to be implemented based on your connection pool
          idleConnections: 0,
          totalConnections: 0,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        timestamp: new Date().toISOString(),
        error: error.message,
        connectionPool: {
          activeConnections: 0,
          idleConnections: 0,
          totalConnections: 0,
        },
      };
    }
  }

  @Get('database/connection-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Test database connection with retry logic' })
  @ApiResponse({
    status: 200,
    description: 'Database connection test completed',
  })
  async testDatabaseConnection() {
    try {
      // Test with retry logic
      const result = await this.prismaService.executeWithRetry(async () => {
        return await this.prismaService.$queryRaw`SELECT 1 as test`;
      });

      return {
        status: 'success',
        message: 'Database connection test passed',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database connection test failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
