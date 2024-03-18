import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Api } from './entities/Api.entity';
import { UserProject } from 'src/project/entities/UserProject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Api, UserProject])],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
