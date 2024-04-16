import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Api } from 'src/api/entities/Api.entity';
import { Repository } from 'typeorm';
import { mock } from 'mockjs';

@Injectable()
export class MockService {
  @InjectRepository(Api)
  private apiRepository: Repository<Api>;

  async handlePost(projectSign: string, url: string) {
    const findMockRuleList = await this.apiRepository.find({
      select: ['mockRule', 'method'],
      where: { projectSign, url },
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
        '接口路径错误,检查路径和请求方法',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async handleGet(projectSign: string, url: string) {
    const findMockRuleList = await this.apiRepository.find({
      select: ['mockRule', 'method'],
      where: { projectSign, url },
    });

    if (findMockRuleList.length) {
      if (!(findMockRuleList[0].method === 'GET')) {
        throw new HttpException('Error, 检查请求方法', HttpStatus.BAD_REQUEST);
      }

      const mockRule = findMockRuleList[0].mockRule;
      const data = JSON.parse(JSON.parse(mockRule));
      const res: any = mock(data);

      return res;
    } else {
      throw new HttpException(
        '接口路径错误,检查路径和请求方法',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
