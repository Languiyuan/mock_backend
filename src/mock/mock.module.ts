import { Module } from '@nestjs/common';
import { MockService } from './mock.service';
import { MockController } from './mock.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Api } from 'src/api/entities/Api.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Api])],
  controllers: [MockController],
  providers: [MockService],
})
export class MockModule {}
