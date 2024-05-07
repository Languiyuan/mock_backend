import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProjectDto, EditProjectDto } from './dto/create-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { In, Like, Repository } from 'typeorm';
import { UserProject } from './entities/UserProject.entity';
import { User } from 'src/user/entities/User.entity';
import { Folder } from './entities/Folder.entity';
import { FolderDto } from './dto/Folder.dto';
import { Api } from 'src/api/entities/Api.entity';

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
  // API表
  @InjectRepository(Api)
  private apiRepository: Repository<Api>;

  // 创建项目
  async add(createProjectDto: CreateProjectDto, userId: number) {
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

      // const data = await this.projectRepository.findOneBy({
      //   sign: newProject.sign,
      // });

      const newUserProject = new UserProject();
      newUserProject.userId = userId;
      newUserProject.projectId = projectId;
      newUserProject.isCreateUser = 1;
      this.userProjectRepository.save(newUserProject);

      return '创建成功';
    } catch (error) {
      throw new HttpException('创建失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // 删除项目
  async delete(projectId: number, userId: number) {
    // 查找数据
    const findProject = await this.projectRepository.findOneBy({
      id: projectId,
    });

    if (!findProject) {
      throw new HttpException('该项目不存在', HttpStatus.BAD_REQUEST);
    }

    if (findProject.createUserId !== userId) {
      throw new HttpException(
        '当前用户非创建者无权限删除该项目',
        HttpStatus.BAD_REQUEST,
      );
    }

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
      throw new HttpException('删除失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 编辑项目
  async edit(editProjectDto: EditProjectDto, userId: number) {
    // 查找数据
    const findProject = await this.projectRepository.findOneBy({
      id: editProjectDto.projectId,
    });

    if (!findProject) {
      throw new HttpException('该项目不存在', HttpStatus.BAD_REQUEST);
    }

    if (findProject.createUserId !== userId) {
      throw new HttpException(
        '当前用户非创建者无权限编辑该项目',
        HttpStatus.BAD_REQUEST,
      );
    }

    findProject.baseUrl = editProjectDto.baseUrl;
    findProject.name = editProjectDto.name;
    findProject.description = editProjectDto.description;
    findProject.updateUserId = userId;

    try {
      await this.projectRepository.save(findProject);
      return '编辑成功';
    } catch (error) {
      throw new HttpException('编辑失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 获取项目详情
  async getDetail(projectId: number, userId: number) {
    console.log('userId', userId);
    // 查找数据
    const findProject = await this.projectRepository.findOneBy({
      id: projectId,
    });

    // 判断项目未被删除
    if (findProject && findProject.isDeleted === 0) {
      // 项目创建人
      const findUser = await this.userRepository.findOneBy({
        id: findProject.createUserId,
      });

      const findMembers = await this.userProjectRepository.find({
        where: { projectId: findProject.id, isDeleted: 0 },
      });
      //  项目成员
      let findMembersInfoList = [];
      if (findMembers.length) {
        const userIds = findMembers.map((item) => item.userId);
        findMembersInfoList = await this.userRepository
          .createQueryBuilder('user')
          .select(['user.id', 'user.username'])
          .where('user.id IN (:...userIds)', { userIds })
          .getMany();
      }
      const members = findMembersInfoList.map((item) => {
        return {
          ...item,
          isCreateUesr: item.id === findProject.createUserId,
        };
      });

      return {
        ...findProject,
        createUsername: findUser.username,
        members: members,
      };
      // if (findProject.createUserId === userId) {

      // } else {
      //   throw new HttpException(
      //     '该项目当前账号无权查看',
      //     HttpStatus.BAD_REQUEST,
      //   );
      // }
    } else {
      throw new HttpException('项目不存在', HttpStatus.BAD_REQUEST);
    }
  }

  // 管理员 获取所有项目
  async getAllProject(name: string, pageNo: number, pageSize: number) {
    if (!pageNo || !pageSize) {
      throw new HttpException('请校验传参', HttpStatus.BAD_REQUEST);
    }

    const skipCount = (pageNo - 1) * pageSize;

    const condition: Record<string, any> = {};

    if (name) {
      condition.name = Like(`%${name}%`);
    }

    const [findList, totalCount] = await this.projectRepository.findAndCount({
      where: condition,
      order: {
        id: 'DESC', // 按 id 降序排序
      },
      take: pageSize, // 指定查询数量
      skip: skipCount, // 指定跳过的记录数量
    });

    return { list: findList, total: totalCount, pageNo, pageSize };
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
          order: {
            createTime: 'DESC', // 根据 updateTime 字段倒序排列
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
          order: {
            createTime: 'DESC', // 根据 updateTime 字段倒序排列
          },
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
          order: {
            createTime: 'DESC', // 根据 updateTime 字段倒序排列
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
    if (findMembers.length) {
      const userIds = findMembers.map((item) => item.userId);
      const findUsers = await this.userRepository.find({
        where: { id: In(userIds) },
      });

      const members = findMembers.map((item) => {
        const data = findUsers.find((user) => user.id === item.userId);
        return {
          ...item,
          username: data.username,
        };
      });

      return members;
    }
    return [];
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

        return { msg: '创建目录成功', id: sameFolder.id };
      }
    }

    const newFolder = new Folder();
    newFolder.name = folderDto.folderName;
    newFolder.projectId = folderDto.projectId;
    newFolder.createUserId = userId;
    newFolder.updateUserId = userId;

    await this.folderRepository.save(newFolder);
    const findNewFolder = await this.folderRepository.find({
      where: {
        name: folderDto.folderName,
        projectId: folderDto.projectId,
      },
    });

    return { msg: '创建目录成功', id: findNewFolder[0].id };
  }

  // 删除项目目录
  async removeFolder(userId: number, id: number) {
    const findFolder = await this.folderRepository.findOneBy({ id });
    findFolder.isDeleted = 1;
    findFolder.updateUserId = userId;

    await this.folderRepository.save(findFolder);

    const findApiIds = await this.apiRepository.find({
      select: ['id'],
      where: { folderId: id },
    });

    if (findApiIds.length) {
      const ids = findApiIds.map((item) => item.id);
      await this.apiRepository
        .createQueryBuilder()
        .update(Api) // 指定要更新的实体类
        .set({ folderId: null, updateUserId: userId }) // 设置要更新的属性
        .whereInIds(ids) // 根据指定的 id 列表进行更新
        .execute(); // 执行更新操作;
    }

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
        isDeleted: 0,
      },
    });

    return findFolderList;
  }
}
