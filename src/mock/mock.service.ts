import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Api } from 'src/api/entities/Api.entity';
import { Repository } from 'typeorm';
import { mock } from 'mockjs';
import { Project } from 'src/project/entities/Project.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MockService {
  @InjectRepository(Api)
  private apiRepository: Repository<Api>;

  @InjectRepository(Project)
  private projectRepository: Repository<Project>;

  @Inject(RedisService)
  private redisService: RedisService;

  async handlePost(projectSign: string, url: string) {
    const apiUrl = await this.initMatch(projectSign, url);

    const findMockRuleList = await this.apiRepository.find({
      select: ['mockRule', 'method'],
      where: { projectSign, url: apiUrl, isDeleted: 0, on: 1 },
    });
    if (findMockRuleList.length) {
      if (!(findMockRuleList[0].method === 'POST')) {
        throw new HttpException('error, 检查请求方法', HttpStatus.BAD_REQUEST);
      }

      const mockRule = findMockRuleList[0].mockRule;
      const res: any = mock(JSON.parse(JSON.parse(mockRule)));

      return res;
    } else {
      throw new HttpException(
        '接口路径错误:检查路径和请求方法并确认接口是否开启',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async handleGet(projectSign: string, url: string) {
    // 读 redis 获取到了就不走mysql了
    const redisKey = `/${projectSign}${url}`;
    const redisRes = await this.redisService.get(redisKey);
    if (redisRes) {
      const data = JSON.parse(JSON.parse(redisRes));
      const res: any = mock(data);
      return res;
    }

    const apiUrl = await this.initMatch(projectSign, url);

    const findMockRuleList = await this.apiRepository.find({
      select: ['mockRule', 'method'],
      where: { projectSign, url: apiUrl, isDeleted: 0, on: 1 },
    });

    if (findMockRuleList.length) {
      if (!(findMockRuleList[0].method === 'GET')) {
        throw new HttpException('Error, 检查请求方法', HttpStatus.BAD_REQUEST);
      }

      const mockRule = findMockRuleList[0].mockRule;
      const data = JSON.parse(JSON.parse(mockRule));
      const res: any = mock(data);

      // 存 redis
      await this.redisService.set(redisKey, mockRule, 60 * 60 * 12);

      return res;
    } else {
      throw new HttpException(
        '接口路径错误,检查路径和请求方法并确认接口是否开启',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async initMatch(projectSign: string, url: string) {
    // 获取baseUrl
    const findProject = await this.projectRepository.findOneBy({
      sign: projectSign,
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
}
