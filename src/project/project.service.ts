import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { UserProject } from './entities/UserProject.entity';

@Injectable()
export class ProjectService {
  // 项目表
  @InjectRepository(Project)
  private projectRepository: Repository<Project>;
  // 项目用户关系表
  @InjectRepository(UserProject)
  private userProjectRepository: Repository<UserProject>;

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

      // 添加关系表
      const { id: projectId } = await this.projectRepository
        .createQueryBuilder('')
        .select(['id'])
        .where('sign = :sign', { sign: newProject.sign })
        .getRawOne();
      console.log('projectId---', projectId);

      const data = await this.projectRepository.findOneBy({
        sign: newProject.sign,
      });
      console.log('data', data);

      const newUserProject = new UserProject();
      newUserProject.userId = userId;
      newUserProject.projectId = projectId;
      this.userProjectRepository.save(newUserProject);

      return '注册成功';
    } catch (error) {
      return '注册失败';
    }
  }
  // 删除项目
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

  // 获取项目详情
  async getDetail(projectId: number, userId: number) {
    // 查找数据
    const findProject = await this.projectRepository.findOneBy({
      id: projectId,
    });

    // 判断项目未被删除
    if (findProject && findProject.isDeleted === 0) {
      // 后续加上 加入项目的人
      if (findProject.createUserId === userId) {
        return findProject;
      } else {
        throw new HttpException(
          '该项目当前账号无权查看',
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      return '项目不存在';
    }
  }

  // 获取当前用户 所有项目 all || 创建的项目 create || 加入的项目 join
  async getProjectList(type: string, userId: number) {
    if (type === 'all') {
      const findProjectList: Array<CreateProjectDto> | null =
        await this.projectRepository.find({
          where: { createUserId: userId },
        });

      if (findProjectList) {
        return findProjectList;
      } else {
        return [];
      }
    } else if (type === 'create') {
      const findProjectList: Array<CreateProjectDto> | null =
        await this.projectRepository.find({
          where: { createUserId: userId },
        });

      if (findProjectList) {
        return findProjectList;
      } else {
        return [];
      }
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
