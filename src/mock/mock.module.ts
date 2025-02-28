import { Module } from '@nestjs/common';
import { MockService } from './mock.service';
import { MockController } from './mock.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Api } from 'src/api/entities/Api.entity';
import { Project } from 'src/project/entities/Project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Api, Project])],
  controllers: [MockController],
  providers: [MockService],
  exports: [MockService],
})
export class MockModule {}
