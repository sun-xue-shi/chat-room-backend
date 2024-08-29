import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { Logger } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { HttpException } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/udpate-user.dto';

@Injectable()
export class UserService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  @Inject(RedisService)
  private redisService: RedisService;

  private log = new Logger();

  async register(user: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${user.email}`);

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

  async login(loginUser: LoginUserDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        userName: loginUser.userName,
      },
    });

    if (!user) {
      throw new HttpException('该用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (user.password !== loginUser.password) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    return user;
  }

  /**根据userId回显用户信息 */
  async findUserById(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        userName: true,
        email: true,
        avatar: true,
        createTime: true,
        nickName: true,
      },
    });

    return user;
  }

  //修改密码
  async updatePassword(updateUser: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(`password_${updateUser.email}`);

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (updateUser.captcha != captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }

    const findUser = await this.prismaService.user.findUnique({
      where: {
        userName: updateUser.userName,
      },
    });

    if (!findUser) {
      throw new HttpException('该用户已存在', HttpStatus.BAD_REQUEST);
    }

    findUser.password = updateUser.password;

    try {
      await this.prismaService.user.update({
        where: {
          id: findUser.id,
        },
        data: findUser,
      });
      return '密码修改成功';
    } catch (error) {
      this.log.error(error, UserService);
      return '密码修改失败';
    }
  }

  //修改个人信息
  async updateInfo(userId: number, updateUser: UpdateUserDto) {
    const captcha = await this.redisService.get(
      `updateInfo_${updateUser.email}`,
    );

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (updateUser.captcha != captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (updateUser.avatar) foundUser.avatar = updateUser.avatar;
    if (updateUser.nickName) foundUser.nickName = updateUser.nickName;

    try {
      await this.prismaService.user.update({
        where: {
          id: userId,
        },
        data: foundUser,
      });
      return '用户信息修改成功';
    } catch (e) {
      this.log.error(e, UserService);
      return '用户信息修改成功';
    }
  }

  //获取好友列表
  async getFriends(userId: number) {
    const friends = await this.prismaService.friendShip.findMany({
      where: {
        OR: [
          {
            userId: userId,
          },
          {
            friendId: userId,
          },
        ],
      },
    });

    const friendSet = new Set<number>();
    for (let i = 0; i < friends.length; i++) {
      friendSet.add(friends[i].friendId);
      friendSet.add(friends[i].userId);
    }

    //将自己去掉
    const allFriendIds = [...friendSet].filter((item) => item !== userId);

    const res = [];
    for (let i = 0; i < allFriendIds.length; i++) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: allFriendIds[i],
        },
        select: {
          id: true,
          userName: true,
          nickName: true,
          email: true,
        },
      });

      res.push(user);
    }
    return res;
  }
}
