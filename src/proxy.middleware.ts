import {
  Injectable,
  Inject,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { RedisService } from './redis/redis.service';
import { ProjectService } from './project/project.service';

interface ProxyInfo {
  targetUrl: string;
  projectSign: string;
  headers: { key: string; value: any }[];
}

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private targetUrl = 'http://localhost:4000'; // 目标服务器地址

  @Inject(ProjectService)
  private projectService: ProjectService;

  @Inject(RedisService)
  private redisService: RedisService;

  async use(req: Request, res: Response, next: NextFunction) {
    if (this.isProxy(req)) {
      try {
        const proxyInfo = await this.getProxyInfo(req);

        const proxyMiddleware = createProxyMiddleware({
          target: this.targetUrl,
          changeOrigin: true,
          pathRewrite: function (path) {
            const pathList = path.split('/');
            const realPath = '/' + pathList.slice(3).join('/');
            return realPath;
          },
          on: {
            proxyReq: (proxyReq) => {
              proxyInfo.headers.forEach((item) => {
                proxyReq.setHeader(item.key, item.value);
              });
            },
            // proxyRes: (proxyRes, req, res) => {
            //   // 捕获代理响应的数据并直接发送给客户端
            // },
            error: () => {
              throw new HttpException(
                'Proxy Error',
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            },
          },
        });

        // 使用中间件处理请求
        proxyMiddleware(req, res, (err) => {
          if (err) {
            throw new HttpException('Proxy Error，请检查代理配置', 500);
          }
        });
      } catch (error) {
        throw new HttpException('Proxy Error，请检查代理配置', 500);
      }
    } else {
      next(); // 如果不需要代理，则继续执行下一个中间件或路由处理器
    }
  }

  private isProxy(req: Request): boolean {
    return req.originalUrl.includes('/lanMock/mock/proxy');
  }

  // 获取项目代理信息"
  async getProxyInfo(req: Request): Promise<ProxyInfo> {
    const proxyInfo: ProxyInfo = {
      targetUrl: '',
      projectSign: '',
      headers: [],
    };

    proxyInfo.projectSign = req.originalUrl.split('/')[4];

    const redisKey = `project:${proxyInfo.projectSign}`;

    const redisRes = await this.redisService.hGetAll(redisKey);

    if (redisRes?.targetUrl) {
      proxyInfo.targetUrl = redisRes.targetUrl;
      proxyInfo.headers = JSON.parse(redisRes.headers);
    } else {
      const projectInfo = await this.projectService.getDetailBySign(
        proxyInfo.projectSign,
      );
      const { targetUrl, headers } = JSON.parse(projectInfo.proxyInfo);
      proxyInfo.targetUrl = targetUrl;
      proxyInfo.headers = headers;
      proxyInfo.projectSign = projectInfo.sign;

      const proxyRedis = {
        ...proxyInfo,
        headers: JSON.stringify(headers),
      };

      await this.redisService.hSet(redisKey, proxyRedis, 1000 * 60 * 60 * 12);
    }

    return proxyInfo;
  }
}
