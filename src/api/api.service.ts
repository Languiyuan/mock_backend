import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ApiDto } from './dto/api.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Api } from './entities/Api.entity';
import { Like, Repository } from 'typeorm';
import { UserProject } from 'src/project/entities/UserProject.entity';
import { ApiHistory } from './entities/ApiHistory.entity';
import { Project } from 'src/project/entities/project.entity';

@Injectable()
export class ApiService {
  // apiRespository
  @InjectRepository(Api)
  private apiRespository: Repository<Api>;
  // 项目成员表
  @InjectRepository(UserProject)
  private userProjectRespository: Repository<UserProject>;
  // api history respository
  @InjectRepository(ApiHistory)
  private apiHistoryRepository: Repository<ApiHistory>;
  // 项目表
  @InjectRepository(Project)
  private projectRepository: Repository<Project>;

  // 添加接口
  async addApi(userId: number, apiDto: ApiDto) {
    // 判断是否已经存在一样的url
    const findApiByUrl = await this.apiRespository.findOneBy({
      url: apiDto.url,
    });

    if (findApiByUrl) {
      throw new HttpException('添加失败,url不能重复', HttpStatus.BAD_REQUEST);
    }
    // 查project sign
    const project = await this.projectRepository.findOneBy({
      id: apiDto.projectId,
    });
    if (!project) {
      throw new HttpException(
        '添加失败,projectId error',
        HttpStatus.BAD_REQUEST,
      );
    }

    const newApi = new Api();
    newApi.projectSign = project.sign;
    newApi.projectId = apiDto.projectId;
    newApi.folderId = apiDto.folderId;
    newApi.name = apiDto.name;
    newApi.url = apiDto.url;
    newApi.mockRule = apiDto.mockRule;
    newApi.method = apiDto.method;
    newApi.delay = apiDto.delay;
    newApi.description = apiDto.description;
    newApi.on = apiDto.on;
    newApi.createUserId = userId;
    newApi.updateUserId = userId;

    await this.apiRespository.save(newApi);

    // 添加到历史记录中
    const findApi = await this.apiRespository.findOneBy({
      projectId: apiDto.projectId,
      url: apiDto.url,
    });
    if (findApi) {
      const newApiHistory = new ApiHistory();
      newApiHistory.operateType = '新增';
      newApiHistory.apiId = findApi.id;
      newApiHistory.projectSign = project.sign;
      newApiHistory.projectId = apiDto.projectId;
      newApiHistory.folderId = apiDto.folderId;
      newApiHistory.name = apiDto.name;
      newApiHistory.url = apiDto.url;
      newApiHistory.mockRule = apiDto.mockRule;
      newApiHistory.method = apiDto.method;
      newApiHistory.delay = apiDto.delay;
      newApiHistory.description = apiDto.description;
      newApiHistory.on = apiDto.on;
      newApiHistory.createUserId = userId;
      newApiHistory.updateUserId = userId;
      await this.apiHistoryRepository.save(newApiHistory);
    }
    return '添加成功';
  }

