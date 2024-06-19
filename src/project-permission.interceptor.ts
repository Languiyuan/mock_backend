import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, mergeMap, from } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProject } from 'src/project/entities/UserProject.entity';
import { Request } from 'express';

interface JwtUserData {
  userId: number;
  username: string;
  isAdmin: boolean;
}
// kuozhao
declare module 'express' {
  interface Request {
    user: JwtUserData;
  }
}

@Injectable()
export class ProjectPermissionInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  // 项目成员表
  @InjectRepository(UserProject)
  private userProjectRepository: Repository<UserProject>;

  private async checkProjectPermission(
    userId: number,
    projectId: number,
  ): Promise<boolean> {
    const findMember = await this.userProjectRepository.findOne({
      where: { userId, projectId },
    });
    return !!findMember; // 返回是否找到项目成员
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (request.body?.projectId) {
      return from(
        this.checkProjectPermission(user.userId, request.body.projectId),
      ).pipe(
        mergeMap((isMember) => {
          if (isMember) {
            return next.handle();
          } else {
            throw new HttpException(
              '项目不存在或无权限操作。',
              HttpStatus.BAD_REQUEST,
            );
          }
        }),
      );
    } else {
      return next.handle();
    }
  }
}
