import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { Inject } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { Query } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/udpate-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(EmailService)
  private emailService: EmailService;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(JwtService)
  private jwtService: JwtService;

  // 注册：创建用户
  @Post('register')
  async register(@Body() registerInfo: RegisterUserDto) {
    return await this.userService.register(registerInfo);
  }

  // 注册验证码
  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(`captcha_${address}`, code, 5 * 60);

    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  //登录
  @Post('login')
  async login(@Body() loginUser: LoginUserDto) {
    const user = await this.userService.login(loginUser);

    return {
      user,
      token: this.jwtService.sign(
        {
          userId: user.id,
          userName: user.userName,
        },
        { expiresIn: '7d' },
      ),
    };
  }

  @Get('info')
  @RequireLogin()
  async info(@UserInfo('userId') userId: number) {
    return await this.userService.findUserById(userId);
  }

  @Post('update_password')
  async updatePassword(@Body() updatePassword: UpdateUserPasswordDto) {
    return await this.userService.updatePassword(updatePassword);
  }

  // 修改密码验证码
  @Get('update_password/captcha')
  async updatePassCaptcha(@Query('address') address: string) {
    if (!address) {
      throw new BadRequestException('邮箱地址不能为空');
    }
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(`password_${address}`, code, 5 * 60);

    await this.emailService.sendMail({
      to: address,
      subject: '修改密码验证码',
      html: `<p>你的验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  //修改个人信息
  @Post('update')
  @RequireLogin()
  async update(
    @UserInfo('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateInfo(userId, updateUserDto);
  }

  //修改信息验证码
  @Get('update/captcha')
  async updateInfoCaptcha(@Query('address') address: string) {
    if (!address) {
      throw new BadRequestException('邮箱地址不能为空');
    }
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(`updateInfo_${address}`, code, 10 * 60);

    await this.emailService.sendMail({
      to: address,
      subject: '更改用户信息验证码',
      html: `<p>你的验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  //获取好友列表
  @Get('friend')
  @RequireLogin()
  async getFriend(@UserInfo('userId') userId: number) {
    return await this.userService.getFriends(userId);
  }
}
