import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { In, Repository } from 'typeorm';
import { UserProject } from './entities/UserProject.entity';
import { User } from 'src/user/entities/User.entity';
import { Folder } from './entities/Folder.entity';
import { FolderDto } from './dto/Folder.dto';

@Injectable()
export class ProjectService {
  // 项目表
  @InjectRepository(Project)
  private projectRepository: Repository<Project>;
  // 项目用户关系表
  @InjectRepository(UserProject)
  private userProjectRepository: Repository<UserProject>;
  // 用户表
  @InjectRepository(User)
  private userRepository: Repository<User>;
  // 项目目录表
  @InjectRepository(Folder)
  private folderRepository: Repository<Folder>;

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
      newUserProject.isCreateUser = 1;
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

    const userPorjectList = await this.userProjectRepository.find({
      where: { projectId },
    });

    userPorjectList.forEach((item) => (item.isDeleted = 1));

    try {
      await this.projectRepository.save(findProject);
      await this.userProjectRepository.save(userPorjectList);
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
      const allFindUserProjectList = await this.userProjectRepository.find({
        where: { userId, isDeleted: 0 },
      });
      if (!allFindUserProjectList) return [];

      const projectIdList = allFindUserProjectList.map(
        (item) => item.projectId,
      );

      const findProjectList: Array<CreateProjectDto> | null =
        await this.projectRepository.find({
          where: {
            id: In(projectIdList),
          },
        });

      if (findProjectList) {
        return findProjectList;
      } else {
        return [];
      }
    } else if (type === 'create') {
      const findProjectList: Array<CreateProjectDto> | null =
        await this.projectRepository.find({
          where: { createUserId: userId, isDeleted: 0 },
        });

      if (findProjectList) {
        return findProjectList;
      } else {
        return [];
      }
    } else if (type === 'join') {
      const allFindUserProjectList = await this.userProjectRepository.find({
        where: { userId, isDeleted: 0, isCreateUser: 0 },
      });
      if (!allFindUserProjectList) return [];

      const projectIdList = allFindUserProjectList.map(
        (item) => item.projectId,
      );

      const findProjectList: Array<CreateProjectDto> | null =
        await this.projectRepository.find({
          where: {
            id: In(projectIdList),
          },
        });

      if (findProjectList) {
        return findProjectList;
      } else {
        return [];
      }
    }
  }

  // 添加项目成员
  async addProjectMember(projectId: number, memberId: number) {
    try {
      // 判断项目和成员是否存在
      const findProject = await this.projectRepository.findOneBy({
        id: projectId,
      });
      if (!findProject) {
        throw new HttpException('该项目不存在', HttpStatus.BAD_REQUEST);
      }

      const findMember = await this.userRepository.findOneBy({ id: memberId });
      if (!findMember) {
        throw new HttpException('该成员不存在', HttpStatus.BAD_REQUEST);
      }

      // 先去查有没有这个数据 可能是被删除的 isDeleted = 1
      const findUserProject = await this.userProjectRepository.findOneBy({
        userId: memberId,
        projectId,
      });

      if (findUserProject) {
        if (findUserProject.isDeleted) {
          findUserProject.isDeleted = 0;
          this.userProjectRepository.save(findUserProject);
          return '添加成功';
        } else {
          return '该成员已在项目组中';
        }
      } else {
        const newUserProject = new UserProject();
        newUserProject.projectId = projectId;
        newUserProject.userId = memberId;
        newUserProject.isCreateUser = 0;
        this.userProjectRepository.save(newUserProject);
        return '添加成功';
      }
    } catch (error) {
      throw new HttpException(
        error.message || '添加项目成员失败',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 删除项目成员
  async removeProjectMember(
    projectId: number,
    memberId: number,
    userId: number,
  ) {
    // 需要判断 当前用户是否是项目创建者，是否有权限
    const findUserProject = await this.userProjectRepository.findOneBy({
      userId,
      projectId,
    });

    if (findUserProject.isCreateUser === 0) {
      throw new HttpException(
        '当前用户非项目创建者, 无删除权限',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const findMemberIdProject = await this.userProjectRepository.findOneBy({
      userId: memberId,
      projectId,
    });

    if (findMemberIdProject && findMemberIdProject?.isDeleted === 0) {
      findMemberIdProject.isDeleted = 1;
      await this.userProjectRepository.save(findMemberIdProject);
      return '删除成功';
    } else {
      throw new HttpException('该成员不是项目成员', HttpStatus.BAD_REQUEST);
    }
  }

  // 查询项目成员包含项目创建者
  async queryMembers(projectId: number) {
    const findMembers = await this.userProjectRepository.find({
      where: { projectId, isDeleted: 0 },
    });
    return findMembers;
  }

  // 添加项目目录
  async addFolder(userId: number, folderDto: FolderDto) {
    // 是否有权限 前端限制
    const findFolderList = await this.folderRepository.find({
      where: {
        projectId: folderDto.projectId,
      },
    });

    if (findFolderList && findFolderList.length) {
      const sameFolder = findFolderList.find(
        (item) => item.name === folderDto.folderName,
      );

      if (sameFolder && !sameFolder.isDeleted) {
        throw new HttpException('已存在同名目录', HttpStatus.BAD_REQUEST);
      }
      // 如果添加目录曾经被删除
      if (sameFolder && sameFolder.isDeleted) {
        sameFolder.isDeleted = 0;
        sameFolder.createUserId = userId;
        sameFolder.updateUserId = userId;
        await this.folderRepository.save(sameFolder);
        return '创建目录成功';
      }
    }

    const newFolder = new Folder();
    newFolder.name = folderDto.folderName;
    newFolder.projectId = folderDto.projectId;
    newFolder.createUserId = userId;
    newFolder.updateUserId = userId;

    await this.folderRepository.save(newFolder);
    return '创建目录成功';
  }

  // 删除项目目录
  async removeFolder(userId: number, id: number) {
    const findFolder = await this.folderRepository.findOneBy({ id });
    findFolder.isDeleted = 1;
    findFolder.updateUserId = userId;

    await this.folderRepository.save(findFolder);
    // TODO 删除api中的目录项目key
    return '删除目录成功';
  }

  // 编辑项目目录名字
  async editFolder(userId: number, id: number, folderName: string) {
    const findFolder = await this.folderRepository.findOneBy({ id });
    findFolder.name = folderName;
    findFolder.updateUserId = userId;

    await this.folderRepository.save(findFolder);
    return '修改项目名称成功';
  }

  // 查询所有该项目目录
  async queryFolderList(projectId: number) {
    const findFolderList = await this.folderRepository.find({
      where: {
        projectId,
      },
    });

    return findFolderList;
  }
}
