import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FriendAddDto } from './dto/friend-add.dto';

@Injectable()
export class FriendshipService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  //发送好友请求
  async add(friendAddDto: FriendAddDto, userId: number) {
    return await this.prismaService.friendRequest.create({
      data: {
        fromUserId: userId,
        toFriendId: friendAddDto.friendId,
        sayHello: friendAddDto.sayHello,
        status: 0,
      },
    });
  }

  //获取好友请求列表
  async addList(userId: number) {
    return await this.prismaService.friendRequest.findMany({
      where: {
        fromUserId: userId,
      },
    });
  }

  //同意好友申请
  async agree(friendId: number, userId: number) {
    await this.prismaService.friendRequest.updateMany({
      where: {
        toFriendId: friendId,
        fromUserId: userId,
        status: 0,
      },
      data: {
        status: 1,
      },
    });

    const res = await this.prismaService.friendShip.findMany({
      where: {
        friendId,
        userId,
      },
    });

    if (!res.length) {
      await this.prismaService.friendShip.create({
        data: {
          friendId,
          userId,
        },
      });
    }

    return '成功添加好友';
  }

  //拒绝好友申请
  async reject(friendId: number, userId: number) {
    await this.prismaService.friendRequest.updateMany({
      where: {
        toFriendId: friendId,
        fromUserId: userId,
        status: 0,
      },
      data: {
        status: 2,
      },
    });

    return '已拒绝添加好友';
  }

  //删除好友
  async remove(friendId: number, userId: number) {
    await this.prismaService.friendShip.deleteMany({
      where: {
        friendId,
        userId,
      },
    });

    return '删除成功';
  }
}
