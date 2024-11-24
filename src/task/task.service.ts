import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MockService } from 'src/mock/mock.service';

@Injectable()
export class TasksService {
  @Inject(MockService)
  private mockService: MockService;

  // 每天4点执行统计接口调用次数
  @Cron('0 4 * * *')
  async CountAllCallNumber() {
    await this.mockService.flushRedisToDB();
  }

  // 清空上传文件夹
}
