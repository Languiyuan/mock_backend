import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { map, Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

@Injectable()
export class FormatResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    const notFormatResponse = this.reflector.getAllAndOverride(
      'not-format-response',
      [context.getClass(), context.getHandler()],
    );

    if (notFormatResponse) {
      return next.handle().pipe(map((data) => data));
    } else {
      return next.handle().pipe(
        map((data) => {
          return {
            code: response.statusCode,
            message: 'success',
            data,
          };
        }),
      );
    }
  }
}
