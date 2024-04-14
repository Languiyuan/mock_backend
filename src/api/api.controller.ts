import { Controller, Post, Body } from '@nestjs/common';
import { ApiService } from './api.service';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { ApiDto } from './dto/api.dto';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  // 添加接口
  @Post('add')
  @RequireLogin()
  async addApi(@UserInfo('userId') userId: number, @Body() apiDto: ApiDto) {
    return await this.apiService.addApi(userId, apiDto);
  }

  // 删除接口
  @Post('remove')
  @RequireLogin()
  async removeApi(
    @UserInfo('userId') userId: number,
    @Body('id') id: number,
    @Body('projectId') projectId: number,
  ) {
    return await this.apiService.removeApi(userId, id, projectId);
  }

  // 批量删除接口
  @Post('batchRemove')
  @RequireLogin()
  async batchRemoveApi(
    @UserInfo('userId') userId: number,
    @Body('ids') ids: number[],
    @Body('projectId') projectId: number,
  ) {
    return await this.apiService.batchRemoveApi(userId, ids, projectId);
  }

  // 编辑接口
  @Post('edit')
  @RequireLogin()
  async editApi(@UserInfo('userId') userId: number, @Body() apiDto: ApiDto) {
    return await this.apiService.editApi(userId, apiDto);
  }

  // 查询api列表接口
  @Post('query')
  @RequireLogin()
  async queryApi(
    @UserInfo('userId') userId: number,
    @Body('projectId') projectId: number,
    @Body('folderId') folderId: number | null,
    @Body('name') name: string,
    @Body('url') url: string,
    @Body('pageNo') pageNo: number,
    @Body('pageSize') pageSize: number,
  ) {
    return await this.apiService.queryApi(
      userId,
      projectId,
      folderId,
      name,
      url,
      pageNo,
      pageSize,
    );
  }

  // 查询单个接口的详情
  @Post('queryApiDetail')
  @RequireLogin()
  async queryApiDetail(@Body('id') id: number) {
    return await this.apiService.queryApiDetail(id);
  }

  // 查询api历史
  @Post('queryHistory')
  @RequireLogin()
  async queryHistory(@Body('id') id: number) {
    return await this.apiService.queryHistory(id);
  }

  @Post('moveApi')
  @RequireLogin()
  async moveApi(
    @UserInfo('userId') userId: number,
    @Body('id') id: number,
    @Body('folderId') folderId: number,
  ) {
    return await this.apiService.moveApi(userId, id, folderId);
  }
}
