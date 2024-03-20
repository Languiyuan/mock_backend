import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Api } from 'src/api/entities/Api.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MockService {
  @InjectRepository(Api)
  private apiRepository: Repository<Api>;

  async handlePost(projectSign: string, url: string) {
    const findMockRuleList = await this.apiRepository.find({
      select: ['mockRule'],
      where: { projectSign, url },
    });
    if (findMockRuleList.length) {
      const mockRule = findMockRuleList[0].mockRule;
      return mockRule;
    } else {
      throw new HttpException(
        '接口路径错误,检查路径和请求方法',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
