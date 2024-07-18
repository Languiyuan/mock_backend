import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Api } from './entities/Api.entity';
import { UserProject } from 'src/project/entities/UserProject.entity';
import { ApiHistory } from './entities/ApiHistory.entity';
import { Project } from '../project/entities/Project.entity';
import { HttpModule } from '@nestjs/axios';
import { ProjectModule } from 'src/project/project.module';
@Module({
  imports: [
    HttpModule,
    ProjectModule,
    TypeOrmModule.forFeature([Api, UserProject, ApiHistory, Project]),
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
