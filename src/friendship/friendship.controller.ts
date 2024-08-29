import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { FriendAddDto } from './dto/friend-add.dto';
import { FriendshipService } from './friendship.service';

@Controller('friendship')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Post('add')
  @RequireLogin()
  async add(
    @Body() friendAddDto: FriendAddDto,
    @UserInfo('userId') userId: number,
  ) {
    return await this.friendshipService.add(friendAddDto, userId);
  }

  @Get('add_list')
  @RequireLogin()
  async addList(@UserInfo('userId') userId: number) {
    return await this.friendshipService.addList(userId);
  }

  @Get('agree/:id')
  @RequireLogin()
  async agree(
    @Param('id') friendId: number,
    @UserInfo('userId') userId: number,
  ) {
    if (!friendId) {
      throw new BadRequestException('请选择要添加的好友');
    }
    return await this.friendshipService.agree(friendId, userId);
  }

  @Get('reject/:id')
  @RequireLogin()
  async reject(
    @Param('id') friendId: number,
    @UserInfo('userId') userId: number,
  ) {
    return await this.friendshipService.reject(friendId, userId);
  }

  @Get('remove/:id')
  @RequireLogin()
  async remove(
    @Param('id') friendId: number,
    @UserInfo('userId') userId: number,
  ) {
    return await this.friendshipService.remove(friendId, userId);
  }
}
