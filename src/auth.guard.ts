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
import { JwtUserData } from './types/jwt';
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
      const userData = this.jwtService.verify<JwtUserData>(token);

      request.user = {
        userId: userData.userId,
        username: userData.username,
      };

      response.header(
        'token',
        this.jwtService.sign(
          {
            userId: userData.userId,
            username: userData.username,
          },
          {
            expiresIn: '7d',
          },
        ),
      );

      return true;
    } catch {
      throw new UnauthorizedException('登陆失效，请重新登录');
    }
  }
}
