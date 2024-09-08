import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Api } from 'src/api/entities/Api.entity';
import { Repository } from 'typeorm';
import { mock } from 'mockjs';
import { Project } from 'src/project/entities/Project.entity';
import { RedisService } from '../redis/redis.service';
import { getType } from 'src/utils';

interface Params {
  name: string;
  type: string;
  required: boolean;
  deliverWay: string;
}
interface ParamsMap {
  bodyParamsType: string;
  bodyParams: Params[];
  queryParams: Params[];
}

interface ApiRedis {
  mockRule: string;
  paramsCheckOn: number;
  params: string;
  method: string;
}
@Injectable()
export class MockService {
  @InjectRepository(Api)
  private apiRepository: Repository<Api>;

  @InjectRepository(Project)
  private projectRepository: Repository<Project>;

  @Inject(RedisService)
  private redisService: RedisService;

  async handlePost(body, query, projectSign: string, url: string) {
    // 读 redis 获取到了就不走mysql了
    const redisKey = `/${projectSign}${url}`;
    const redisRes: ApiRedis | Record<string, any> =
      await this.redisService.hGetAll(redisKey);
    if (redisRes?.mockRule) {
      if (!(redisRes.method === 'POST')) {
        throw new HttpException('Error, 检查请求方法', HttpStatus.BAD_REQUEST);
      }

      redisRes.paramsCheckOn &&
        redisRes.params &&
        this.validateParams(query, body, JSON.parse(redisRes.params));
      const data = JSON.parse(redisRes.mockRule);
      const res: any = mock(data);
      return res;
    }

    const apiUrl = await this.initMatch(projectSign, url);

    const findMockRuleList = await this.apiRepository.find({
      select: ['mockRule', 'method', 'paramsCheckOn', 'params'],
      where: { projectSign, url: apiUrl, isDeleted: 0, on: 1 },
    });
    if (findMockRuleList.length) {
      if (!(findMockRuleList[0].method === 'POST')) {
        throw new HttpException('error, 检查请求方法', HttpStatus.BAD_REQUEST);
      }

      // 存 redis 12 hours 过期
      const dataToRedis = {
        mockRule: findMockRuleList[0].mockRule,
        paramsCheckOn: findMockRuleList[0].paramsCheckOn,
        params: findMockRuleList[0].params,
        method: findMockRuleList[0].method,
      };
      await this.redisService.hSet(redisKey, dataToRedis, 1000 * 60 * 60 * 12);

      // 参数校验
      const paramsCheckOn = findMockRuleList[0].paramsCheckOn;
      if (paramsCheckOn && findMockRuleList[0].params) {
        this.validateParams(
          query,
          body,
          JSON.parse(findMockRuleList[0].params),
        );
      }

      const mockRule = findMockRuleList[0].mockRule;
      const firstParseData = JSON.parse(mockRule);
      const res: any = mock(firstParseData);

      return res;
    } else {
      throw new HttpException(
        '接口路径错误:检查路径和请求方法并确认接口是否开启',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async handleGet(query, projectSign: string, url: string) {
    // 读 redis 获取到了就不走mysql了
    const redisKey = `/${projectSign}${url}`;
    const redisRes: ApiRedis | Record<string, any> =
      await this.redisService.hGetAll(redisKey);
    if (redisRes?.mockRule) {
      if (!(redisRes.method === 'GET')) {
        throw new HttpException('Error, 检查请求方法', HttpStatus.BAD_REQUEST);
      }

      redisRes.paramsCheckOn &&
        redisRes.params &&
        this.validateParams(query, null, JSON.parse(redisRes.params));
      const data = JSON.parse(redisRes.mockRule);
      const res: any = mock(data);
      return res;
    }

    const apiUrl = await this.initMatch(projectSign, url);

    const findMockRuleList = await this.apiRepository.find({
      select: ['mockRule', 'method', 'paramsCheckOn', 'params'],
      where: { projectSign, url: apiUrl, isDeleted: 0, on: 1 },
    });

    if (findMockRuleList.length) {
      if (!(findMockRuleList[0].method === 'GET')) {
        throw new HttpException('Error, 检查请求方法', HttpStatus.BAD_REQUEST);
      }

      // 存 redis 12 hours 过期
      const dataToRedis = {
        mockRule: findMockRuleList[0].mockRule,
        paramsCheckOn: findMockRuleList[0].paramsCheckOn,
        params: findMockRuleList[0].params,
        method: findMockRuleList[0].method,
      };
      await this.redisService.hSet(redisKey, dataToRedis, 1000 * 60 * 60 * 12);

      // 参数校验
      const paramsCheckOn = findMockRuleList[0].paramsCheckOn;
      paramsCheckOn &&
        findMockRuleList[0].params &&
        this.validateParams(
          query,
          null,
          JSON.parse(findMockRuleList[0].params),
        );

      // swagger导入的 不用解析两层
      const mockRule = findMockRuleList[0].mockRule;
      const firstParseData = JSON.parse(mockRule);
      const res: any = mock(firstParseData);

      return res;
    } else {
      throw new HttpException(
        '接口路径错误,检查路径和请求方法并确认接口是否开启',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 初始化匹配
  async initMatch(projectSign: string, url: string) {
    // 获取baseUrl
    const findProject = await this.projectRepository.findOneBy({
      sign: projectSign,
      isDeleted: 0,
    });

    if (!findProject) {
      throw new HttpException('项目不存在,请检查路径', HttpStatus.BAD_REQUEST);
    }
    let apiUrl: string = '';
    if (url.includes(findProject.baseUrl)) {
      apiUrl = url.replace(findProject.baseUrl, '');
    } else {
      throw new HttpException('baseUrl错误,请检查路径', HttpStatus.BAD_REQUEST);
    }
    return apiUrl;
  }

  // 传参校验
  validateParams(query, body, paramsJson) {
    const paramsError = [];
    const paramsMap: ParamsMap = paramsJson;

    paramsMap.queryParams.length &&
      paramsMap.queryParams.forEach((item) => {
        if (item.required && !query.hasOwnProperty(item.name)) {
          paramsError.push(`query参数${item.name}缺失`);
          return; // 如果是必需且不存在，则直接返回，不需要继续检查类型
        }

        if (query.hasOwnProperty(item.name)) {
          const type = getType(query[item.name]);
          if (!item.type.includes(type)) {
            paramsError.push(`query参数${item.name}类型错误应为${item.type}`);
          }
        }
      });

    if (body) {
      if (paramsMap.bodyParamsType === 'array' && getType(body) !== 'array') {
        paramsError.push(`body参数类型错误应为数组`);
      }

      if (paramsMap.bodyParamsType === 'object') {
        if (getType(body) !== 'object') {
          paramsError.push(`body参数类型错误应为object`);
        } else {
          paramsMap.bodyParams.length &&
            paramsMap.bodyParams.forEach((item: Params) => {
              if (body.hasOwnProperty(item.name)) {
                const type = getType(body[item.name]);
                if (!item.type.includes(type)) {
                  paramsError.push(
                    `body参数${item.name}类型错误应为${item.type}`,
                  );
                }
              } else if (item.required) {
                paramsError.push(`body参数${item.name}缺失`);
              }
            });
        }
      }
    }

    if (paramsError.length) {
      throw new HttpException(paramsError.join(';'), HttpStatus.BAD_REQUEST);
    }
  }
}