  // 删除接口
  async removeApi(userId: number, id: number, projectId: number) {
    // 判断用户是否有权限 是否是项目成员
    const findMember = await this.userProjectRespository.findOneBy({
      userId,
      projectId,
    });

    if (findMember) {
      const findApi = await this.apiRespository.findOneBy({ id, projectId });
      if (findApi) {
        findApi.isDeleted = 1;
        findApi.updateUserId = userId;
        await this.apiRespository.save(findApi);
        return '删除成功';
      } else {
        throw new HttpException('api不存在', HttpStatus.BAD_REQUEST);
      }
    } else {
      throw new HttpException(
        '项目不存在或无权限操作。',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async batchRemoveApi(userId: number, ids: number[], projectId: number) {
    // 判断用户是否有权限 是否是项目成员
    const findMember = await this.userProjectRespository.findOneBy({
      userId,
      projectId,
    });

    if (findMember) {
      try {
        await this.apiRespository
          .createQueryBuilder()
          .update(Api) // 指定要更新的实体类
          .set({ isDeleted: 1, updateUserId: userId }) // 设置要更新的属性
          .whereInIds(ids) // 根据指定的 id 列表进行更新
          .execute(); // 执行更新操作;

        return '删除成功';
      } catch (error) {
        throw new HttpException('删除失败', HttpStatus.BAD_REQUEST);
      }
    } else {
      throw new HttpException(
        '项目不存在或无权限操作。',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 编辑接口
  async editApi(userId: number, apiDto: ApiDto) {
    // 判断用户是否有权限 是否是项目成员
    const findMember = await this.userProjectRespository.findOneBy({
      userId,
      projectId: apiDto.projectId,
    });

    if (findMember) {
      const findApi = await this.apiRespository.findOneBy({
        id: apiDto.id,
        projectId: apiDto.projectId,
      });

      // 如果mockRule 修改
      if (findApi.mockRule !== apiDto.mockRule) {
        // 查所有历史记录数量
        const historyQueryBuilder = this.apiHistoryRepository
          .createQueryBuilder()
          .where('apiId = :apiId', { apiId: findApi.id });

        const historyCount = await historyQueryBuilder.getCount();
        // 限制数量5条
        if (historyCount >= 5) {
          const findLastHistory = await historyQueryBuilder
            .orderBy('id', 'ASC')
            .getOne();

          await this.apiHistoryRepository.delete(findLastHistory.id);
        }

        const newApiHistory = new ApiHistory();
        newApiHistory.operateType = '修改';
        newApiHistory.apiId = findApi.id;
        newApiHistory.projectSign = findApi.projectSign;
        newApiHistory.projectId = apiDto.projectId;
        newApiHistory.folderId = apiDto.folderId;
        newApiHistory.name = apiDto.name;
        newApiHistory.url = apiDto.url;
        newApiHistory.mockRule = apiDto.mockRule;
        newApiHistory.method = apiDto.method;
        newApiHistory.delay = apiDto.delay;
        newApiHistory.description = apiDto.description;
        newApiHistory.on = apiDto.on;
        newApiHistory.createUserId = userId;
        newApiHistory.updateUserId = userId;
        await this.apiHistoryRepository.save(newApiHistory);
      }

      if (findApi) {
        findApi.folderId = apiDto.folderId;
        findApi.name = apiDto.name;
        findApi.url = apiDto.url;
        findApi.mockRule = apiDto.mockRule;
        findApi.method = apiDto.method;
        findApi.delay = apiDto.delay;
        findApi.description = apiDto.description;
        findApi.on = apiDto.on;
        findApi.updateUserId = userId;

        await this.apiRespository.save(findApi);

        return '编辑成功';
      } else {
        throw new HttpException('api不存在', HttpStatus.BAD_REQUEST);
      }
    } else {
      throw new HttpException(
        '项目不存在或无权限操作。',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 查询api接口
  async queryApi(
    userId: number,
    projectId: number,
    folderId: number | null,
    name: string,
    url: string,
    pageNo: number,
    pageSize: number,
  ) {
    if (!projectId || !pageNo || !pageSize) {
      throw new HttpException('请校验传参', HttpStatus.BAD_REQUEST);
    }

    const skipCount = (pageNo - 1) * pageSize;

    const condition: Record<string, any> = {};
    condition.isDeleted = 0;
    condition.projectId = projectId;
    if (folderId) {
      condition.folderId = folderId;
    }
    if (name) {
      condition.name = Like(`%${name}%`);
    }
    if (url) {
      condition.url = Like(`%${url}%`);
    }

    const [findApis, totalCount] = await this.apiRespository.findAndCount({
      where: condition,
      order: {
        id: 'DESC', // 按 id 降序排序
      },
      take: pageSize, // 指定查询数量
      skip: skipCount, // 指定跳过的记录数量
    });

    return { list: findApis, total: totalCount, pageNo, pageSize };
  }

  // 查询接口详情
  async queryApiDetail(id: number) {
    return await this.apiRespository.findOneBy({ id });
  }

  // 查询历史记录
  async queryHistory(apiId: number) {
    return await this.apiHistoryRepository.find({
      where: { apiId },
    });
  }

  // 移动api到其他目录
  async moveApi(userId: number, id: number, folderId: number) {
    const findApi = await this.apiRespository.findOneBy({ id });
    if (findApi) {
      findApi.folderId = folderId;
      findApi.updateUserId = userId;
      await this.apiRespository.save(findApi);
      return '移动成功';
    } else {
      throw new HttpException('api不存在', HttpStatus.BAD_REQUEST);
    }
  }
}
