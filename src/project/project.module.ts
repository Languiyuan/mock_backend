import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Folder } from './entities/Folder.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Folder])],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
