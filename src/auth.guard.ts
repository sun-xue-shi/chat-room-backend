import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';

// 登录验证
@Injectable()
export class AuthGuard implements CanActivate {
  @Inject()
  private reflector: Reflector;

  @Inject(JwtService)
  private jwtService: JwtService;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    const requireLogin = this.reflector.getAllAndOverride('require-login', [
      context.getClass(),
      context.getHandler(),
    ]);

    if (!requireLogin) return true;

    const authorization = request.headers.authorization;

    if (!authorization) throw new UnauthorizedException('用户未登录');

    try {
      const token = authorization.split(' ')[1];
      const userData = this.jwtService.verify(token);

      request.user = {
        userId: userData.userId,
        userName: userData.userName,
      };

      const { exp } = userData; // 过期时间
      const nowTime = Math.floor(Date.now() / 1000);
      const refreshTokenTime = exp - nowTime;

      if (refreshTokenTime < 60 * 60 * 24) {
        response.header(
          'token',
          this.jwtService.sign(
            {
              userId: userData.userId,
              userName: userData.userName,
            },
            {
              expiresIn: '7d',
            },
          ),
        );
      }

      return true;
    } catch {
      throw new UnauthorizedException('登陆失效，请重新登录');
    }
  }
}
