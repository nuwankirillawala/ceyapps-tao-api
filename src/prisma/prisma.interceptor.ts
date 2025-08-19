import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class PrismaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PrismaInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        if (error instanceof PrismaClientKnownRequestError) {
          // Handle Prisma-specific errors
          this.logger.error(`Prisma error: ${error.message}`);
          
          // If it's a connection issue, we might want to retry
          if (error.message.includes('prepared statement') || error.message.includes('already exists')) {
            this.logger.warn('Detected connection pooling issue, consider restarting the service');
          }
        }
        
        return throwError(() => error);
      })
    );
  }
}
