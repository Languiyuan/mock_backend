import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Folder } from './entities/Folder.entity';
import { UserProject } from './entities/UserProject.entity';
import { User } from 'src/user/entities/User.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Folder, UserProject, User])],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
