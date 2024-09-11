import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpException,
  HttpStatus,
  Query,
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
    @Query() queryData: any,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    // 设置返回头的 Content-Type
    res.type('application/json');

    const routePathList = request.path.split('/').slice(1);
    if (routePathList.length <= 4) {
      throw new HttpException('接口路径错误', HttpStatus.BAD_REQUEST);
    }
    const projectSign: string = routePathList[2];
    const url: string = `/${routePathList.slice(3).join('/')}`;
    const data = await this.mockService.handlePost(
      bodyData,
      queryData,
      projectSign,
      url,
    );
    res.send(data);
  }

  @Get('*')
  async handleGet(
    @Query() queryData: any,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    // 设置返回头的 Content-Type
    res.type('application/json');

    const routePathList = request.path.split('/').slice(1);
    if (routePathList.length <= 4) {
      throw new HttpException('接口路径错误', HttpStatus.BAD_REQUEST);
    }
    const projectSign: string = routePathList[2];
    const url: string = `/${routePathList.slice(3).join('/')}`;
    const data = await this.mockService.handleGet(queryData, projectSign, url);
    res.send(data);
  }
}
