import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProjectService {
  @InjectRepository(Project)
  private projectRepository: Repository<Project>;
  // 创建项目
  async add(createProjectDto: CreateProjectDto, userId: number) {
    console.log(createProjectDto);
    console.log('userId', userId);

    function generateRandomString(length: number) {
      const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length),
        );
      }
      return result;
    }

    const newProject = new Project();
    newProject.name = createProjectDto.name;
    newProject.baseUrl = createProjectDto.baseUrl;
    newProject.description = createProjectDto.description;
    newProject.createUserId = userId;
    newProject.sign = generateRandomString(20);
    newProject.updateUserId = userId;

    try {
      await this.projectRepository.save(newProject);
      return '注册成功';
    } catch (error) {
      return '注册失败';
    }
  }

  async delete(projectId: number, userId: number) {
    // 查找数据
    const findProject = await this.projectRepository.findOneBy({
      id: projectId,
    });

    if (!findProject) return '项目不存在';

    findProject.isDeleted = 1;
    findProject.updateUserId = userId;

    console.log('findProject', findProject);

    try {
      await this.projectRepository.save(findProject);
      return '删除成功';
    } catch (error) {
      return '删除失败';
    }
  }

  findAll() {
    return `This action returns all project`;
  }

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  remove(id: number) {
    return `This action removes a #${id} project`;
  }
}
