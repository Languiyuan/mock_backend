import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto, EditProjectDto } from './dto/create-project.dto';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { FolderDto } from './dto/Folder.dto';

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

  // 编辑项目
  @Post('edit')
  @RequireLogin()
  async edit(
    @UserInfo('userId') userId: number,
    @Body() editProjectDto: EditProjectDto,
  ) {
    return await this.projectService.edit(editProjectDto, userId);
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

  // 删除项目成员
  @Post('removeProjectMember')
  @RequireLogin()
  async removeProjectMember(
    @Body('projectId') projectId: number,
    @Body('memberId') memberId: number,
    @UserInfo('userId') userId: number,
    @UserInfo('isAdmin') isAdmin: boolean,
  ) {
    return await this.projectService.removeProjectMember(
      projectId,
      memberId,
      userId,
      isAdmin,
    );
  }

  // 查询项目成员
  @Post('queryMembers')
  @RequireLogin()
  async queryMembers(@Body('projectId') projectId: number) {
    return await this.projectService.queryMembers(projectId);
  }

  // 添加目录
  @Post('addFolder')
  @RequireLogin()
  async addFolder(
    @UserInfo('userId') userId: number,
    @Body() folderDto: FolderDto,
  ) {
    return await this.projectService.addFolder(userId, folderDto);
  }

  // 删除目录
  @Post('removeFolder')
  @RequireLogin()
  async removeFolder(
    @UserInfo('userId') userId: number,
    @Body('id') id: number,
  ) {
    return await this.projectService.removeFolder(userId, id);
  }

  // 编辑项目目录名字
  @Post('editFolder')
  @RequireLogin()
  async editFolder(
    @UserInfo('userId') userId: number,
    @Body('id') id: number,
    @Body('folderName') folderName: string,
  ) {
    return await this.projectService.editFolder(userId, id, folderName);
  }

  // 查询项目目录
  @Post('queryFolderList')
  @RequireLogin()
  async queryFolderList(@Body('projectId') projectId: number) {
    return await this.projectService.queryFolderList(projectId);
  }

  // 项目代理配置
  @Post('proxyConfig')
  @RequireLogin()
  async proxyConfig(
    @UserInfo('userId') userId: number,
    @Body('projectId') projectId: number,
    @Body('proxyInfo') proxyInfo: string,
  ) {
    return await this.projectService.proxyConfig(userId, projectId, proxyInfo);
  }
}
