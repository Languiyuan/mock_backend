import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { RequireLogin, UserInfo } from 'src/custom.decorator';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  // 新增项目
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

  // 删除项目
  @Post('delete')
  @RequireLogin()
  async delete(
    @UserInfo('userId') userId: number,
    @Body('projectId') projectId: number,
  ) {
    return await this.projectService.delete(projectId, userId);
  }

  // 获取项目详情
  @Get('detail')
  @RequireLogin()
  async getDetail(
    @Query('projectId') projectId: number,
    @UserInfo('userId') userId: number,
  ) {
    return await this.projectService.getDetail(projectId, userId);
  }

  // 获取用户下所有项目  创建的项目 加入的项目
  @Post('list')
  @RequireLogin()
  async getProjectList(
    @UserInfo('userId') userId: number,
    @Body('type') type: string,
  ) {
    return await this.projectService.getProjectList(type, userId);
  }

  // 添加项目成员
  @Post('addProjectMember')
  @RequireLogin()
  async addProjectMember(
    @Body('projectId') projectId: number,
    @Body('memberId') memberId: number,
  ) {
    return await this.projectService.addProjectMember(projectId, memberId);
  }
}
