import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { ApiDto } from './dto/api.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Api } from './entities/Api.entity';
import { Like, Repository } from 'typeorm';
import { UserProject } from 'src/project/entities/UserProject.entity';
import { ApiHistory } from './entities/ApiHistory.entity';
import { Project } from 'src/project/entities/Project.entity';
import { validate } from 'class-validator';
import { RedisService } from '../redis/redis.service';
import { HttpService } from '@nestjs/axios';
// import { lastValueFrom } from 'rxjs';
import * as swaggerParseMock from 'swagger-parser-lanmock';
import { ProjectService } from 'src/project/project.service';
import { ConfigService } from '@nestjs/config';

// interface SingleParamsRule {
//   name: string;
//   type: string[];
//   required: boolean;
// }

// interface ApiParamsRule {
//   bodyParamsType: string; // 'object' or 'array'
//   bodyParams: SingleParamsRule[];
//   queryParams: SingleParamsRule[];
// }

@Injectable()
export class ApiService {
  // ConfigService
  @Inject(ConfigService)
  private configService: ConfigService;
  // apiRepository
  @InjectRepository(Api)
  private apiRepository: Repository<Api>;
  // 项目成员表
  @InjectRepository(UserProject)
  private userProjectRepository: Repository<UserProject>;
  // api history respository
  @InjectRepository(ApiHistory)
  private apiHistoryRepository: Repository<ApiHistory>;
  // 项目表
  @InjectRepository(Project)
  private projectRepository: Repository<Project>;
  // redis
  @Inject(RedisService)
  private redisService: RedisService;
  // axios httpServer
  @Inject(HttpService)
  private httpService: HttpService;
  @Inject(ProjectService)
  private projectService: ProjectService;

