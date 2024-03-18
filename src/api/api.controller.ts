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
    @Body('folderId') folderId: number,
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
}
