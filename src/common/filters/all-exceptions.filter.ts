import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message: any = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || resObj.error || exception.message;
        errorCode = resObj.errorCode || this.getErrorCodeFromStatus(status);
      }
    } else if (exception && typeof exception === 'object' && 'code' in exception) {
      // Handle Prisma / Database Known Errors
      const dbError = exception as any;
      if (dbError.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        errorCode = 'UNIQUE_CONSTRAINT_FAILED';
        message = `Unique constraint failed on field: ${dbError.meta?.target?.join(', ') || 'unknown'}`;
      } else if (dbError.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        errorCode = 'RECORD_NOT_FOUND';
        message = 'Requested record was not found';
      } else {
        errorCode = `DB_ERROR_${dbError.code}`;
        message = dbError.message || 'Database execution error';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const logMessage = `${request.method} ${request.url} - Status: ${status} - ErrorCode: ${errorCode} - Message: ${JSON.stringify(message)}`;
    if (status === HttpStatus.UNAUTHORIZED) {
      // /auth/me is intentionally called on first page load before a visitor has a session.
      this.logger.warn(logMessage);
    } else {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : undefined);
    }

    response.status(status).json({
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      default:
        return 'HTTP_ERROR';
    }
  }
}
