import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { Logger } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { HttpException } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class UserService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  @Inject(RedisService)
  private redisService: RedisService;

  private log = new Logger();

  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`);

    console.log('ca', captcha, user.captcha);

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (user.captcha != captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }

    const findUser = await this.prismaService.user.findUnique({
      where: {
        userName: user.userName,
      },
    });

    if (findUser) {
      throw new HttpException('该用户已存在', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.prismaService.user.create({
        data: {
          userName: user.userName,
          password: user.password,
          nickName: user.nickName,
          email: user.email,
        },
        select: {
          id: true,
          userName: true,
          nickName: true,
          email: true,
          avatar: true,
          createTime: true,
        },
      });
    } catch (error) {
      this.log.error(error, UserService);
      return null;
    }
  }
}
