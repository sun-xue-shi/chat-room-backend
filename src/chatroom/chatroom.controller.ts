import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChatroomService } from './chatroom.service';
import { RequireLogin, UserInfo } from 'src/custom.decorator';

@Controller('chatroom')
@RequireLogin()
export class ChatroomController {
  constructor(private readonly chatroomService: ChatroomService) {}

  @Get('create-one')
  async createOneRoom(
    @Query('friendId') friendId: number,
    @UserInfo('userId') userId: number,
  ) {
    return await this.chatroomService.createOneRoom(friendId, userId);
  }

  @Get('create-group')
  async createGroupRoom(
    @Query('name') name: string,
    @UserInfo('userId') userId: number,
  ) {
    return await this.chatroomService.createGroupRoom(name, userId);
  }

  @Get('list')
  async roomList(
    @UserInfo('userId') userId: number,
    @Query('name') name: string,
  ) {
    return await this.chatroomService.roomList(userId, name);
  }

  @Get('member')
  async getMembers(@Query('roomId') roomId: number) {
    return await this.chatroomService.getMembers(roomId);
  }

  @Get('roomInfo/:id')
  async getSingleRoomInfo(@Param('id') id: number) {
    return await this.chatroomService.getSingleRoomInfo(id);
  }

  @Get('join/:id')
  async join(@Param('id') roomId: number, @Query('userId') userId: number) {
    return await this.chatroomService.join(roomId, userId);
  }

  @Get('exit/:id')
  async exit(@Param('id') roomId: number, @Query('userId') userId: number) {
    return await this.chatroomService.exit(roomId, userId);
  }
}
