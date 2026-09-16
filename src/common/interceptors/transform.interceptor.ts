import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((resData) => {
        // If response is a paginated result
        if (resData && typeof resData === 'object' && 'data' in resData && 'page' in resData) {
          const { data, page, limit, total, message, ...rest } = resData;
          const totalPages = Math.ceil(total / limit);

          return {
            statusCode: response.statusCode,
            message: message || 'Success',
            data,
            meta: {
              page,
              limit,
              total,
              totalPages,
              timestamp: new Date().toISOString(),
              path: request.url,
              ...rest,
            },
          };
        }

        // If response is custom message + data object
        if (resData && typeof resData === 'object' && 'data' in resData && 'message' in resData) {
          const { data, message, ...restMeta } = resData;
          return {
            statusCode: response.statusCode,
            message: message || 'Success',
            data,
            meta: {
              timestamp: new Date().toISOString(),
              path: request.url,
              ...restMeta,
            },
          };
        }

        // Standard single object/array response
        return {
          statusCode: response.statusCode,
          message: 'Success',
          data: resData ?? null,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
          },
        };
      }),
    );
  }
}
