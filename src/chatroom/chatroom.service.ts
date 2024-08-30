import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatroomService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  //一对一聊天室
  async createOneRoom(friendId: number, userId: number) {
    const { id } = await this.prismaService.chatRoom.create({
      data: {
        name: '聊天室' + Math.random().toString().slice(2, 8),
        type: false,
      },
      select: {
        id: true,
      },
    });

    await this.prismaService.user_room.create({
      data: {
        userId,
        roomId: id,
      },
    });

    await this.prismaService.user_room.create({
      data: {
        userId: friendId,
        roomId: id,
      },
    });

    return '创建成功';
  }

  //创建群聊
  async createGroupRoom(name: string, userId: number) {
    const { id } = await this.prismaService.chatRoom.create({
      data: {
        name: name,
        type: true,
      },
      select: {
        id: true,
      },
    });

    await this.prismaService.user_room.create({
      data: {
        userId,
        roomId: id,
      },
    });

    return '创建成功';
  }

  //获取用户所在聊天室
  async roomList(userId: number) {
    const roomIds = await this.prismaService.user_room.findMany({
      where: {
        userId,
      },
      select: {
        roomId: true,
      },
    });

    const chatRooms = await this.prismaService.chatRoom.findMany({
      where: {
        id: {
          in: roomIds.map((item) => item.roomId),
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        createTime: true,
      },
    });

    const res = [];
    for (let i = 0; i < chatRooms.length; i++) {
      const userIds = await this.prismaService.user_room.findMany({
        where: {
          roomId: chatRooms[i].id,
        },
        select: {
          userId: true,
        },
      });

      res.push({
        ...chatRooms[i],
        userCount: userIds.length,
        userId: userIds.map((item) => item.userId),
      });
    }
    return res;
  }

  //聊天室所有用户
  async getMembers(roomId: number) {
    const userIds = await this.prismaService.user_room.findMany({
      where: {
        roomId,
      },
      select: {
        userId: true,
      },
    });

    const members = await this.prismaService.user.findMany({
      where: {
        id: {
          in: userIds.map((item) => item.userId),
        },
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

    return members;
  }

  //单个聊天室信息
  async getSingleRoomInfo(id: number) {
    const chatRoom = await this.prismaService.chatRoom.findUnique({
      where: {
        id,
      },
    });

    return { ...chatRoom, users: await this.getMembers(id) };
  }

  //加入群聊
  async join(roomId: number, userId: number) {
    const room = await this.prismaService.chatRoom.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!room.type) {
      throw new BadRequestException('一对一聊天室不能加人');
    }

    await this.prismaService.user_room.create({
      data: {
        roomId,
        userId,
      },
    });

    return '加入成功';
  }

  //加入群聊
  async exit(roomId: number, userId: number) {
    const room = await this.prismaService.chatRoom.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!room.type) {
      throw new BadRequestException('一对一聊天室不能退出');
    }

    await this.prismaService.user_room.deleteMany({
      where: {
        roomId,
        userId,
      },
    });

    return '成功退出';
  }
}
