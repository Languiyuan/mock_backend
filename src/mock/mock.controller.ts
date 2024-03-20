import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MockService } from './mock.service';
import { Request, Response } from 'express';
import { NotFormatResponse } from 'src/custom.decorator';

@Controller('mock')
@NotFormatResponse()
export class MockController {
  constructor(private readonly mockService: MockService) {}

  @Post('*')
  async handlePost(
    @Body() bodyData: any,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    // 设置返回头的 Content-Type
    res.type('application/json');

    const routePathList = request.path.split('/').slice(1);
    if (routePathList.length <= 2) {
      throw new HttpException('接口路径错误', HttpStatus.BAD_REQUEST);
    }
    const projectSign: string = routePathList[1];
    const url: string = `/${routePathList.slice(2).join('/')}`;
    const data = await this.mockService.handlePost(projectSign, url);
    res.send(data);
  }

  @Get('*')
  findAll() {
    return '123123';
  }
}
