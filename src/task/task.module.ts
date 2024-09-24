import { Module } from '@nestjs/common';
import { TasksService } from './task.service';
import { MockModule } from 'src/mock/mock.module';

@Module({
  imports: [MockModule],
  providers: [TasksService],
})
export class TaskModule {}