  // 添加接口
  async addApi(userId: number, apiDto: ApiDto) {
    // 判断是否已经存在一样的url
    const findApiByUrl = await this.apiRepository.findOneBy({
      url: apiDto.url,
      projectId: apiDto.projectId,
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
    newApi.paramsCheckOn = apiDto.paramsCheckOn;
    newApi.params = apiDto.params;
    newApi.createUserId = userId;
    newApi.updateUserId = userId;

    await this.apiRepository.save(newApi);

    // 添加到历史记录中
    const findApi = await this.apiRepository.findOneBy({
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
      newApiHistory.paramsCheckOn = apiDto.paramsCheckOn;
      newApiHistory.params = apiDto.params;
      newApiHistory.createUserId = userId;
      newApiHistory.updateUserId = userId;
      await this.apiHistoryRepository.save(newApiHistory);
    }
    return '添加成功';
  }

  // 删除接口
  async removeApi(userId: number, id: number, projectId: number) {
    // 判断用户是否有权限 是否是项目成员
    const findMember = await this.userProjectRepository.findOneBy({
      userId,
      projectId,
    });

    if (findMember) {
      const findApi = await this.apiRepository.findOneBy({ id, projectId });
      if (findApi) {
        findApi.isDeleted = 1;
        findApi.updateUserId = userId;
        await this.apiRepository.save(findApi);

        const findProject = await this.projectRepository.findOneBy({
          id: projectId,
        });
        if (findProject) {
          const redisKey = `/${findApi.projectSign}${findProject.baseUrl}${findApi.url}`;
          // 从redis中删除 不存在也不会报错
          await this.redisService.delete(redisKey);
        }

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
    const findMember = await this.userProjectRepository.findOneBy({
      userId,
      projectId,
    });

    if (findMember) {
      try {
        // 清除 reids 里的
        const findProject = await this.projectRepository.findOneBy({
          id: projectId,
        });
        const updatedApis = await this.apiRepository
          .createQueryBuilder()
          .where('id IN (:...ids)', { ids: ids }) // 根据指定的 id 列表进行筛选
          .getMany(); // 获取满足条件的所有记录

        if (updatedApis.length) {
          for (const api of updatedApis) {
            const redisKey = `/${api.projectSign}${findProject?.baseUrl}${api.url}`;
            // 从redis中删除 不存在也不会报错
            await this.redisService.delete(redisKey);
          }
        }

        await this.apiRepository
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
    const findMember = await this.userProjectRepository.findOneBy({
      userId,
      projectId: apiDto.projectId,
    });

    if (findMember) {
      const findApi = await this.apiRepository.findOneBy({
        id: apiDto.id,
        projectId: apiDto.projectId,
      });

      // 清除 reids 里的
      const findProject = await this.projectRepository.findOneBy({
        id: apiDto.projectId,
      });

      // 从redis中删除 不存在也不会报错 需要在存之前删一次，防止万一编辑的是url。删总是没错的
      this.redisService.delete(
        `/${findApi.projectSign}${findProject.baseUrl}${findApi.url}`,
      );

      // 如果mockRule 修改
      if (findApi.mockRule !== apiDto.mockRule) {
        // 查所有历史记录数量
        // const historyQueryBuilder = this.apiHistoryRepository
        //   .createQueryBuilder()
        //   .where('apiId = :apiId', { apiId: findApi.id });

        // const historyCount = await historyQueryBuilder.getCount();
        // // 限制数量5条
        // if (historyCount >= 5) {
        //   const findLastHistory = await historyQueryBuilder
        //     .orderBy('id', 'ASC')
        //     .getOne();

        //   await this.apiHistoryRepository.delete(findLastHistory.id);
        // }

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
        newApiHistory.paramsCheckOn = apiDto.paramsCheckOn;
        newApiHistory.params = apiDto.params;
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
        findApi.paramsCheckOn = apiDto.paramsCheckOn;
        findApi.params = apiDto.params;
        findApi.updateUserId = userId;

        await this.apiRepository.save(findApi);

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

    const [findApis, totalCount] = await this.apiRepository.findAndCount({
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
    return await this.apiRepository.findOneBy({ id });
  }

  // 查询历史记录
  async queryHistory(apiId: number, pageNo: number, pageSize: number) {
    const skipCount = (pageNo - 1) * pageSize;

    const [findApiHistory, totalCount] =
      await this.apiHistoryRepository.findAndCount({
        where: { apiId },
        order: {
          id: 'DESC', // 按 id 降序排序
        },
        take: pageSize, // 指定查询数量
        skip: skipCount, // 指定跳过的记录数量
      });

    return { list: findApiHistory, total: totalCount, pageNo, pageSize };
  }

  // 移动api到其他目录
  async moveApi(userId: number, id: number, folderId: number) {
    const findApi = await this.apiRepository.findOneBy({ id });
    if (findApi) {
      findApi.folderId = folderId;
      findApi.updateUserId = userId;
      await this.apiRepository.save(findApi);
      return '移动成功';
    } else {
      throw new HttpException('api不存在', HttpStatus.BAD_REQUEST);
    }
  }

  // 导出项目json文件
  async exportProjectAllApi(projectId: number) {
    const findApiList = await this.apiRepository.find({
      where: { projectId },
    });
    const list = findApiList.map((item) => {
      return {
        ...item,
        createUserId: null,
        updateUserId: null,
        folderId: null,
      };
    });

    return list;
  }

  // 导入接口
  async uploadProjectFile(
    userId: number,
    projectId: number,
    fileData: ApiDto[],
  ) {
    const resultVo = [];
    for (const dto of fileData) {
      const apiDto: ApiDto = Object.assign(new ApiDto(), dto); // 使用Object.assign进行对象属性拷贝
      apiDto.projectId = projectId;
      try {
        const errors = await validate(apiDto);
        if (errors.length > 0) {
          const allValueList = errors.map((error) => {
            const valueList = Object.values(error.constraints);
            return valueList.join(',');
          });
          throw new Error(allValueList.join(','));
        } else {
          await this.addApi(userId, apiDto);
          resultVo.push({ url: apiDto.url, status: 'success', error: null });
        }
      } catch (error) {
        resultVo.push({
          url: apiDto.url,
          status: 'failed',
          error: error.message,
        });
      }
    }
    return resultVo;
  }

  // 导入swagger
  async uploadProjectBySwagger(
    path: string,
    userId: number,
    projectId: number,
  ) {
    // const file = await lastValueFrom(
    //   this.httpService.get(
    //     `http://localhost:3000/lanMock/api/getUploadsFile?path=${path}`,
    //   ),
    // );
    // // 接口文档
    // const fileJSON = data.data
    const specs = await swaggerParseMock(
      `${this.configService.get('nest_server_origin')}:${this.configService.get('nest_server_port')}/lanMock/api/getUploadsFile?path=${path}`,
    );
    // 生成项目目录
    try {
      if (specs?.tags?.length) {
        for (const tag of specs.tags) {
          tag.name &&
            (await this.projectService.addFolder(userId, {
              folderName: tag.name,
              projectId: projectId,
            }));
        }
      }
    } catch (e) {}

    const folderList = await this.projectService.queryFolderList(projectId);
    // 添加api
    const resultVo = [];

    const newApi = new ApiDto();

    const keys = specs?.paths ? Object.keys(specs.paths) : [];
    if (keys.length) {
      for (const key of keys) {
        try {
          let method = '';
          if (specs.paths[key].hasOwnProperty('get')) {
            method = 'get';
          } else if (specs.paths[key].hasOwnProperty('post')) {
            method = 'post';
          } else {
            throw new Error('仅支持get|post');
          }
          const apiParseData = specs.paths[key][method] || {};
          // 获取tag 即目录
          let folderId: null | number = null;
          if (apiParseData.tags?.length) {
            const folder = folderList.find(
              (item) => item.name === apiParseData.tags[0],
            );
            folderId = folder?.id || null;
          }

          let mockRule: string = '';
          if (apiParseData.responses['200']) {
            mockRule = apiParseData.responses['200'].example || '';
          }

          const dto = {
            id: 1,
            projectId: projectId,
            folderId: folderId,
            name: apiParseData.summary,
            url: key,
            mockRule: mockRule,
            method: method.toLocaleUpperCase(),
            delay: 0,
            description: apiParseData.summary + '|' + apiParseData.description,
            on: 1,
            paramsCheckOn: 0,
            params: apiParseData.params
              ? JSON.stringify(apiParseData.params)
              : '',
            isDeleted: 0,
          };

          const apiDto: ApiDto = Object.assign(newApi, dto);
          try {
            const errors = await validate(apiDto);
            if (errors.length > 0) {
              const allValueList = errors.map((error) => {
                const valueList = Object.values(error.constraints);
                return valueList.join(',');
              });
              throw new Error(allValueList.join(','));
            } else {
              await this.addApi(userId, apiDto);
              resultVo.push({
                url: apiDto.url,
                status: 'success',
                error: null,
              });
            }
          } catch (error) {
            resultVo.push({
              url: apiDto.url,
              status: 'failed',
              error: error.message,
            });
          }
        } catch (error) {
          resultVo.push({
            url: key,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    return resultVo;
  }
}
