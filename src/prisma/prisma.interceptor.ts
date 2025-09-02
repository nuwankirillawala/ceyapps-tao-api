import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, delay } from 'rxjs/operators';
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class PrismaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PrismaInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          // Only retry on prepared statement errors
          if (this.isPreparedStatementError(error)) {
            this.logger.warn(`Prepared statement error, retrying (${retryCount}/3)...`);
            return new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
          throw error; // Don't retry other errors
        }
      }),
      catchError(error => {
        if (error instanceof PrismaClientKnownRequestError || error instanceof PrismaClientUnknownRequestError) {
          // Handle Prisma-specific errors
          this.logger.error(`Prisma error: ${error.message}`);
          
          // If it's a connection issue, we might want to retry
          if (this.isPreparedStatementError(error)) {
            this.logger.warn('Detected connection pooling issue, consider restarting the service');
          }
        }
        
        return throwError(() => error);
      })
    );
  }

  private isPreparedStatementError(error: any): boolean {
    return error?.message?.includes('prepared statement') || 
           error?.message?.includes('does not exist') ||
           error?.code === '26000' ||
           error?.code === '42P05' ||
           (error?.message && error.message.includes('s38')) ||
           (error?.message && error.message.includes('s53')) ||
           (error?.message && error.message.includes('s79')) ||
           (error?.message && error.message.includes('s80'));
  }
}
