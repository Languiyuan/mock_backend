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
import { createProxyMiddleware } from 'http-proxy-middleware';

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

  // @Get('*')
  // async handleGet(
  //   @Query() queryData: any,
  //   @Req() request: Request,
  //   @Res() res: Response,
  // ) {
  //   // 设置返回头的 Content-Type
  //   res.type('application/json');

  //   const routePathList = request.path.split('/').slice(1);
  //   if (routePathList.length <= 4) {
  //     throw new HttpException('接口路径错误', HttpStatus.BAD_REQUEST);
  //   }
  //   const projectSign: string = routePathList[2];
  //   const url: string = `/${routePathList.slice(3).join('/')}`;
  //   const data = await this.mockService.handleGet(queryData, projectSign, url);
  //   res.send(data);
  // }

  private targetUrl = 'http://localhost:4000'; // 目标服务器地址

  @Get('test')
  async handleRequest(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (this.shouldProxy(req)) {
      const proxyMiddleware = createProxyMiddleware({
        target: this.targetUrl,
        changeOrigin: true,
        pathRewrite: { '^/lanMock/mock/test': '/test' },
        on: {
          proxyReq: (proxyReq, req) => {
            const cookie =
              'session_id=12345; domain=.example.org; path=/; secure; HttpOnly';
            proxyReq.setHeader('Cookie', cookie);
            proxyReq.setHeader('X-Custom-Header', 'customHeaderValue');
            console.log(
              `Proxying request to ${proxyReq.getHeader('host')}`,
              req,
            );
          },
          proxyRes: (proxyRes, req, res) => {
            console.log(
              `Received response with status code: ${proxyRes.statusCode}`,
              req,
              res,
            );
            // 可以在此处修改响应头
          },
          error: (err) => {
            console.error('Proxy error:', err);
            // res.status(500).send('Something broke!');
          },
        },
      });

      return new Promise((resolve, reject) => {
        proxyMiddleware(req, res, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } else {
      res.send('This is a normal endpoint.');
    }
  }

  private shouldProxy(req: Request): boolean {
    return req.query.proxy === 'true';
  }
}
