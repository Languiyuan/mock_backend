import {
  Body,
  Controller,
  Post,
  Get,
  Inject,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/RegisterUserDto';
import { LoginUserDto } from './dto/LoginUserDto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { UserDetailVo } from './vo/user-info.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { RedisService } from '../redis/redis.service';
import { ProjectService } from 'src/project/project.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(ProjectService)
  private projectService: ProjectService;

  @Post('register')
  @RequireLogin()
  async register(
    @UserInfo('isAdmin') isAdmin: boolean,
    @Body() registerUser: RegisterUserDto,
  ) {
    if (!isAdmin) {
      throw new HttpException('非管理员，无权限操作', HttpStatus.BAD_REQUEST);
    }

    return await this.userService.register(registerUser);
  }

  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(ConfigService)
  private configService: ConfigService;

  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    // throw new HttpException('登陆失效', HttpStatus.UNAUTHORIZED);

    const vo = await this.userService.login(loginUser);

    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        isAdmin: vo.userInfo.isAdmin,
      },
      {
        expiresIn: this.configService.get('jwt_access_token_expires_time'),
      },
    );

    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expres_time') || '7d',
      },
    );

    return vo;
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);

      const user = await this.userService.findUserById(data.userId);

      const access_token = this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
        },
        {
          expiresIn:
            this.configService.get('jwt_access_token_expires_time') || '30m',
        },
      );

      const refresh_token = this.jwtService.sign(
        {
          userId: user.id,
        },
        {
          expiresIn:
            this.configService.get('jwt_refresh_token_expres_time') || '7d',
        },
      );

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
      };
    } catch (e) {
      throw new UnauthorizedException('token 已失效，请重新登录');
    }
  }

  // 获取用户信息
  @Get('info')
  @RequireLogin()
  async info(@UserInfo('userId') userId: number) {
    const user = await this.userService.findUserDetailById(userId);

    const vo = new UserDetailVo();
    vo.id = user.id;
    vo.username = user.username;
    vo.createTime = user.createTime;
    vo.isFrozen = user.isFrozen;

    return vo;
  }

  // 更新密码
  @Post('updatePassword')
  @RequireLogin()
  async updatePassword(
    @UserInfo('userId') userId: number,
    @Body() passwordDto: UpdateUserPasswordDto,
  ) {
    return await this.userService.updatePassword(userId, passwordDto);
  }

  // 获取验证码
  // @Get('update_password/captcha')
  // @RequireLogin()
  // async updatePasswordCaptcha(@Query('address') address: string) {
  //   const captcha = Math.random().toString().slice(2, 8);

  //   await this.redisService.set(
  //     `update_password_captcha_${address}`,
  //     captcha,
  //     5 * 60,
  //   );

  //   // 邮箱发送

  //   return '发送成功';
  // }

  // 通过用户名模糊搜索
  @Post('findUserByUsername')
  @RequireLogin()
  async findUserByUsername(@Body('username') username: string) {
    return await this.userService.findUserByUsername(username);
  }

  // 管理员 冻结用户 账号
  @Post('admin/freeze')
  @RequireLogin()
  async freeze(
    @UserInfo('isAdmin') isAdmin: boolean,
    @Body('userId') userId: number,
  ) {
    if (!isAdmin) {
      throw new HttpException('非管理员，无权限操作', HttpStatus.BAD_REQUEST);
    }
    return await this.userService.freeze(userId);
  }

  // 管理员 解冻用户 账号
  @Post('admin/unfreeze')
  @RequireLogin()
  async unfreeze(
    @UserInfo('isAdmin') isAdmin: boolean,
    @Body('userId') userId: number,
  ) {
    if (!isAdmin) {
      throw new HttpException('非管理员，无权限操作', HttpStatus.BAD_REQUEST);
    }
    return await this.userService.unfreeze(userId);
  }

  // 管理员 查询所有用户 也可名字模糊搜索
  @Post('admin/getAllUsers')
  @RequireLogin()
  async getAllUsers(
    @UserInfo('isAdmin') isAdmin: boolean,
    @Body('username') username: string,
    @Body('pageNo') pageNo: number,
    @Body('pageSize') pageSize: number,
    @Body('isAdmin') isAdminStatus: boolean | undefined,
  ) {
    if (!isAdmin) {
      throw new HttpException('非管理员，无权限操作', HttpStatus.BAD_REQUEST);
    }
    return await this.userService.getAllUsers(
      username,
      isAdminStatus,
      pageNo,
      pageSize,
    );
  }

  // 管理员 添加项目成员
  @Post('admin/addProjectMember')
  @RequireLogin()
  async addProjectMember(
    @UserInfo('isAdmin') isAdmin: boolean,
    @Body('projectId') projectId: number,
    @Body('memberId') memberId: number,
  ) {
    if (!isAdmin) {
      throw new HttpException('非管理员，无权限操作', HttpStatus.BAD_REQUEST);
    }

    return await this.projectService.addProjectMember(projectId, memberId);
  }

  // 管理员 获取所有项目
  @Post('admin/getAllProject')
  @RequireLogin()
  async getAllProject(
    @UserInfo('isAdmin') isAdmin: boolean,
    @Body('name') name: string,
    @Body('pageNo') pageNo: number,
    @Body('pageSize') pageSize: number,
  ) {
    if (!isAdmin) {
      throw new HttpException('非管理员，无权限操作', HttpStatus.BAD_REQUEST);
    }
    return await this.projectService.getAllProject(name, pageNo, pageSize);
  }

  @Get('initData')
  async initData() {
    return await this.userService.initData();
  }
}
