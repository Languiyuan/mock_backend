import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ApiDto } from './dto/api.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Api } from './entities/Api.entity';
import { Like, Repository } from 'typeorm';
import { UserProject } from 'src/project/entities/UserProject.entity';

@Injectable()
export class ApiService {
  // apiRespository
  @InjectRepository(Api)
  private apiRespository: Repository<Api>;
  // 项目成员表
  @InjectRepository(UserProject)
  private userProjectRespository: Repository<UserProject>;

  // 添加接口
  async addApi(userId: number, apiDto: ApiDto) {
    // 判断是否已经存在一样的url
    const findApiByUrl = await this.apiRespository.findOneBy({
      url: apiDto.url,
    });

    if (findApiByUrl) {
      throw new HttpException('添加失败,url不能重复', HttpStatus.BAD_REQUEST);
    }

    const newApi = new Api();
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

  // 编辑接口
  // TODO 增加历史记录查询功能和应用功能，但是可以限制最多保存5 或者 10条历史记录
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
    folderId: number,
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
      take: pageSize, // 指定查询数量
      skip: skipCount, // 指定跳过的记录数量
      order: {
        id: 'ASC', // 按 id 降序排序
      },
    });

    return { findApis, totalCount };
  }
}
