import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { RequireLogin, RequirePermission, UserInfo } from './custom.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('aaa')
  @RequireLogin()
  @RequirePermission('ddd')
  aaaa(@UserInfo('username') username, @UserInfo() userInfo) {
    console.log('username', username);
    console.log('userInfo', userInfo);
    return 'aaa';
  }

  @Post('bbb')
  bbb() {
    return 'bbb';
  }
}
