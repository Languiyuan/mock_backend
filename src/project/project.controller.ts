import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { RequireLogin, UserInfo } from 'src/custom.decorator';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('add')
  @RequireLogin()
  async add(
    @UserInfo('userId') userId: number,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    console.log('userId', userId);
    console.log('createProjectDto', createProjectDto);

    return await this.projectService.add(createProjectDto, userId);
  }

  @Post('delete')
  @RequireLogin()
  async delete(
    @UserInfo('userId') userId: number,
    @Body('projectId') projectId: number,
  ) {
    console.log('userId', userId);
    console.log('projectId', projectId);

    return await this.projectService.delete(projectId, userId);
  }

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(+id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectService.remove(+id);
  }
}
